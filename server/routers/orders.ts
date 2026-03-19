import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { createOrder, getOrderById, getAllOrders, updateOrderStatus, createOrderPrint, getOrderPrints, getOrdersByCustomerEmail, getConversationByOrderId, createOrderStatusUpdateMessage, createOrderLineItem, getOrderLineItems, getOrderStatusHistory, approveQuote, rejectQuote } from "../db";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendNewOrderNotificationEmail, sendOrderMilestoneEmail, sendOrderReadyForCollectionEmail } from "../_core/email";
import { generateAndUploadInvoice } from "../invoice-generator";
import { sendInvoiceEmail, sendInvoiceNotificationToAdmin } from "../invoice-email";
import { sendQuoteApprovedEmail, sendQuoteRejectedEmail } from "../quote-action-emails";

const CreateOrderInput = z.object({
  productId: z.number(),
  colorId: z.number(),
  sizeId: z.number(),
  quantity: z.number().min(1),
  customerFirstName: z.string().min(1),
  customerLastName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  customerCompany: z.string().optional(),
  deliveryMethod: z.enum(["collection", "delivery"]),
  deliveryAddress: z.string().optional(),
  additionalNotes: z.string().optional(),
  prints: z.array(z.object({
    printSizeId: z.number(),
    placementId: z.number(),
    uploadedFilePath: z.string(),
    uploadedFileName: z.string(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
  })),
  totalPriceEstimate: z.number(),
});

const CreateMultiItemOrderInput = z.object({
  cartItems: z.array(z.object({
    productId: z.number(),
    colorId: z.number(),
    sizeId: z.number(),
    quantity: z.number().min(1),
    printSelections: z.array(z.object({
      printSizeId: z.number(),
      placementId: z.number(),
      uploadedFilePath: z.string(),
      uploadedFileName: z.string(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
    })),
    subtotal: z.number(),
  })),
  customerFirstName: z.string().min(1),
  customerLastName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  customerCompany: z.string().optional(),
  deliveryMethod: z.enum(["collection", "delivery"]),
  deliveryAddress: z.string().optional(),
  additionalNotes: z.string().optional(),
  totalPriceEstimate: z.number(),
});

export const ordersRouter = router({
  create: publicProcedure
    .input(CreateOrderInput)
    .mutation(async ({ input }) => {
      try {
        const orderId = await createOrder({
          productId: input.productId,
          colorId: input.colorId,
          sizeId: input.sizeId,
          quantity: input.quantity,
          customerFirstName: input.customerFirstName,
          customerLastName: input.customerLastName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerCompany: input.customerCompany,
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress,
          additionalNotes: input.additionalNotes,
          status: "pending",
          totalPriceEstimate: input.totalPriceEstimate.toString(),
        });

        // Create order prints
        for (const print of input.prints) {
          await createOrderPrint({
            orderId,
            printSizeId: print.printSizeId,
            placementId: print.placementId,
            uploadedFilePath: print.uploadedFilePath,
            uploadedFileName: print.uploadedFileName,
            fileSize: print.fileSize,
            mimeType: print.mimeType,
          });
        }

        // Send confirmation email
        try {
          await sendOrderConfirmationEmail({
            orderId,
            customerName: input.customerFirstName,
            customerEmail: input.customerEmail,
            productName: "Custom DTF Print Order",
            quantity: input.quantity,
            totalPrice: parseFloat(input.totalPriceEstimate),
            status: "pending",
            orderDate: new Date(),
          });
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
        }

        // Notify admin
        try {
          await sendNewOrderNotificationEmail({
            orderId,
            customerName: input.customerFirstName,
            customerEmail: input.customerEmail,
            productName: "Custom DTF Print Order",
            quantity: input.quantity,
            totalPrice: parseFloat(input.totalPriceEstimate),
            status: "pending",
            orderDate: new Date(),
          });
        } catch (error) {
          console.error("Failed to send admin notification:", error);
        }

        return { orderId, status: "pending" };
      } catch (error) {
        console.error("Failed to create order:", error);
        throw error;
      }
    }),

  createMultiItem: publicProcedure
    .input(CreateMultiItemOrderInput)
    .mutation(async ({ input }) => {
      try {
        const orderId = await createOrder({
          productId: 0,
          colorId: 0,
          sizeId: 0,
          quantity: input.cartItems.reduce((sum, item) => sum + item.quantity, 0),
          customerFirstName: input.customerFirstName,
          customerLastName: input.customerLastName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerCompany: input.customerCompany,
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress,
          additionalNotes: input.additionalNotes,
          status: "pending",
          totalPriceEstimate: input.totalPriceEstimate.toString(),
        });

        // Create line items and prints for each cart item
        for (const cartItem of input.cartItems) {
          const lineItemId = await createOrderLineItem({
            orderId,
            productId: cartItem.productId,
            colorId: cartItem.colorId,
            sizeId: cartItem.sizeId,
            quantity: cartItem.quantity,
            placementId: cartItem.printSelections[0]?.placementId || 1,
            printSizeId: cartItem.printSelections[0]?.printSizeId || 1,
            unitPrice: (parseFloat(cartItem.subtotal) / cartItem.quantity).toString(),
            subtotal: cartItem.subtotal.toString(),
          });

          // Print selections are now stored in line items
          // Keep this for backward compatibility if needed
        }

        // Send confirmation email
        try {
          await sendOrderConfirmationEmail(
            input.customerEmail,
            input.customerFirstName,
            orderId,
            input.cartItems.reduce((sum, item) => sum + item.quantity, 0),
            input.totalPriceEstimate
          );
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
        }

        return { orderId, status: "pending" };
      } catch (error) {
        console.error("Failed to create multi-item order:", error);
        throw error;
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.id);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }
        return order;
      } catch (error) {
        console.error("Failed to fetch order:", error);
        throw error;
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.email) {
      throw new Error("User email not found");
    }

    try {
      const orders = await getOrdersByCustomerEmail(ctx.user.email);
      return orders;
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      throw error;
    }
  }),

  updateStatus: protectedProcedure
    .input(z.object({ orderId: z.number(), status: z.enum(["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]), adminNotes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        await updateOrderStatus(input.orderId, input.status, ctx.user.id, input.adminNotes);

        // Generate and send invoice when status changes to "quoted"
        if (input.status === "quoted") {
          try {
            const invoiceNumber = `INV-${input.orderId}-${Date.now()}`;
            const invoiceUrl = await generateAndUploadInvoice({
              orderId: input.orderId,
              invoiceNumber,
              totalPrice: parseFloat(order.totalPriceEstimate),
              depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : undefined,
              paymentMethod: order.paymentMethod || undefined,
            });

            // Send invoice email to customer
            await sendInvoiceEmail({
              orderId: input.orderId,
              customerEmail: order.customerEmail,
              customerName: `${order.customerFirstName} ${order.customerLastName}`,
              totalPrice: parseFloat(order.totalPriceEstimate),
              depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : undefined,
              paymentMethod: order.paymentMethod || undefined,
              invoicePdfUrl: invoiceUrl,
            });

            // Notify admin
            await sendInvoiceNotificationToAdmin({
              orderId: input.orderId,
              customerEmail: order.customerEmail,
              customerName: `${order.customerFirstName} ${order.customerLastName}`,
              totalPrice: parseFloat(order.totalPriceEstimate),
              depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : undefined,
              paymentMethod: order.paymentMethod || undefined,
            });
          } catch (invoiceError) {
            console.error("Failed to generate or send invoice:", invoiceError);
            // Don't throw - status update was successful, just log the invoice error
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to update order status:", error);
        throw error;
      }
    }),

  getConversation: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        const conversation = await getConversationByOrderId(input.orderId);
        return conversation;
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
        throw error;
      }
    }),

  addMessage: protectedProcedure
    .input(z.object({ orderId: z.number(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        await createOrderStatusUpdateMessage(input.orderId, input.message, "customer");
        return { success: true };
      } catch (error) {
        console.error("Failed to add message:", error);
        throw error;
      }
    }),

  getPrints: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        const prints = await getOrderPrints(input.orderId);
        return prints;
      } catch (error) {
        console.error("Failed to fetch prints:", error);
        throw error;
      }
    }),

  getStatusHistory: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        // Verify the order belongs to the current user
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        // Get status history
        const history = await getOrderStatusHistory(input.orderId);
        return history;
      } catch (error) {
        console.error("Failed to fetch order status history:", error);
        throw new Error("Failed to fetch order status history");
      }
    }),

  // Approve quote
  approveQuote: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        // Verify the order belongs to the current user
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        // Verify order is in quoted status
        if (order.status !== "quoted") {
          throw new Error("Order is not in quoted status");
        }

        // Approve the quote
        await approveQuote(input.orderId);

        // Send approval notification email
        try {
          await sendQuoteApprovedEmail(
            order.customerEmail,
            `${order.customerFirstName} ${order.customerLastName}`,
            input.orderId,
            parseFloat(order.totalPriceEstimate),
            parseFloat(order.depositAmount || "0"),
            order.paymentMethod || "full_payment"
          );
        } catch (error) {
          console.error("Failed to send quote approval email:", error);
        }

        return { success: true, message: "Quote approved successfully" };
      } catch (error) {
        console.error("Failed to approve quote:", error);
        throw error;
      }
    }),

  // Reject quote
  rejectQuote: protectedProcedure
    .input(z.object({ orderId: z.number(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        // Verify the order belongs to the current user
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        // Verify order is in quoted status
        if (order.status !== "quoted") {
          throw new Error("Order is not in quoted status");
        }

        // Reject the quote
        await rejectQuote(input.orderId, input.reason);

        // Send rejection notification email
        try {          await sendOrderMilestoneEmail({
            orderId: input.orderId,
            customerName: `${order.customerFirstName} ${order.customerLastName}`,
            customerEmail: order.customerEmail,
            productName: "Custom DTF Print Order",
            quantity: order.quantity,
            totalPrice: parseFloat(order.totalPriceEstimate),
            status: input.status,
            orderDate: order.createdAt,
          });
        } catch (error) {
          console.error("Failed to send quote rejection email:", error);
        }

        return { success: true, message: "Quote rejected successfully" };
      } catch (error) {
        console.error("Failed to reject quote:", error);
        throw error;
      }
    }),
  // Accept invoice
  acceptInvoice: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        if (order.status !== "quoted") {
          throw new Error("Order is not in quoted status");
        }

        // Update order status to approved and mark invoice as accepted
        await updateOrderStatus(input.orderId, "approved", undefined, "Invoice accepted by customer");

        // Update invoice acceptance timestamp
        const db = await getDb();
        if (db) {
          await db.update(orders).set({ invoiceAcceptedAt: new Date() }).where(eq(orders.id, input.orderId));
        }

        // Send confirmation email
        try {
          await sendOrderStatusUpdateEmail({
            orderId: input.orderId,
            customerName: `${order.customerFirstName} ${order.customerLastName}`,
            customerEmail: order.customerEmail,
            previousStatus: "quoted",
            newStatus: "approved",
            updateMessage: "Invoice accepted by customer",
          });
        } catch (error) {
          console.error("Failed to send invoice acceptance email:", error);
        }

        return { success: true, message: "Invoice accepted successfully" };
      } catch (error) {
        console.error("Failed to accept invoice:", error);
        throw error;
      }
    }),

  // Decline invoice
  declineInvoice: protectedProcedure
    .input(z.object({ orderId: z.number(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        if (order.status !== "quoted") {
          throw new Error("Order is not in quoted status");
        }

        // Update invoice decline information
        const db = await getDb();
        if (db) {
          await db
            .update(orders)
            .set({
              invoiceDeclinedAt: new Date(),
              invoiceDeclineReason: input.reason,
            })
            .where(eq(orders.id, input.orderId));
        }

        // Send notification email to customer and admin
        try {
          await sendOrderStatusUpdateEmail({
            orderId: input.orderId,
            customerName: `${order.customerFirstName} ${order.customerLastName}`,
            customerEmail: order.customerEmail,
            previousStatus: "quoted",
            newStatus: "pending",
            updateMessage: `Invoice declined: ${input.reason}`,
          });
        } catch (error) {
          console.error("Failed to send invoice decline email:", error);
        }

        return { success: true, message: "Invoice declined successfully" };
      } catch (error) {
        console.error("Failed to decline invoice:", error);
        throw error;
      }
    }),

  uploadPaymentProof: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      file: z.instanceof(Uint8Array),
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        const { uploadPaymentProof } = await import("../payment-proof-service");
        const result = await uploadPaymentProof(
          input.orderId,
          Buffer.from(input.file),
          input.fileName,
          input.mimeType
        );
        return result;
      } catch (error) {
        console.error("Failed to upload payment proof:", error);
        throw error;
      }
    }),

  getPaymentProof: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.email) {
        throw new Error("User email not found");
      }

      try {
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        const { getPaymentProofDetails } = await import("../payment-proof-service");
        return await getPaymentProofDetails(input.orderId);
      } catch (error) {
        console.error("Failed to get payment proof:", error);
        return null;
      }
    }),
});
