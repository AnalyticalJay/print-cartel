import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, paymentRecords, products, productColors, productSizes, orderPrints, printPlacements, printOptions, orderLineItems } from "../../drizzle/schema";
import { createOrder, getOrderById, getAllOrders, updateOrderStatus, createOrderPrint, getOrderPrints, getOrdersByCustomerEmail, getConversationByOrderId, createOrderStatusUpdateMessage, createOrderLineItem, getOrderLineItems, getOrderStatusHistory } from "../db";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendNewOrderNotificationEmail, sendOrderMilestoneEmail, sendOrderReadyForCollectionEmail } from "../_core/email";
import { generateAndUploadInvoice } from "../invoice-generator";
import { sendInvoiceEmail, sendInvoiceNotificationToAdmin } from "../invoice-email";

import { sendInvoiceReceivedEmail } from "../invoice-received-email";
import { sendPaymentConfirmationEmail } from "../payment-confirmation-email";

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

        // Create order prints — uploadedFilePath must be a real S3 URL
        for (const print of input.prints) {
          if (!print.uploadedFilePath || !print.uploadedFilePath.startsWith("http")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Artwork file for placement ${print.placementId} was not uploaded to storage. Please re-upload the file and try again.`,
            });
          }
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
          const db = await getDb();
          // Resolve product, color, size, placement, printSize names for the email
          let productName = "Custom DTF Print Order";
          let colorName: string | undefined;
          let sizeName: string | undefined;
          const emailLineItems: Array<{ productName: string; colorName?: string; sizeName?: string; quantity: number; placementName?: string; printSizeName?: string }> = [];
          if (db) {
            const [prod] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
            const [col] = await db.select().from(productColors).where(eq(productColors.id, input.colorId)).limit(1);
            const [sz] = await db.select().from(productSizes).where(eq(productSizes.id, input.sizeId)).limit(1);
            if (prod) productName = prod.name;
            if (col) colorName = col.colorName;
            if (sz) sizeName = sz.sizeName;
            // Resolve placement and printSize for each print
            for (const print of input.prints) {
              const [placement] = await db.select().from(printPlacements).where(eq(printPlacements.id, print.placementId)).limit(1);
              const [printOpt] = await db.select().from(printOptions).where(eq(printOptions.id, print.printSizeId)).limit(1);
              emailLineItems.push({
                productName,
                colorName,
                sizeName,
                quantity: input.quantity,
                placementName: placement?.placementName,
                printSizeName: printOpt?.printSize,
              });
            }
          }
          await sendOrderConfirmationEmail({
            orderId,
            customerName: input.customerFirstName,
            customerEmail: input.customerEmail,
            productName,
            quantity: input.quantity,
            totalPrice: input.totalPriceEstimate,
            status: "pending",
            orderDate: new Date(),
            lineItems: emailLineItems.length > 0 ? emailLineItems : undefined,
            trackingUrl: `https://printcartel.co.za/account`,
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
            totalPrice: input.totalPriceEstimate,
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
          const subtotalNum = typeof cartItem.subtotal === 'string' ? parseFloat(cartItem.subtotal) : cartItem.subtotal;
          const unitPrice = (subtotalNum / cartItem.quantity).toString();
          const subtotal = subtotalNum.toString();
          await createOrderLineItem({
            orderId,
            productId: cartItem.productId,
            colorId: cartItem.colorId,
            sizeId: cartItem.sizeId,
            quantity: cartItem.quantity,
            placementId: cartItem.printSelections[0]?.placementId ?? 0,
            printSizeId: cartItem.printSelections[0]?.printSizeId ?? 0,
            unitPrice,
            subtotal,
          });

          // Persist artwork files to orderPrints — uploadedFilePath must be a real S3 URL
          for (const printSel of cartItem.printSelections) {
            if (!printSel.uploadedFilePath || !printSel.uploadedFilePath.startsWith("http")) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Artwork file for placement ${printSel.placementId} was not uploaded to storage. Please re-upload the file and try again.`,
              });
            }
            await createOrderPrint({
              orderId,
              printSizeId: printSel.printSizeId,
              placementId: printSel.placementId,
              uploadedFilePath: printSel.uploadedFilePath,
              uploadedFileName: printSel.uploadedFileName,
              fileSize: printSel.fileSize,
              mimeType: printSel.mimeType,
            });
          }
        }

        // Send confirmation email
        try {
          const db = await getDb();
          const multiEmailLineItems: Array<{ productName: string; colorName?: string; sizeName?: string; quantity: number; placementName?: string; printSizeName?: string }> = [];
          if (db) {
            for (const cartItem of input.cartItems) {
              const [prod] = await db.select().from(products).where(eq(products.id, cartItem.productId)).limit(1);
              const [col] = await db.select().from(productColors).where(eq(productColors.id, cartItem.colorId)).limit(1);
              const [sz] = await db.select().from(productSizes).where(eq(productSizes.id, cartItem.sizeId)).limit(1);
              const firstSel = cartItem.printSelections[0];
              let placementName: string | undefined;
              let printSizeName: string | undefined;
              if (firstSel) {
                const [placement] = await db.select().from(printPlacements).where(eq(printPlacements.id, firstSel.placementId)).limit(1);
                const [printOpt] = await db.select().from(printOptions).where(eq(printOptions.id, firstSel.printSizeId)).limit(1);
                placementName = placement?.placementName;
                printSizeName = printOpt?.printSize;
              }
              multiEmailLineItems.push({
                productName: prod?.name || "Custom DTF Print",
                colorName: col?.colorName,
                sizeName: sz?.sizeName,
                quantity: cartItem.quantity,
                placementName,
                printSizeName,
              });
            }
          }
          await sendOrderConfirmationEmail({
            orderId,
            customerName: `${input.customerFirstName} ${input.customerLastName}`,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            productName: "Custom DTF Print Order",
            quantity: input.cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: input.totalPriceEstimate,
            status: "pending",
            orderDate: new Date(),
            lineItems: multiEmailLineItems.length > 0 ? multiEmailLineItems : undefined,
            trackingUrl: `https://printcartel.co.za/account`,
          });
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

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
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
    .input(z.object({ orderId: z.number(), status: z.enum(["pending", "approved", "in-production", "completed", "shipped", "cancelled"]), adminNotes: z.string().optional() }))
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

        // Generate and send invoice when status changes to "approved"
        if (input.status === "approved") {
          try {
            const invoiceNumber = `INV-${input.orderId}-${Date.now()}`;
            const invoiceUrl = await generateAndUploadInvoice({
              orderId: input.orderId,
              invoiceNumber,
              totalPrice: parseFloat(order.totalPriceEstimate),
              deliveryCharge: order.deliveryCharge ? parseFloat(order.deliveryCharge) : undefined,
              paymentStatus: (order.paymentStatus === "paid" ? "paid" : "unpaid") as "unpaid" | "paid",
              customerFirstName: order.customerFirstName,
              customerLastName: order.customerLastName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
            });

            // Send invoice email to customer
            await sendInvoiceEmail({
              orderId: input.orderId,
              customerEmail: order.customerEmail,
              customerName: `${order.customerFirstName} ${order.customerLastName}`,
              totalPrice: parseFloat(order.totalPriceEstimate),
              deliveryCharge: order.deliveryCharge ? parseFloat(order.deliveryCharge) : undefined,
              paymentMethod: "full_payment",
              invoicePdfUrl: invoiceUrl,
            });

            // Notify admin
            await sendInvoiceNotificationToAdmin({
              orderId: input.orderId,
              customerEmail: order.customerEmail,
              customerName: `${order.customerFirstName} ${order.customerLastName}`,
              totalPrice: parseFloat(order.totalPriceEstimate),
              deliveryCharge: order.deliveryCharge ? parseFloat(order.deliveryCharge) : undefined,
              paymentMethod: "full_payment",
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

        // Note: createOrderStatusUpdateMessage requires conversationId, orderId, previousStatus, newStatus
        // For now, we'll skip this call as it needs refactoring
        // await createOrderStatusUpdateMessage(conversationId, input.orderId, previousStatus, newStatus);
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

        if (true) {
          throw new Error("Order is not in quoted status");
        }

        // Update order status to approved and mark invoice as accepted
        await updateOrderStatus(input.orderId, "approved", undefined, "Invoice accepted by customer");

        // Update invoice acceptance timestamp
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }
        await db!.update(orders).set({ invoiceAcceptedAt: new Date() }).where(eq(orders.id, input.orderId));

        // Send confirmation email
        try {
          await sendOrderStatusUpdateEmail({
            orderId: input.orderId,
            customerName: `${order!.customerFirstName} ${order!.customerLastName}`,
            customerEmail: order!.customerEmail,
            previousStatus: "pending",
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

        if (true) {
          throw new Error("Order is not in quoted status");
        }

        // Update invoice decline information
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        await db!
          .update(orders)
          .set({
            invoiceDeclinedAt: new Date(),
            invoiceDeclineReason: input.reason,
          })
          .where(eq(orders.id, input.orderId));

        // Send notification email to customer and admin
        try {
          await sendOrderStatusUpdateEmail({
            orderId: input.orderId,
            customerName: `${order!.customerFirstName} ${order!.customerLastName}`,
            customerEmail: order!.customerEmail,
            previousStatus: "pending",
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

  // Get orders by customer email
  getByEmail: protectedProcedure
    .input(z.object({ email: z.string().email().optional() }))
    .query(async ({ ctx, input }) => {
      const email = input.email || ctx.user?.email;
      if (!email) {
        throw new Error("User email not found");
      }
      try {
        return await getOrdersByCustomerEmail(email);
      } catch (error) {
        console.error("Failed to fetch orders by email:", error);
        throw error;
      }
    }),

  // Get order history for a customer
  getUserOrderHistory: protectedProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Fetch orders for the customer, ordered by creation date (newest first)
        const customerOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.customerEmail, input.customerEmail))
          .orderBy(orders.createdAt)
          .limit(input.limit)
          .offset(input.offset);

        // Return orders with parsed decimal values
        return customerOrders.map((order) => ({
          ...order,
          totalPriceEstimate: parseFloat(order.totalPriceEstimate as any),
          depositAmount: parseFloat(order.depositAmount as any) || 0,
          deliveryCharge: parseFloat(order.deliveryCharge as any) || 0,
          amountPaid: parseFloat(order.amountPaid as any) || 0,
        }));
      } catch (error) {
        console.error("Failed to fetch order history:", error);
        throw error;
      }
    }),

  getPaymentRecords: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify order belongs to user
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length || orderResult[0].customerEmail !== ctx.user?.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        // Fetch payment records for this order
        const records = await db
          .select()
          .from(paymentRecords)
          .where(eq(paymentRecords.orderId, input.orderId))
          .orderBy(paymentRecords.createdAt);

        return records;
      } catch (error) {
        console.error("Failed to fetch payment records:", error);
        throw error;
      }
    }),

  /**
   * Public procedure: fetch order details by PayFast m_payment_id.
   * Used by the /payment/success page after PayFast redirects back.
   * m_payment_id format: "order-{orderId}"
   * Returns enriched order data (product, color, size, prints) without
   * requiring the user to be authenticated — PayFast may redirect before
   * the session cookie is fully established.
   */
  getByPaymentId: publicProcedure
    .input(z.object({ mPaymentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Parse orderId from "order-{id}" format
        const match = input.mPaymentId.match(/order[-_](\d+)/);
        if (!match) throw new Error("Invalid payment ID format");
        const orderId = parseInt(match[1], 10);

        // Fetch the order
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!orderResult.length) throw new Error("Order not found");
        const order = orderResult[0];

        // Fetch product details
        const productResult = await db
          .select()
          .from(products)
          .where(eq(products.id, order.productId))
          .limit(1);
        const product = productResult[0] ?? null;

        // Fetch color details
        const colorResult = await db
          .select()
          .from(productColors)
          .where(eq(productColors.id, order.colorId))
          .limit(1);
        const color = colorResult[0] ?? null;

        // Fetch size details
        const sizeResult = await db
          .select()
          .from(productSizes)
          .where(eq(productSizes.id, order.sizeId))
          .limit(1);
        const size = sizeResult[0] ?? null;

        // Fetch order prints with placement and print size info
        const printsResult = await db
          .select()
          .from(orderPrints)
          .where(eq(orderPrints.orderId, orderId));

        const enrichedPrints = await Promise.all(
          printsResult.map(async (print) => {
            const placementResult = await db
              .select()
              .from(printPlacements)
              .where(eq(printPlacements.id, print.placementId))
              .limit(1);
            const printSizeResult = await db
              .select()
              .from(printOptions)
              .where(eq(printOptions.id, print.printSizeId))
              .limit(1);
            return {
              ...print,
              placementName: placementResult[0]?.placementName ?? "Unknown",
              printSize: printSizeResult[0]?.printSize ?? "Unknown",
            };
          })
        );

        return {
          order: {
            ...order,
            totalPriceEstimate: parseFloat(order.totalPriceEstimate as any),
            amountPaid: parseFloat(order.amountPaid as any) || 0,
            deliveryCharge: parseFloat(order.deliveryCharge as any) || 0,
          },
          product,
          color,
          size,
          prints: enrichedPrints,
        };
      } catch (error) {
        console.error("Failed to fetch order by payment ID:", error);
        throw error;
      }
    }),

  // Get full order detail for the authenticated customer (includes prints, line items, payment status)
  getMyOrderDetail: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orderResult = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!orderResult.length) throw new Error("Order not found");
      const order = orderResult[0];

      // Security: only the order owner can view it
      if (order.customerEmail !== ctx.user?.email) {
        throw new Error("Unauthorized: Order does not belong to this user");
      }

      // Fetch prints with placement, print size, and approval status
      const prints = await db.select().from(orderPrints).where(eq(orderPrints.orderId, input.orderId));
      const enrichedPrints = await Promise.all(
        prints.map(async (print) => {
          const [placement, printSize] = await Promise.all([
            db.select().from(printPlacements).where(eq(printPlacements.id, print.placementId)).limit(1),
            db.select().from(printOptions).where(eq(printOptions.id, print.printSizeId)).limit(1),
          ]);
          return {
            ...print,
            fileSize: print.fileSize ? Number(print.fileSize) : null,
            placement: placement[0] || null,
            printSize: printSize[0] || null,
          };
        })
      );

      // Fetch line items for multi-item orders
      const lineItemsRaw = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, input.orderId));
      const enrichedLineItems = await Promise.all(
        lineItemsRaw.map(async (item) => {
          const [product, color, size] = await Promise.all([
            db.select().from(products).where(eq(products.id, item.productId)).limit(1),
            db.select().from(productColors).where(eq(productColors.id, item.colorId)).limit(1),
            db.select().from(productSizes).where(eq(productSizes.id, item.sizeId)).limit(1),
          ]);
          return {
            ...item,
            unitPrice: parseFloat(item.unitPrice as any),
            subtotal: parseFloat(item.subtotal as any),
            product: product[0] || null,
            color: color[0] || null,
            size: size[0] || null,
          };
        })
      );

      // Fetch single-item product/color/size
      const [product, color, size] = await Promise.all([
        order.productId ? db.select().from(products).where(eq(products.id, order.productId)).limit(1) : Promise.resolve([]),
        order.colorId ? db.select().from(productColors).where(eq(productColors.id, order.colorId)).limit(1) : Promise.resolve([]),
        order.sizeId ? db.select().from(productSizes).where(eq(productSizes.id, order.sizeId)).limit(1) : Promise.resolve([]),
      ]);

      // Fetch payment records
      const payments = await db.select().from(paymentRecords).where(eq(paymentRecords.orderId, input.orderId));

      return {
        ...order,
        totalPriceEstimate: parseFloat(order.totalPriceEstimate as any),
        amountPaid: parseFloat(order.amountPaid as any) || 0,
        depositAmount: parseFloat(order.depositAmount as any) || 0,
        deliveryCharge: parseFloat(order.deliveryCharge as any) || 0,
        product: (product as any[])[0] || null,
        color: (color as any[])[0] || null,
        size: (size as any[])[0] || null,
        prints: enrichedPrints,
        lineItems: enrichedLineItems,
        paymentRecords: payments,
        isMultiItemOrder: order.productId === 0,
      };
    }),

  // Allow customers to upload/replace artwork for a specific print on their order
  updatePrintArtwork: protectedProcedure
    .input(
      z.object({
        printId: z.number(),
        orderId: z.number(),
        uploadedFilePath: z.string().min(1),
        uploadedFileName: z.string().min(1),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Verify the print belongs to an order owned by this user
      const [print] = await db.select().from(orderPrints).where(eq(orderPrints.id, input.printId)).limit(1);
      if (!print) throw new Error("Print not found");
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new Error("Order not found");
      // Only allow if order belongs to this user
      const isOwner = order.userId === ctx.user.id || order.customerEmail === ctx.user.email;
      if (!isOwner) throw new Error("Unauthorized");
      // Don't allow re-upload if order is already in production or beyond
      if (["in-production", "completed", "shipped", "cancelled"].includes(order.status)) {
        throw new Error("Cannot update artwork for an order that is already in production or completed");
      }
      await db
        .update(orderPrints)
        .set({
          uploadedFilePath: input.uploadedFilePath,
          uploadedFileName: input.uploadedFileName,
          fileSize: input.fileSize ?? null,
          mimeType: input.mimeType ?? null,
          // Reset approval status when artwork is re-uploaded
          designApprovalStatus: "pending",
          designApprovalNotes: null,
          designApprovedAt: null,
          designReviewedBy: null,
        })
        .where(eq(orderPrints.id, input.printId));
      return { success: true, printId: input.printId };
    }),
});
