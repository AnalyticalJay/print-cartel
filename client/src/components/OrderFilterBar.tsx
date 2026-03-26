import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState } from "react";

export type OrderStatus = "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";

interface OrderFilterBarProps {
  onFilterChange: (filters: {
    search: string;
    status: OrderStatus | "all";
    dateRange: "all" | "week" | "month" | "year";
  }) => void;
}

export function OrderFilterBar({ onFilterChange }: OrderFilterBarProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");

  const handleFilterChange = () => {
    onFilterChange({ search, status, dateRange });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setDateRange("all");
    onFilterChange({ search: "", status: "all", dateRange: "all" });
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "all");
            handleFilterChange();
          }}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="quoted">Quoted</option>
          <option value="approved">Approved</option>
          <option value="in-production">In Production</option>
          <option value="completed">Completed</option>
          <option value="shipped">Shipped</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date Range Filter */}
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value as "all" | "week" | "month" | "year");
            handleFilterChange();
          }}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        {/* Clear Filters Button */}
        {(search || status !== "all" || dateRange !== "all") && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(search || status !== "all" || dateRange !== "all") && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-300">
          <span className="text-gray-400">Active filters:</span>
          {search && (
            <span className="bg-accent/20 text-accent px-2 py-1 rounded">
              Search: {search}
            </span>
          )}
          {status !== "all" && (
            <span className="bg-accent/20 text-accent px-2 py-1 rounded">
              Status: {status}
            </span>
          )}
          {dateRange !== "all" && (
            <span className="bg-accent/20 text-accent px-2 py-1 rounded">
              Date: {dateRange}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
