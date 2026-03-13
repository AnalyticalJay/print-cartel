import { Card, CardContent } from '@/components/ui/card';

export function CommunicationHistorySkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Conversation cards skeleton */}
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Subject and badge skeleton */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Message preview skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>

            {/* Timestamp skeleton */}
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}
