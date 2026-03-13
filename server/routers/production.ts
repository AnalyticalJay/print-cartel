import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getProductionQueueByStatus,
  getAllProductionQueue,
  updateProductionQueueStatus,
  assignProductionQueueToAdmin,
  updateProductionQueuePriority,
  getProductionQueueByAdminId,
  getProductionQueueByOrderId,
  createProductionQueueEntry,
  getOrderById,
} from "../db";

export const productionRouter = router({
  // Get all orders grouped by status for Kanban board
  getKanbanBoard: adminProcedure.query(async () => {
    const statuses = ["pending", "quoted", "approved", "in-production", "ready", "completed"];
    const kanbanData: Record<string, any[]> = {};

    for (const status of statuses) {
      kanbanData[status] = await getProductionQueueByStatus(status);
    }

    return kanbanData;
  }),

  // Get production queue for current admin
  getMyProductionQueue: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new Error("User not authenticated");
    return await getProductionQueueByAdminId(ctx.user.id);
  }),

  // Update order status (drag and drop in Kanban)
  updateOrderStatus: adminProcedure
    .input(
      z.object({
        queueId: z.number(),
        status: z.enum(["pending", "quoted", "approved", "in-production", "ready", "completed", "shipped", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateProductionQueueStatus(input.queueId, input.status, input.notes);
    }),

  // Assign order to admin
  assignToAdmin: adminProcedure
    .input(
      z.object({
        queueId: z.number(),
        adminId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await assignProductionQueueToAdmin(input.queueId, input.adminId);
    }),

  // Update order priority
  updatePriority: adminProcedure
    .input(
      z.object({
        queueId: z.number(),
        priority: z.enum(["low", "normal", "high", "urgent"]),
      })
    )
    .mutation(async ({ input }) => {
      return await updateProductionQueuePriority(input.queueId, input.priority);
    }),

  // Get production queue entry for specific order
  getByOrderId: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await getProductionQueueByOrderId(input.orderId);
    }),

  // Get all production queue entries
  getAll: adminProcedure.query(async () => {
    return await getAllProductionQueue();
  }),

  // Create production queue entry for new order
  createQueueEntry: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        estimatedCompletionDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createProductionQueueEntry(input.orderId, input.estimatedCompletionDate);
    }),
});
