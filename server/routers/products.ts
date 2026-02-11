import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getAllProducts, getProductById, getProductColors, getProductSizes, getAllPrintOptions, getAllPrintPlacements } from "../db";
import { calculateOrderPrice, getPrintOptions, getProductPrice } from "../pricing";

export const productsRouter = router({
  list: publicProcedure.query(async () => {
    return getAllProducts();
  }),

  getById: publicProcedure.input((val: unknown) => {
    if (typeof val === "object" && val !== null && "id" in val) {
      return { id: (val as { id: unknown }).id };
    }
    throw new Error("Invalid input");
  }).query(async ({ input }) => {
    const productId = typeof input.id === "number" ? input.id : parseInt(String(input.id));
    const product = await getProductById(productId);
    if (!product) {
      throw new Error("Product not found");
    }
    const colors = await getProductColors(productId);
    const sizes = await getProductSizes(productId);
    return { ...product, colors, sizes };
  }),

  printOptions: publicProcedure.query(async () => {
    return getAllPrintOptions();
  }),

  printPlacements: publicProcedure.query(async () => {
    return getAllPrintPlacements();
  }),

  calculatePrice: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        printPlacements: z.array(
          z.object({
            printSizeId: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      return calculateOrderPrice(input);
    }),

  getPrintOptions: publicProcedure.query(async () => {
    return getPrintOptions();
  }),

  getProductPrice: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return getProductPrice(input.productId);
    }),
});
