import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createOrder, getOrderById, getAllOrders, updateOrderStatus, createOrderPrint, getOrderPrints, getOrdersByCustomerEmail, getConversationByOrderId, createOrderStatusUpdateMessage, createOrderLineItem, getOrderLineItems, getOrderStatusHistory, approveQuote, rejectQuote } from "../db";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendNewOrderNotificationEmail, sendOrderMilestoneEmail, sendOrderReadyForCollectionEmail } from "../_core/email";
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
          await sendOrderConfirmationEmail(
            input.customerEmail,
            input.customerFirstName,
            orderId,
            input.quantity,
            input.totalPriceEstimate
          );
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
        }

        // Notify admin
        try {
          await sendNewOrderNotificationEmail(
            input.customerEmail,
            input.customerFirstName,
            orderId,
            input.quantity,
            input.totalPriceEstimate
          );
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
            subtotal: cartItem.subtotal.toString(),
          });

          for (const print of cartItem.printSelections) {
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
        await updateOrderStatus(input.orderId, input.status, ctx.user.id, input.adminNotes);
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
        try {
          await sendQuoteRejectedEmail(
            order.customerEmail,
            `${order.customerFirstName} ${order.customerLastName}`,
            input.orderId,
            input.reason
          );
        } catch (error) {
          console.error("Failed to send quote rejection email:", error);
        }

        return { success: true, message: "Quote rejected successfully" };
      } catch (error) {
        console.error("Failed to reject quote:", error);
        throw error;
      }
    }),
});
