import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { productsRouter } from "./routers/products";
import { ordersRouter } from "./routers/orders";
import { filesRouter } from "./routers/files";
import { adminRouter } from "./routers/admin";
import { quotesRouter } from "./routers/quotes";
import { chatRouter } from "./routers/chat";
import { resellerRouter } from "./routers/reseller";
import { gangSheets } from "./routers/gangsheets";
import { productionRouter } from "./routers/production";
import { referralRouter } from "./routers/referral";
import { templatesRouter } from "./routers/templates";
import { notificationsRouter } from "./routers/notifications";

const gangSheetsRouter = gangSheets;

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  products: productsRouter,
  orders: ordersRouter,
  files: filesRouter,
  admin: adminRouter,
  quotes: quotesRouter,
  chat: chatRouter,
  reseller: resellerRouter,
  gangSheets: gangSheetsRouter,
  production: productionRouter,
  referral: referralRouter,
  templates: templatesRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
