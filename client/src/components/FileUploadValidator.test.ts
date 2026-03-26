import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileUploadValidator } from "./FileUploadValidator";

describe("FileUploadValidator Component", () => {
  it("should render upload area when no file is selected", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    expect(
      screen.getByText("Drag and drop your file here")
    ).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/)).toBeInTheDocument();
  });

  it("should display placement and print size information", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Back"
        printSize="A5"
        onFileUpload={mockOnFileUpload}
      />
    );

    expect(screen.getByText("Back - A5")).toBeInTheDocument();
    expect(
      screen.getByText("Upload your design file (PNG, JPG, PDF, etc.)")
    ).toBeInTheDocument();
  });

  it("should display design requirements", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    expect(screen.getByText("Design Requirements:")).toBeInTheDocument();
    expect(
      screen.getByText("High resolution (300 DPI recommended)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Transparent background (PNG) or white background")
    ).toBeInTheDocument();
    expect(screen.getByText("RGB color mode (not CMYK)")).toBeInTheDocument();
    expect(
      screen.getByText("Include 0.5cm bleed margin")
    ).toBeInTheDocument();
  });

  it("should show uploaded file name when file is selected", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
        uploadedFileName="design.png"
      />
    );

    expect(screen.getByText("design.png")).toBeInTheDocument();
    expect(screen.getByText("File ready for upload")).toBeInTheDocument();
  });

  it("should call onFileUpload when file is selected via input", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByRole("button", { name: /drag and drop/i })
      .closest("div")
      ?.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileUpload).toHaveBeenCalledWith(file);
  });

  it("should handle drag and drop", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    const dropZone = screen.getByText("Drag and drop your file here")
      .closest("div");

    const file = new File(["test"], "test.png", { type: "image/png" });
    const dataTransfer = {
      files: [file],
    };

    fireEvent.dragEnter(dropZone!, { dataTransfer });
    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    expect(mockOnFileUpload).toHaveBeenCalledWith(file);
  });

  it("should show remove button when file is uploaded", () => {
    const mockOnFileUpload = vi.fn();
    const mockOnRemoveFile = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
        uploadedFileName="design.png"
        onRemoveFile={mockOnRemoveFile}
      />
    );

    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toBeInTheDocument();

    fireEvent.click(removeButton);
    expect(mockOnRemoveFile).toHaveBeenCalled();
  });

  it("should accept image and PDF files", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    expect(screen.getByText(/Supported: PNG, JPG, PDF, WebP/)).toBeInTheDocument();
  });

  it("should display max file size limit", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    expect(screen.getByText(/Max 50MB/)).toBeInTheDocument();
  });

  it("should show file icon when file is uploaded", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
        uploadedFileName="design.png"
      />
    );

    const fileIcon = screen.getByRole("img", { hidden: true });
    expect(fileIcon).toBeInTheDocument();
  });

  it("should change drag state on drag enter/leave", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    const dropZone = screen.getByText("Drag and drop your file here")
      .closest("div");

    fireEvent.dragEnter(dropZone!, { dataTransfer: { files: [] } });
    expect(dropZone).toHaveClass("border-accent");

    fireEvent.dragLeave(dropZone!, { dataTransfer: { files: [] } });
    expect(dropZone).toHaveClass("border-gray-600");
  });

  it("should handle file selection via click", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
      />
    );

    const uploadArea = screen.getByText("Drag and drop your file here")
      .closest("div");
    fireEvent.click(uploadArea!);

    const input = screen.getByRole("button", { name: /drag and drop/i })
      .closest("div")
      ?.querySelector("input[type='file']") as HTMLInputElement;

    expect(input).toBeInTheDocument();
  });

  it("should display check icon when file is ready", () => {
    const mockOnFileUpload = vi.fn();

    render(
      <FileUploadValidator
        placement="Front"
        printSize="A4"
        onFileUpload={mockOnFileUpload}
        uploadedFileName="design.png"
      />
    );

    const checkIcon = screen.getByRole("img", { hidden: true });
    expect(checkIcon).toBeInTheDocument();
  });
});
