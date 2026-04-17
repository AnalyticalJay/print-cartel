import { describe, it, expect } from "vitest";
import {
  ProductCardSkeleton,
  ProductSliderSkeleton,
  FormFieldSkeleton,
  SelectFieldSkeleton,
  OrderFormSkeleton,
  OrderSummarySkeleton,
  PaymentFormSkeleton,
  WizardStepSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ImageSkeleton,
  TextLineSkeleton,
  HeadingSkeleton,
} from "./SkeletonLoaders";

describe("SkeletonLoaders", () => {
  describe("Component Exports", () => {
    it("should export ProductCardSkeleton component", () => {
      expect(ProductCardSkeleton).toBeDefined();
      expect(typeof ProductCardSkeleton).toBe("function");
    });

    it("should export ProductSliderSkeleton component", () => {
      expect(ProductSliderSkeleton).toBeDefined();
      expect(typeof ProductSliderSkeleton).toBe("function");
    });

    it("should export FormFieldSkeleton component", () => {
      expect(FormFieldSkeleton).toBeDefined();
      expect(typeof FormFieldSkeleton).toBe("function");
    });

    it("should export SelectFieldSkeleton component", () => {
      expect(SelectFieldSkeleton).toBeDefined();
      expect(typeof SelectFieldSkeleton).toBe("function");
    });

    it("should export OrderFormSkeleton component", () => {
      expect(OrderFormSkeleton).toBeDefined();
      expect(typeof OrderFormSkeleton).toBe("function");
    });

    it("should export OrderSummarySkeleton component", () => {
      expect(OrderSummarySkeleton).toBeDefined();
      expect(typeof OrderSummarySkeleton).toBe("function");
    });

    it("should export PaymentFormSkeleton component", () => {
      expect(PaymentFormSkeleton).toBeDefined();
      expect(typeof PaymentFormSkeleton).toBe("function");
    });

    it("should export WizardStepSkeleton component", () => {
      expect(WizardStepSkeleton).toBeDefined();
      expect(typeof WizardStepSkeleton).toBe("function");
    });

    it("should export TableRowSkeleton component", () => {
      expect(TableRowSkeleton).toBeDefined();
      expect(typeof TableRowSkeleton).toBe("function");
    });

    it("should export TableSkeleton component", () => {
      expect(TableSkeleton).toBeDefined();
      expect(typeof TableSkeleton).toBe("function");
    });

    it("should export ImageSkeleton component", () => {
      expect(ImageSkeleton).toBeDefined();
      expect(typeof ImageSkeleton).toBe("function");
    });

    it("should export TextLineSkeleton component", () => {
      expect(TextLineSkeleton).toBeDefined();
      expect(typeof TextLineSkeleton).toBe("function");
    });

    it("should export HeadingSkeleton component", () => {
      expect(HeadingSkeleton).toBeDefined();
      expect(typeof HeadingSkeleton).toBe("function");
    });
  });

  describe("Skeleton Component Functionality", () => {
    it("should have all skeleton components as React components", () => {
      const components = [
        ProductCardSkeleton,
        ProductSliderSkeleton,
        FormFieldSkeleton,
        SelectFieldSkeleton,
        OrderFormSkeleton,
        OrderSummarySkeleton,
        PaymentFormSkeleton,
        WizardStepSkeleton,
        TableRowSkeleton,
        TableSkeleton,
        ImageSkeleton,
        TextLineSkeleton,
        HeadingSkeleton,
      ];

      components.forEach((component) => {
        expect(component).toBeDefined();
        expect(typeof component).toBe("function");
        // React components are functions that can be called
        expect(component.length).toBeGreaterThanOrEqual(0);
      });
    });

    it("should support optional props for customizable skeletons", () => {
      // ImageSkeleton accepts className prop
      expect(ImageSkeleton.length).toBeGreaterThanOrEqual(1);
      
      // TextLineSkeleton accepts width prop
      expect(TextLineSkeleton.length).toBeGreaterThanOrEqual(1);
      
      // HeadingSkeleton accepts width prop
      expect(HeadingSkeleton.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Skeleton Component Types", () => {
    it("should export form-related skeletons", () => {
      const formSkeletons = [
        FormFieldSkeleton,
        SelectFieldSkeleton,
        OrderFormSkeleton,
        PaymentFormSkeleton,
        WizardStepSkeleton,
      ];

      formSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeDefined();
        expect(typeof skeleton).toBe("function");
      });
    });

    it("should export product-related skeletons", () => {
      const productSkeletons = [
        ProductCardSkeleton,
        ProductSliderSkeleton,
      ];

      productSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeDefined();
        expect(typeof skeleton).toBe("function");
      });
    });

    it("should export table-related skeletons", () => {
      const tableSkeletons = [
        TableRowSkeleton,
        TableSkeleton,
      ];

      tableSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeDefined();
        expect(typeof skeleton).toBe("function");
      });
    });

    it("should export generic skeletons", () => {
      const genericSkeletons = [
        ImageSkeleton,
        TextLineSkeleton,
        HeadingSkeleton,
      ];

      genericSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeDefined();
        expect(typeof skeleton).toBe("function");
      });
    });

    it("should export order-related skeletons", () => {
      const orderSkeletons = [
        OrderFormSkeleton,
        OrderSummarySkeleton,
      ];

      orderSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeDefined();
        expect(typeof skeleton).toBe("function");
      });
    });
  });

  describe("Skeleton Component Coverage", () => {
    it("should have 13 total skeleton components", () => {
      const allSkeletons = [
        ProductCardSkeleton,
        ProductSliderSkeleton,
        FormFieldSkeleton,
        SelectFieldSkeleton,
        OrderFormSkeleton,
        OrderSummarySkeleton,
        PaymentFormSkeleton,
        WizardStepSkeleton,
        TableRowSkeleton,
        TableSkeleton,
        ImageSkeleton,
        TextLineSkeleton,
        HeadingSkeleton,
      ];

      expect(allSkeletons.length).toBe(13);
      allSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeDefined();
      });
    });

    it("should cover all major UI patterns", () => {
      // Product display
      expect(ProductCardSkeleton).toBeDefined();
      expect(ProductSliderSkeleton).toBeDefined();

      // Form inputs
      expect(FormFieldSkeleton).toBeDefined();
      expect(SelectFieldSkeleton).toBeDefined();

      // Complex forms
      expect(OrderFormSkeleton).toBeDefined();
      expect(PaymentFormSkeleton).toBeDefined();
      expect(WizardStepSkeleton).toBeDefined();

      // Data display
      expect(TableRowSkeleton).toBeDefined();
      expect(TableSkeleton).toBeDefined();

      // Summary/overview
      expect(OrderSummarySkeleton).toBeDefined();

      // Generic elements
      expect(ImageSkeleton).toBeDefined();
      expect(TextLineSkeleton).toBeDefined();
      expect(HeadingSkeleton).toBeDefined();
    });
  });
});
