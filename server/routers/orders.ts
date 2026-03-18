import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createOrder, getOrderById, getAllOrders, updateOrderStatus, createOrderPrint, getOrderPrints, getOrdersByCustomerEmail, getConversationByOrderId, createOrderStatusUpdateMessage, createOrderLineItem, getOrderLineItems } from "../db";
import { sendOrderNotificationEmail } from "../email";
import { sendOrderConfirmationEmail } from "../email-confirmation";

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
  create: publicProcedure.input(CreateOrderInput).mutation(async ({ input }) => {
    const orderId = await createOrder({
      productId: input.productId,
      colorId: input.colorId,
      sizeId: input.sizeId,
      quantity: input.quantity,
      customerFirstName: input.customerFirstName,
      customerLastName: input.customerLastName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      customerCompany: input.customerCompany || null,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: input.deliveryAddress || null,
      deliveryCharge: input.deliveryMethod === "delivery" ? "150" : "0",
      additionalNotes: input.additionalNotes || null,
      totalPriceEstimate: input.totalPriceEstimate.toString(),
      status: "pending",
    });

    // Create order prints
    for (const print of input.prints) {
      await createOrderPrint({
        orderId,
        printSizeId: print.printSizeId,
        placementId: print.placementId,
        uploadedFilePath: print.uploadedFilePath,
        uploadedFileName: print.uploadedFileName,
        fileSize: print.fileSize || null,
        mimeType: print.mimeType || null,
      });
    }

    // Send admin notification email
    try {
      await sendOrderNotificationEmail({
        orderId,
        customerName: `${input.customerFirstName} ${input.customerLastName}`,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerCompany: input.customerCompany,
        totalPrice: input.totalPriceEstimate,
      });
    } catch (error) {
      console.error("Failed to send order notification email:", error);
      // Don't fail the order creation if email fails
    }

    // Send customer confirmation email
    try {
      await sendOrderConfirmationEmail(
        orderId,
        `${input.customerFirstName} ${input.customerLastName}`,
        input.customerEmail,
        input.deliveryMethod,
        input.totalPriceEstimate
      );
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      // Don't fail the order creation if email fails
    }

    return { orderId: Number(orderId), status: "pending" };
  }),


  createMultiItem: publicProcedure.input(CreateMultiItemOrderInput).mutation(async ({ input }) => {
    // Create the main order with first item details
    const firstItem = input.cartItems[0];
    const orderId = await createOrder({
      productId: firstItem.productId,
      colorId: firstItem.colorId,
      sizeId: firstItem.sizeId,
      quantity: firstItem.quantity,
      customerFirstName: input.customerFirstName,
      customerLastName: input.customerLastName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      customerCompany: input.customerCompany || null,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: input.deliveryAddress || null,
      deliveryCharge: input.deliveryMethod === "delivery" ? "150" : "0",
      additionalNotes: input.additionalNotes || null,
      totalPriceEstimate: input.totalPriceEstimate.toString(),
      status: "pending",
    });

    // Create line items for each cart item
    for (const item of input.cartItems) {
      // Use the first print selection for placement and print size
      const firstPrint = item.printSelections[0];
      await createOrderLineItem({
        orderId,
        productId: item.productId,
        colorId: item.colorId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        placementId: firstPrint.placementId,
        printSizeId: firstPrint.printSizeId,
        unitPrice: (item.subtotal / item.quantity).toString(),
        subtotal: item.subtotal.toString(),
      });

      // Create prints for this line item
      for (const print of item.printSelections) {
        await createOrderPrint({
          orderId,
          printSizeId: print.printSizeId,
          placementId: print.placementId,
          uploadedFilePath: print.uploadedFilePath,
          uploadedFileName: print.uploadedFileName,
          fileSize: print.fileSize || null,
          mimeType: print.mimeType || null,
        });
      }
    }

    // Send admin notification email
    try {
      await sendOrderNotificationEmail({
        orderId,
        customerName: `${input.customerFirstName} ${input.customerLastName}`,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerCompany: input.customerCompany,
        totalPrice: input.totalPriceEstimate,
      });
    } catch (error) {
      console.error("Failed to send order notification email:", error);
    }

    // Send customer confirmation email
    try {
      await sendOrderConfirmationEmail(
        orderId,
        `${input.customerFirstName} ${input.customerLastName}`,
        input.customerEmail,
        input.deliveryMethod,
        input.totalPriceEstimate
      );
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
    }

    return { orderId: Number(orderId), status: "pending", itemCount: input.cartItems.length };
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const order = await getOrderById(input.id);
    if (!order) {
      throw new Error("Order not found");
    }
    const prints = await getOrderPrints(input.id);
    return { ...order, prints };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return getAllOrders();
  }),

  updateStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      newStatus: z.enum(["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can update order status");
      }

      const order = await getOrderById(input.orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      const previousStatus = order.status;
      await updateOrderStatus(input.orderId, input.newStatus);

      // Create system message in chat if conversation exists
      const conversation = await getConversationByOrderId(input.orderId);
      if (conversation) {
        await createOrderStatusUpdateMessage(
          conversation.id,
          input.orderId,
          previousStatus,
          input.newStatus
        );
      }

      return { success: true, previousStatus, newStatus: input.newStatus };
    }),

  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const customerOrders = await getOrdersByCustomerEmail(input.email);
      const ordersWithPrints = await Promise.all(
        customerOrders.map(async (order) => {
          const prints = await getOrderPrints(order.id);
          return { ...order, prints };
        })
      );
      return ordersWithPrints;
    }),

  getUserOrderHistory: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.email) {
      throw new Error("User email not found");
    }
    const customerOrders = await getOrdersByCustomerEmail(ctx.user.email);
    const ordersWithPrints = await Promise.all(
      customerOrders.map(async (order) => {
        const prints = await getOrderPrints(order.id);
        const lineItems = await getOrderLineItems(order.id);
        return { ...order, prints, lineItems };
      })
    );
    return ordersWithPrints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }),
});
