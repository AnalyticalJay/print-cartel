import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrintPlacementSelector } from "./PrintPlacementSelector";

describe("PrintPlacementSelector Component", () => {
  const mockPlacements = [
    { id: 1, placementName: "Front", positionCoordinates: null },
    { id: 2, placementName: "Back", positionCoordinates: null },
    { id: 3, placementName: "Left Sleeve", positionCoordinates: null },
  ];

  const mockPrintOptions = [
    { id: 1, printSize: "A6", additionalPrice: "50" },
    { id: 2, printSize: "A5", additionalPrice: "75" },
    { id: 3, printSize: "A4", additionalPrice: "100" },
  ];

  it("should render all placements", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={[]}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Left Sleeve")).toBeInTheDocument();
  });

  it("should display placement descriptions", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={[]}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    expect(
      screen.getByText("Center chest area, ideal for logos and main designs")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Full back area, perfect for large designs and artwork")
    ).toBeInTheDocument();
  });

  it("should expand placement when clicked", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={[]}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    const frontButton = screen.getByText("Front").closest("button");
    fireEvent.click(frontButton!);

    // Print options should be visible
    expect(screen.getByText("A6")).toBeInTheDocument();
    expect(screen.getByText("A5")).toBeInTheDocument();
  });

  it("should call onAddSelection when print size is clicked", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={[]}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    // Expand Front placement
    const frontButton = screen.getByText("Front").closest("button");
    fireEvent.click(frontButton!);

    // Click A6 size
    const a6Button = screen.getByText("A6").closest("button");
    fireEvent.click(a6Button!);

    expect(mockOnAddSelection).toHaveBeenCalledWith(1, 1);
  });

  it("should display selected summary when selections exist", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    const selections = [
      { placementId: 1, printSizeId: 1 },
      { placementId: 2, printSizeId: 2 },
    ];

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={selections}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    expect(screen.getByText("Selected Placements (2)")).toBeInTheDocument();
    expect(screen.getByText(/Front - A6/)).toBeInTheDocument();
    expect(screen.getByText(/Back - A5/)).toBeInTheDocument();
  });

  it("should show selection count badge on placement header", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    const selections = [
      { placementId: 1, printSizeId: 1 },
      { placementId: 1, printSizeId: 2 },
    ];

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={selections}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("should call onRemoveSelection when remove button is clicked", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    const selections = [{ placementId: 1, printSizeId: 1 }];

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={selections}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockOnRemoveSelection).toHaveBeenCalledWith(0);
  });

  it("should display prices for print options", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={[]}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    // Expand Front placement
    const frontButton = screen.getByText("Front").closest("button");
    fireEvent.click(frontButton!);

    expect(screen.getByText("+R50.00")).toBeInTheDocument();
    expect(screen.getByText("+R75.00")).toBeInTheDocument();
    expect(screen.getByText("+R100.00")).toBeInTheDocument();
  });

  it("should handle numeric prices correctly", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    const optionsWithNumericPrices = [
      { id: 1, printSize: "A6", additionalPrice: 50 },
      { id: 2, printSize: "A5", additionalPrice: 75.5 },
    ];

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={optionsWithNumericPrices as any}
        printSelections={[]}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    // Expand Front placement
    const frontButton = screen.getByText("Front").closest("button");
    fireEvent.click(frontButton!);

    expect(screen.getByText("+R50.00")).toBeInTheDocument();
    expect(screen.getByText("+R75.50")).toBeInTheDocument();
  });

  it("should highlight selected print sizes", () => {
    const mockOnAddSelection = vi.fn();
    const mockOnRemoveSelection = vi.fn();

    const selections = [{ placementId: 1, printSizeId: 1 }];

    render(
      <PrintPlacementSelector
        placements={mockPlacements}
        printOptions={mockPrintOptions}
        printSelections={selections}
        onAddSelection={mockOnAddSelection}
        onRemoveSelection={mockOnRemoveSelection}
      />
    );

    // Expand Front placement
    const frontButton = screen.getByText("Front").closest("button");
    fireEvent.click(frontButton!);

    const a6Button = screen.getByText("A6").closest("button");
    expect(a6Button).toHaveClass("border-accent", "bg-accent");
  });
});
