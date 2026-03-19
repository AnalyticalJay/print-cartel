import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileOrderTimeline } from "./MobileOrderTimeline";

describe("MobileOrderTimeline", () => {
  const mockDate = new Date("2026-03-19T10:00:00Z");

  const defaultProps = {
    currentStatus: "pending" as const,
    createdAt: mockDate,
    updatedAt: mockDate,
    orderDetails: {
      quantity: 100,
      totalPrice: "$500.00",
      depositPaid: false,
    },
  };

  it("renders timeline with all status events", () => {
    render(<MobileOrderTimeline {...defaultProps} />);
    
    expect(screen.getByText("Order Timeline")).toBeInTheDocument();
    expect(screen.getByText("Order Submitted")).toBeInTheDocument();
    expect(screen.getByText("Quote Sent")).toBeInTheDocument();
    expect(screen.getByText("Quote Approved")).toBeInTheDocument();
    expect(screen.getByText("In Production")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
  });

  it("displays current status in legend", () => {
    render(<MobileOrderTimeline {...defaultProps} currentStatus="in-production" />);
    
    expect(screen.getByText("Current Status")).toBeInTheDocument();
    expect(screen.getByText("In Production")).toBeInTheDocument();
  });

  it("expands section when clicked", () => {
    render(<MobileOrderTimeline {...defaultProps} />);
    
    const orderSubmittedButton = screen.getByText("Order Submitted").closest("div");
    fireEvent.click(orderSubmittedButton!);
    
    expect(screen.getByText(/Order received for 100 units/)).toBeInTheDocument();
  });

  it("collapses expanded section when clicked again", () => {
    render(<MobileOrderTimeline {...defaultProps} />);
    
    const orderSubmittedButton = screen.getByText("Order Submitted").closest("div");
    fireEvent.click(orderSubmittedButton!);
    expect(screen.getByText(/Order received for 100 units/)).toBeInTheDocument();
    
    fireEvent.click(orderSubmittedButton!);
    expect(screen.queryByText(/Order received for 100 units/)).not.toBeInTheDocument();
  });

  it("shows correct status descriptions for different statuses", () => {
    const { rerender } = render(
      <MobileOrderTimeline {...defaultProps} currentStatus="quoted" />
    );
    
    const quoteButton = screen.getByText("Quote Sent").closest("div");
    fireEvent.click(quoteButton!);
    expect(screen.getByText(/We've sent you a quote/)).toBeInTheDocument();
    
    rerender(<MobileOrderTimeline {...defaultProps} currentStatus="approved" orderDetails={{ ...defaultProps.orderDetails, depositPaid: true }} />);
    const approvedButton = screen.getByText("Quote Approved").closest("div");
    fireEvent.click(approvedButton!);
    expect(screen.getByText(/Deposit received/)).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    render(<MobileOrderTimeline {...defaultProps} />);
    
    const dateText = screen.getByText(/Mar 19, 2026/);
    expect(dateText).toBeInTheDocument();
  });

  it("marks completed statuses correctly", () => {
    const { container } = render(
      <MobileOrderTimeline {...defaultProps} currentStatus="completed" />
    );
    
    // Check for completed status indicators (green background)
    const completedElements = container.querySelectorAll(".bg-green-500, .bg-green-50");
    expect(completedElements.length).toBeGreaterThan(0);
  });

  it("shows incomplete statuses correctly", () => {
    const { container } = render(
      <MobileOrderTimeline {...defaultProps} currentStatus="pending" />
    );
    
    // Pending should be completed, but quoted should not be
    const quoteStatus = screen.getByText("Quote Sent").closest("div");
    expect(quoteStatus).toHaveClass("bg-blue-50");
  });

  it("handles all order statuses", () => {
    const statuses = ["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"] as const;
    
    statuses.forEach((status) => {
      const { unmount } = render(
        <MobileOrderTimeline {...defaultProps} currentStatus={status} />
      );
      
      expect(screen.getByText("Order Timeline")).toBeInTheDocument();
      unmount();
    });
  });

  it("displays order details in descriptions", () => {
    render(
      <MobileOrderTimeline
        {...defaultProps}
        orderDetails={{
          quantity: 250,
          totalPrice: "$1,250.00",
          depositPaid: false,
        }}
      />
    );
    
    const orderButton = screen.getByText("Order Submitted").closest("div");
    fireEvent.click(orderButton!);
    
    expect(screen.getByText(/Order received for 250 units/)).toBeInTheDocument();
    expect(screen.getByText(/Total: \$1,250.00/)).toBeInTheDocument();
  });

  it("shows responsive spacing on mobile and desktop", () => {
    const { container } = render(<MobileOrderTimeline {...defaultProps} />);
    
    const timelineContainer = container.querySelector(".py-4");
    expect(timelineContainer).toHaveClass("md:py-8");
  });
});
