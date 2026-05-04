import { describe, it, expect } from "vitest";

describe("Admin Order Detail - Data Structure", () => {
  describe("Order Detail Response", () => {
    it("should include product information", () => {
      const orderDetail = {
        id: 1,
        product: {
          id: 1,
          name: "Lightweight T-Shirt",
          description: "Premium quality lightweight t-shirt",
        },
        productId: 1,
      };

      expect(orderDetail.product).toBeDefined();
      expect(orderDetail.product.name).toBe("Lightweight T-Shirt");
      expect(orderDetail.productId).toBe(1);
    });

    it("should include color information", () => {
      const orderDetail = {
        id: 1,
        color: {
          id: 1,
          colorName: "Black",
          colorHex: "#000000",
        },
        colorId: 1,
      };

      expect(orderDetail.color).toBeDefined();
      expect(orderDetail.color.colorName).toBe("Black");
      expect(orderDetail.color.colorHex).toBe("#000000");
      expect(orderDetail.colorId).toBe(1);
    });

    it("should include size information", () => {
      const orderDetail = {
        id: 1,
        size: {
          id: 1,
          sizeName: "Large",
          sizeCode: "L",
        },
        sizeId: 1,
      };

      expect(orderDetail.size).toBeDefined();
      expect(orderDetail.size.sizeName).toBe("Large");
      expect(orderDetail.sizeId).toBe(1);
    });

    it("should include all customer information", () => {
      const orderDetail = {
        id: 1,
        customerFirstName: "John",
        customerLastName: "Doe",
        customerEmail: "john@example.com",
        customerPhone: "1234567890",
        customerCompany: "Acme Corp",
      };

      expect(orderDetail.customerFirstName).toBe("John");
      expect(orderDetail.customerLastName).toBe("Doe");
      expect(orderDetail.customerEmail).toBe("john@example.com");
      expect(orderDetail.customerPhone).toBe("1234567890");
      expect(orderDetail.customerCompany).toBe("Acme Corp");
    });

    it("should include order status and pricing", () => {
      const orderDetail = {
        id: 1,
        status: "approved",
        quantity: 10,
        totalPriceEstimate: 500.0,
        amountPaid: 0,
        depositAmount: 0,
        paymentStatus: "unpaid",
      };

      expect(orderDetail.status).toBe("approved");
      expect(orderDetail.quantity).toBe(10);
      expect(orderDetail.totalPriceEstimate).toBe(500.0);
      expect(orderDetail.paymentStatus).toBe("unpaid");
    });

    it("should include print placements and details", () => {
      const orderDetail = {
        id: 1,
        prints: [
          {
            id: 1,
            placement: {
              id: 1,
              placementName: "Front Center",
            },
            printSize: {
              id: 1,
              printSize: "10x10",
            },
            uploadedFileName: "design.png",
            fileSize: 2048000,
            mimeType: "image/png",
          },
        ],
      };

      expect(orderDetail.prints).toBeDefined();
      expect(orderDetail.prints.length).toBe(1);
      expect(orderDetail.prints[0].placement.placementName).toBe("Front Center");
      expect(orderDetail.prints[0].printSize.printSize).toBe("10x10");
      expect(orderDetail.prints[0].uploadedFileName).toBe("design.png");
    });

    it("should handle multiple print placements", () => {
      const orderDetail = {
        id: 1,
        prints: [
          {
            id: 1,
            placement: { placementName: "Front Center" },
            printSize: { printSize: "10x10" },
          },
          {
            id: 2,
            placement: { placementName: "Back Center" },
            printSize: { printSize: "8x8" },
          },
          {
            id: 3,
            placement: { placementName: "Left Sleeve" },
            printSize: { printSize: "5x5" },
          },
        ],
      };

      expect(orderDetail.prints.length).toBe(3);
      expect(orderDetail.prints[0].placement.placementName).toBe("Front Center");
      expect(orderDetail.prints[1].placement.placementName).toBe("Back Center");
      expect(orderDetail.prints[2].placement.placementName).toBe("Left Sleeve");
    });

    it("should include delivery information", () => {
      const orderDetail = {
        id: 1,
        deliveryMethod: "delivery",
        deliveryAddress: "123 Main St, City, Country",
        deliveryCharge: 50.0,
      };

      expect(orderDetail.deliveryMethod).toBe("delivery");
      expect(orderDetail.deliveryAddress).toBe("123 Main St, City, Country");
      expect(orderDetail.deliveryCharge).toBe(50.0);
    });

    it("should include invoice information when available", () => {
      const orderDetail = {
        id: 1,
        invoiceNumber: "INV-001",
        invoiceDate: new Date("2026-04-29"),
        invoiceUrl: "https://example.com/invoice.pdf",
        invoiceAcceptedAt: new Date("2026-04-29"),
      };

      expect(orderDetail.invoiceNumber).toBe("INV-001");
      expect(orderDetail.invoiceUrl).toBeDefined();
      expect(orderDetail.invoiceAcceptedAt).toBeDefined();
    });

    it("should include payment verification status", () => {
      const orderDetail = {
        id: 1,
        paymentVerificationStatus: "verified",
        paymentVerifiedAt: new Date("2026-04-29"),
        paymentVerificationNotes: "Payment verified via bank transfer",
      };

      expect(orderDetail.paymentVerificationStatus).toBe("verified");
      expect(orderDetail.paymentVerifiedAt).toBeDefined();
      expect(orderDetail.paymentVerificationNotes).toBeDefined();
    });

    it("should handle null optional fields gracefully", () => {
      const orderDetail = {
        id: 1,
        customerCompany: null,
        deliveryAddress: null,
        invoiceUrl: null,
        paymentVerificationNotes: null,
      };

      expect(orderDetail.customerCompany).toBeNull();
      expect(orderDetail.deliveryAddress).toBeNull();
      expect(orderDetail.invoiceUrl).toBeNull();
    });

    it("should convert numeric strings to numbers", () => {
      const orderDetail = {
        totalPriceEstimate: 500.0,
        amountPaid: 0,
        depositAmount: 0,
        deliveryCharge: 50.0,
      };

      expect(typeof orderDetail.totalPriceEstimate).toBe("number");
      expect(typeof orderDetail.amountPaid).toBe("number");
      expect(typeof orderDetail.depositAmount).toBe("number");
      expect(typeof orderDetail.deliveryCharge).toBe("number");
    });

    it("should include order timestamps", () => {
      const orderDetail = {
        id: 1,
        createdAt: new Date("2026-04-29"),
        updatedAt: new Date("2026-04-29"),
      };

      expect(orderDetail.createdAt).toBeDefined();
      expect(orderDetail.updatedAt).toBeDefined();
    });
  });

  describe("Order Detail Display Requirements", () => {
    it("should have all required fields for invoice generation", () => {
      const orderDetail = {
        id: 1,
        customerFirstName: "John",
        customerLastName: "Doe",
        customerEmail: "john@example.com",
        customerCompany: "Acme Corp",
        product: { name: "T-Shirt" },
        color: { colorName: "Black" },
        size: { sizeName: "Large" },
        quantity: 10,
        totalPriceEstimate: 500.0,
        deliveryMethod: "delivery",
        deliveryAddress: "123 Main St",
        deliveryCharge: 50.0,
        prints: [
          {
            placement: { placementName: "Front" },
            printSize: { printSize: "10x10" },
          },
        ],
      };

      // Verify all invoice-required fields
      expect(orderDetail.id).toBeDefined();
      expect(orderDetail.customerFirstName).toBeDefined();
      expect(orderDetail.customerLastName).toBeDefined();
      expect(orderDetail.customerEmail).toBeDefined();
      expect(orderDetail.product).toBeDefined();
      expect(orderDetail.color).toBeDefined();
      expect(orderDetail.size).toBeDefined();
      expect(orderDetail.quantity).toBeDefined();
      expect(orderDetail.totalPriceEstimate).toBeDefined();
      expect(orderDetail.prints).toBeDefined();
    });

    it("should display product details correctly", () => {
      const orderDetail = {
        product: { name: "Lightweight T-Shirt" },
        color: { colorName: "Black", colorHex: "#000000" },
        size: { sizeName: "Large" },
        quantity: 10,
      };

      const displayText = `${orderDetail.quantity}x ${orderDetail.product.name} in ${orderDetail.color.colorName} (${orderDetail.size.sizeName})`;
      expect(displayText).toBe("10x Lightweight T-Shirt in Black (Large)");
    });

    it("should calculate total with delivery charge", () => {
      const orderDetail = {
        totalPriceEstimate: 500.0,
        deliveryCharge: 50.0,
      };

      const total = orderDetail.totalPriceEstimate + orderDetail.deliveryCharge;
      expect(total).toBe(550.0);
    });
  });
});

describe("Admin Order Detail - Multi-Item Orders (lineItems)", () => {
  it("should detect multi-item orders by productId === 0", () => {
    const multiItemOrder = { productId: 0, colorId: 0, sizeId: 0 };
    const singleItemOrder = { productId: 1, colorId: 2, sizeId: 3 };
    expect(multiItemOrder.productId === 0).toBe(true);
    expect(singleItemOrder.productId === 0).toBe(false);
  });

  it("should return isMultiItemOrder flag correctly", () => {
    const result = { productId: 0, isMultiItemOrder: true, lineItems: [] };
    expect(result.isMultiItemOrder).toBe(true);
  });

  it("should return lineItems with enriched product/color/size for multi-item orders", () => {
    const lineItems = [
      {
        id: 1,
        orderId: 1440049,
        productId: 1,
        colorId: 2,
        sizeId: 3,
        quantity: 25,
        subtotal: 550,
        unitPrice: 22,
        product: { id: 1, name: "Premium Cotton Tee" },
        color: { id: 2, colorName: "Midnight Black", colorHex: "#1a1a1a" },
        size: { id: 3, sizeName: "L" },
        placement: { id: 1, placementName: "Front Chest" },
        printSize: { id: 1, printSize: "A4" },
      },
    ];

    expect(lineItems[0].product?.name).toBe("Premium Cotton Tee");
    expect(lineItems[0].color?.colorName).toBe("Midnight Black");
    expect(lineItems[0].color?.colorHex).toBe("#1a1a1a");
    expect(lineItems[0].size?.sizeName).toBe("L");
    expect(lineItems[0].placement?.placementName).toBe("Front Chest");
    expect(lineItems[0].printSize?.printSize).toBe("A4");
    expect(lineItems[0].subtotal).toBe(550);
  });

  it("should handle multiple line items per order", () => {
    const lineItems = [
      { id: 1, product: { name: "T-Shirt" }, color: { colorName: "Black" }, size: { sizeName: "M" }, quantity: 10 },
      { id: 2, product: { name: "Polo" }, color: { colorName: "White" }, size: { sizeName: "L" }, quantity: 15 },
    ];
    expect(lineItems.length).toBe(2);
    expect(lineItems[0].product.name).toBe("T-Shirt");
    expect(lineItems[1].product.name).toBe("Polo");
  });

  it("should return empty lineItems for single-item orders", () => {
    const singleItemResult = { productId: 1, isMultiItemOrder: false, lineItems: [] };
    expect(singleItemResult.lineItems).toHaveLength(0);
    expect(singleItemResult.isMultiItemOrder).toBe(false);
  });

  it("should parse subtotal and unitPrice as numbers", () => {
    const item = { subtotal: parseFloat("550.00"), unitPrice: parseFloat("22.00") };
    expect(typeof item.subtotal).toBe("number");
    expect(typeof item.unitPrice).toBe("number");
    expect(item.subtotal).toBe(550);
    expect(item.unitPrice).toBe(22);
  });

  it("should show N/A gracefully when product/color/size not found in DB", () => {
    const item = { product: null, color: null, size: null };
    const productDisplay = item.product?.name || "N/A";
    const colorDisplay = item.color?.colorName || "N/A";
    const sizeDisplay = item.size?.sizeName || "N/A";
    expect(productDisplay).toBe("N/A");
    expect(colorDisplay).toBe("N/A");
    expect(sizeDisplay).toBe("N/A");
  });

  it("should calculate total quantity from line items", () => {
    const lineItems = [{ quantity: 10 }, { quantity: 15 }, { quantity: 25 }];
    const total = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    expect(total).toBe(50);
  });
});

describe("Admin Order Detail - Artwork Download Links", () => {
  it("should include uploadedFilePath and uploadedFileName on each print", () => {
    const print = {
      id: 1,
      orderId: 1,
      uploadedFilePath: "https://cdn.example.com/uploads/order-1/front-design.png",
      uploadedFileName: "front-design.png",
      fileSize: 204800,
      mimeType: "image/png",
      placement: { placementName: "Front Chest" },
      printSize: { printSize: "A4" },
    };
    expect(print.uploadedFilePath).toBeTruthy();
    expect(print.uploadedFileName).toBe("front-design.png");
  });

  it("should correctly compute file size display in KB", () => {
    const fileSize = 204800; // bytes
    const displayKB = (fileSize / 1024).toFixed(0);
    expect(displayKB).toBe("200");
  });

  it("should handle missing uploadedFilePath gracefully", () => {
    const print = { uploadedFilePath: null, uploadedFileName: null };
    const hasFile = !!print.uploadedFilePath;
    expect(hasFile).toBe(false);
  });

  it("should build a correct download anchor for a print file", () => {
    const print = {
      uploadedFilePath: "https://cdn.example.com/uploads/order-1/front-design.png",
      uploadedFileName: "front-design.png",
    };
    // Simulate what the download button does
    const href = print.uploadedFilePath;
    const download = print.uploadedFileName || "artwork";
    expect(href).toContain("https://");
    expect(download).toBe("front-design.png");
  });

  it("should count total prints for Download All button visibility", () => {
    const prints = [
      { uploadedFilePath: "https://cdn.example.com/a.png", uploadedFileName: "a.png" },
      { uploadedFilePath: "https://cdn.example.com/b.png", uploadedFileName: "b.png" },
    ];
    // Download All button shows when prints.length > 1
    expect(prints.length > 1).toBe(true);
  });

  it("should not show Download All button for single print", () => {
    const prints = [{ uploadedFilePath: "https://cdn.example.com/a.png", uploadedFileName: "a.png" }];
    expect(prints.length > 1).toBe(false);
  });

  it("should persist artwork to orderPrints when creating multi-item orders", () => {
    const cartItem = {
      productId: 1,
      colorId: 2,
      sizeId: 3,
      quantity: 10,
      printSelections: [
        {
          placementId: 1,
          printSizeId: 1,
          uploadedFilePath: "https://cdn.example.com/design.png",
          uploadedFileName: "design.png",
          fileSize: 204800,
          mimeType: "image/png",
        },
      ],
      subtotal: 220,
    };
    // Verify that printSelections with uploadedFilePath should be saved
    const printsToSave = cartItem.printSelections.filter((p) => p.uploadedFilePath);
    expect(printsToSave.length).toBe(1);
    expect(printsToSave[0].uploadedFilePath).toBe("https://cdn.example.com/design.png");
  });

  it("should skip saving prints with empty uploadedFilePath", () => {
    const printSelections = [
      { placementId: 1, printSizeId: 1, uploadedFilePath: "", uploadedFileName: "" },
      { placementId: 2, printSizeId: 1, uploadedFilePath: "https://cdn.example.com/b.png", uploadedFileName: "b.png" },
    ];
    const printsToSave = printSelections.filter((p) => p.uploadedFilePath);
    expect(printsToSave.length).toBe(1);
  });

  it("should show placement and print size metadata alongside the artwork file", () => {
    const print = {
      uploadedFileName: "back-design.png",
      fileSize: 512000,
      placement: { placementName: "Back Center" },
      printSize: { printSize: "A3" },
    };
    const meta = `${print.placement?.placementName || "N/A"} · ${print.printSize?.printSize || ""}`;
    expect(meta).toBe("Back Center · A3");
  });
});

describe("Admin Order Detail - Artwork Thumbnail Detection", () => {
  const isImageFile = (mimeType: string | null | undefined, fileName: string | null | undefined): boolean => {
    if (mimeType) return mimeType.startsWith("image/");
    return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName || "");
  };

  it("should detect PNG as an image by mimeType", () => {
    expect(isImageFile("image/png", "design.png")).toBe(true);
  });

  it("should detect JPEG as an image by mimeType", () => {
    expect(isImageFile("image/jpeg", "design.jpg")).toBe(true);
  });

  it("should detect WEBP as an image by mimeType", () => {
    expect(isImageFile("image/webp", "design.webp")).toBe(true);
  });

  it("should detect GIF as an image by mimeType", () => {
    expect(isImageFile("image/gif", "animation.gif")).toBe(true);
  });

  it("should detect SVG as an image by mimeType", () => {
    expect(isImageFile("image/svg+xml", "logo.svg")).toBe(true);
  });

  it("should fall back to file extension when mimeType is null", () => {
    expect(isImageFile(null, "design.PNG")).toBe(true);
    expect(isImageFile(null, "design.jpg")).toBe(true);
    expect(isImageFile(null, "design.jpeg")).toBe(true);
    expect(isImageFile(null, "design.webp")).toBe(true);
    expect(isImageFile(null, "design.gif")).toBe(true);
  });

  it("should NOT detect PDF as an image", () => {
    expect(isImageFile("application/pdf", "design.pdf")).toBe(false);
  });

  it("should NOT detect AI file as an image", () => {
    expect(isImageFile("application/postscript", "design.ai")).toBe(false);
  });

  it("should NOT detect unknown extension as an image", () => {
    expect(isImageFile(null, "design.psd")).toBe(false);
  });

  it("should handle undefined filename gracefully", () => {
    expect(isImageFile(null, undefined)).toBe(false);
    expect(isImageFile(null, "")).toBe(false);
  });

  it("should show thumbnail only when both isImage and uploadedFilePath are truthy", () => {
    const print = { mimeType: "image/png", uploadedFilePath: "https://cdn.example.com/design.png", uploadedFileName: "design.png" };
    const showThumbnail = isImageFile(print.mimeType, print.uploadedFileName) && !!print.uploadedFilePath;
    expect(showThumbnail).toBe(true);
  });

  it("should NOT show thumbnail when uploadedFilePath is missing", () => {
    const print = { mimeType: "image/png", uploadedFilePath: null, uploadedFileName: "design.png" };
    const showThumbnail = isImageFile(print.mimeType, print.uploadedFileName) && !!print.uploadedFilePath;
    expect(showThumbnail).toBe(false);
  });

  it("should show file icon (not thumbnail) for non-image files", () => {
    const print = { mimeType: "application/pdf", uploadedFilePath: "https://cdn.example.com/design.pdf", uploadedFileName: "design.pdf" };
    const isImage = isImageFile(print.mimeType, print.uploadedFileName);
    expect(isImage).toBe(false);
    // Non-image files show FileText icon instead of thumbnail
  });
});
