import { cn } from "@/lib/utils";

/**
 * Animated skeleton pulse effect
 */
const skeletonPulse = "animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200";

/**
 * Product Card Skeleton - Used in product carousel/slider
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image skeleton */}
      <div className={cn("w-full h-48", skeletonPulse)} />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Product name skeleton */}
        <div className={cn("h-5 w-3/4 rounded", skeletonPulse)} />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className={cn("h-3 w-full rounded", skeletonPulse)} />
          <div className={cn("h-3 w-5/6 rounded", skeletonPulse)} />
        </div>
        
        {/* Price skeleton */}
        <div className={cn("h-5 w-1/4 rounded", skeletonPulse)} />
        
        {/* Button skeleton */}
        <div className={cn("h-9 w-full rounded", skeletonPulse)} />
      </div>
    </div>
  );
}

/**
 * Product Slider Skeleton - Multiple product cards
 */
export function ProductSliderSkeleton() {
  return (
    <div className="space-y-4">
      {/* Main product skeleton */}
      <div className={cn("w-full h-64 rounded-lg", skeletonPulse)} />
      
      {/* Carousel controls skeleton */}
      <div className="flex items-center justify-between">
        <div className={cn("h-10 w-10 rounded-full", skeletonPulse)} />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("h-2 w-2 rounded-full", skeletonPulse)} />
          ))}
        </div>
        <div className={cn("h-10 w-10 rounded-full", skeletonPulse)} />
      </div>
    </div>
  );
}

/**
 * Form Field Skeleton - Used in order forms
 */
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      {/* Label skeleton */}
      <div className={cn("h-4 w-24 rounded", skeletonPulse)} />
      
      {/* Input field skeleton */}
      <div className={cn("h-10 w-full rounded-md", skeletonPulse)} />
    </div>
  );
}

/**
 * Select Field Skeleton - Used for dropdowns
 */
export function SelectFieldSkeleton() {
  return (
    <div className="space-y-2">
      {/* Label skeleton */}
      <div className={cn("h-4 w-32 rounded", skeletonPulse)} />
      
      {/* Select field skeleton */}
      <div className={cn("h-10 w-full rounded-md", skeletonPulse)} />
    </div>
  );
}

/**
 * Order Form Skeleton - Complete form with multiple fields
 */
export function OrderFormSkeleton() {
  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-slate-200">
      {/* Section title skeleton */}
      <div className={cn("h-6 w-48 rounded", skeletonPulse)} />
      
      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <SelectFieldSkeleton />
        <SelectFieldSkeleton />
      </div>
      
      {/* Textarea skeleton */}
      <div className="space-y-2">
        <div className={cn("h-4 w-24 rounded", skeletonPulse)} />
        <div className={cn("h-24 w-full rounded-md", skeletonPulse)} />
      </div>
      
      {/* Button skeleton */}
      <div className={cn("h-10 w-32 rounded-md", skeletonPulse)} />
    </div>
  );
}

/**
 * Order Summary Skeleton - Used during order submission
 */
export function OrderSummarySkeleton() {
  return (
    <div className="space-y-4 p-6 bg-slate-50 rounded-lg border border-slate-200">
      {/* Header skeleton */}
      <div className={cn("h-6 w-40 rounded", skeletonPulse)} />
      
      {/* Summary items */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-200">
          <div className={cn("h-4 w-32 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-16 rounded", skeletonPulse)} />
        </div>
      ))}
      
      {/* Total skeleton */}
      <div className="flex justify-between items-center pt-4">
        <div className={cn("h-5 w-16 rounded", skeletonPulse)} />
        <div className={cn("h-5 w-24 rounded", skeletonPulse)} />
      </div>
    </div>
  );
}

/**
 * Payment Form Skeleton - Used during payment submission
 */
export function PaymentFormSkeleton() {
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border border-slate-200">
      {/* Header skeleton */}
      <div className={cn("h-6 w-32 rounded", skeletonPulse)} />
      
      {/* Payment method skeleton */}
      <div className="space-y-2">
        <div className={cn("h-4 w-28 rounded", skeletonPulse)} />
        <div className="flex gap-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className={cn("h-10 flex-1 rounded-md", skeletonPulse)} />
          ))}
        </div>
      </div>
      
      {/* Card details skeleton */}
      <div className="space-y-3">
        <FormFieldSkeleton />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>
      
      {/* Submit button skeleton */}
      <div className={cn("h-10 w-full rounded-md", skeletonPulse)} />
    </div>
  );
}

/**
 * Wizard Step Skeleton - Used for multi-step forms
 */
export function WizardStepSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress bar skeleton */}
      <div className={cn("h-2 w-full rounded-full", skeletonPulse)} />
      
      {/* Step title skeleton */}
      <div className={cn("h-7 w-48 rounded", skeletonPulse)} />
      
      {/* Step description skeleton */}
      <div className="space-y-2">
        <div className={cn("h-4 w-full rounded", skeletonPulse)} />
        <div className={cn("h-4 w-5/6 rounded", skeletonPulse)} />
      </div>
      
      {/* Step content skeleton */}
      <div className="space-y-4">
        <SelectFieldSkeleton />
        <SelectFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Navigation buttons skeleton */}
      <div className="flex gap-3 justify-between">
        <div className={cn("h-10 w-24 rounded-md", skeletonPulse)} />
        <div className={cn("h-10 w-24 rounded-md", skeletonPulse)} />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton - Used for order lists
 */
export function TableRowSkeleton() {
  return (
    <div className="flex gap-4 py-3 px-4 border-b border-slate-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={cn("h-4 flex-1 rounded", skeletonPulse)} />
      ))}
    </div>
  );
}

/**
 * Table Skeleton - Multiple rows
 */
export function TableSkeleton() {
  return (
    <div className="space-y-2 border border-slate-200 rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="flex gap-4 py-3 px-4 bg-slate-100 border-b border-slate-200">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn("h-4 flex-1 rounded", skeletonPulse)} />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {[...Array(5)].map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Modal Skeleton - Used for dialogs
 */
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        {/* Header skeleton */}
        <div className={cn("h-6 w-48 rounded", skeletonPulse)} />
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className={cn("h-4 w-full rounded", skeletonPulse)} />
          <div className={cn("h-4 w-5/6 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-4/6 rounded", skeletonPulse)} />
        </div>
        
        {/* Footer buttons skeleton */}
        <div className="flex gap-3 justify-end pt-4">
          <div className={cn("h-10 w-20 rounded-md", skeletonPulse)} />
          <div className={cn("h-10 w-20 rounded-md", skeletonPulse)} />
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Table Skeleton - Admin order table with checkboxes
 */
export function AdminTableSkeleton() {
  return (
    <div className="space-y-2 border border-slate-200 rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="flex gap-4 py-3 px-4 bg-gray-100 border-b">
        <div className={cn("h-4 w-6 rounded", skeletonPulse)} />
        {[...Array(8)].map((_, i) => (
          <div key={i} className={cn("h-4 flex-1 rounded", skeletonPulse)} />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3 px-4 border-b border-slate-100 hover:bg-gray-50">
          <div className={cn("h-4 w-6 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-12 rounded", skeletonPulse)} />
          <div className={cn("h-4 flex-1 rounded", skeletonPulse)} />
          <div className={cn("h-4 flex-1 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-12 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-20 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-16 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-24 rounded", skeletonPulse)} />
          <div className={cn("h-4 w-16 rounded", skeletonPulse)} />
        </div>
      ))}
    </div>
  );
}

/**
 * Stat Card Skeleton - Loading state for dashboard stat cards
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div className={cn("h-4 w-24 rounded", skeletonPulse)} />
      <div className={cn("h-8 w-16 rounded", skeletonPulse)} />
    </div>
  );
}

/**
 * Stats Grid Skeleton - Multiple stat cards
 */
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Design Approval Queue Skeleton - Loading state for design approval tab
 */
export function DesignApprovalQueueSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filter skeleton */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={cn("h-10 rounded", skeletonPulse)} />
          <div className={cn("h-10 rounded", skeletonPulse)} />
          <div className={cn("h-10 rounded", skeletonPulse)} />
        </div>
      </div>

      {/* Design cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Image skeleton */}
            <div className={cn("w-full h-48", skeletonPulse)} />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className={cn("h-5 w-3/4 rounded", skeletonPulse)} />
              <div className="space-y-2">
                <div className={cn("h-3 w-full rounded", skeletonPulse)} />
                <div className={cn("h-3 w-5/6 rounded", skeletonPulse)} />
              </div>
              <div className="flex gap-2 pt-2">
                <div className={cn("h-9 flex-1 rounded", skeletonPulse)} />
                <div className={cn("h-9 flex-1 rounded", skeletonPulse)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Image Skeleton - Placeholder for images
 */
export function ImageSkeleton({ className }: { className?: string }) {
  return <div className={cn("bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded", className)} />;
}

/**
 * Text Line Skeleton - Generic text placeholder
 */
export function TextLineSkeleton({ width = "w-full" }: { width?: string }) {
  return <div className={cn("h-4 rounded", skeletonPulse, width)} />;
}

/**
 * Heading Skeleton - Generic heading placeholder
 */
export function HeadingSkeleton({ width = "w-48" }: { width?: string }) {
  return <div className={cn("h-7 rounded", skeletonPulse, width)} />;
}
