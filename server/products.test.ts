import { describe, it, expect, beforeAll } from 'vitest';
import { getAllProducts, getProductById, getProductColors, getProductSizes, getAllPrintPlacements, getAllPrintOptions } from './db';

describe('Product Data Loading', () => {
  describe('getAllProducts', () => {
    it('should return an array of products', async () => {
      const products = await getAllProducts();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should return products with required fields', async () => {
      const products = await getAllProducts();
      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('basePrice');
        expect(product).toHaveProperty('productType');
      }
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const products = await getAllProducts();
      if (products.length > 0) {
        const firstProduct = products[0];
        const product = await getProductById(firstProduct.id);
        expect(product).toBeDefined();
        expect(product?.id).toBe(firstProduct.id);
        expect(product?.name).toBe(firstProduct.name);
      }
    });

    it('should return null for non-existent product', async () => {
      const product = await getProductById(99999);
      expect(product).toBeNull();
    });
  });

  describe('getProductColors', () => {
    it('should return colors for a product', async () => {
      const products = await getAllProducts();
      if (products.length > 0) {
        const colors = await getProductColors(products[0].id);
        expect(Array.isArray(colors)).toBe(true);
        expect(colors.length).toBeGreaterThan(0);
      }
    });

    it('should return colors with required fields', async () => {
      const products = await getAllProducts();
      if (products.length > 0) {
        const colors = await getProductColors(products[0].id);
        if (colors.length > 0) {
          const color = colors[0];
          expect(color).toHaveProperty('id');
          expect(color).toHaveProperty('colorName');
          expect(color).toHaveProperty('colorHex');
        }
      }
    });
  });

  describe('getProductSizes', () => {
    it('should return sizes for a product', async () => {
      const products = await getAllProducts();
      if (products.length > 0) {
        const sizes = await getProductSizes(products[0].id);
        expect(Array.isArray(sizes)).toBe(true);
        expect(sizes.length).toBeGreaterThan(0);
      }
    });

    it('should return sizes with required fields', async () => {
      const products = await getAllProducts();
      if (products.length > 0) {
        const sizes = await getProductSizes(products[0].id);
        if (sizes.length > 0) {
          const size = sizes[0];
          expect(size).toHaveProperty('id');
          expect(size).toHaveProperty('sizeName');
        }
      }
    });
  });
});

describe('Print Data Loading', () => {
  describe('getAllPrintPlacements', () => {
    it('should return an array of print placements', async () => {
      const placements = await getAllPrintPlacements();
      expect(Array.isArray(placements)).toBe(true);
      expect(placements.length).toBeGreaterThan(0);
    });

    it('should return placements with required fields', async () => {
      const placements = await getAllPrintPlacements();
      if (placements.length > 0) {
        const placement = placements[0];
        expect(placement).toHaveProperty('id');
        expect(placement).toHaveProperty('placementName');
      }
    });

    it('should have specific placement types', async () => {
      const placements = await getAllPrintPlacements();
      const placementNames = placements.map(p => p.placementName);
      expect(placementNames).toContain('Front Chest');
      expect(placementNames).toContain('Back');
    });
  });

  describe('getAllPrintOptions', () => {
    it('should return an array of print options', async () => {
      const options = await getAllPrintOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });

    it('should return options with required fields', async () => {
      const options = await getAllPrintOptions();
      if (options.length > 0) {
        const option = options[0];
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('printSize');
        expect(option).toHaveProperty('additionalPrice');
      }
    });

    it('should have specific print sizes', async () => {
      const options = await getAllPrintOptions();
      const sizes = options.map(o => o.printSize);
      expect(sizes.length).toBeGreaterThan(0);
      // At least one size should be present
      expect(sizes[0]).toBeTruthy();
    });
  });
});
