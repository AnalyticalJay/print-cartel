import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Truck, Package } from 'lucide-react';

export interface OrderStatus {
  id: string;
  status: 'pending' | 'quoted' | 'approved' | 'in-production' | 'completed' | 'shipped' | 'cancelled';
  label: string;
  description: string;
  timestamp?: Date;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface OrderStatusTimelineProps {
  statuses: OrderStatus[];
  currentStatus: string;
  estimatedDelivery?: Date;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Order Received',
    description: 'Your order has been received and is being reviewed',
  },
  quoted: {
    icon: AlertCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Quote Ready',
    description: 'We\'ve prepared a quote for your order',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Approved',
    description: 'Your order has been approved and queued for production',
  },
  'in-production': {
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'In Production',
    description: 'Your custom design is being printed right now',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Ready to Ship',
    description: 'Your order is complete and ready for shipment',
  },
  shipped: {
    icon: Truck,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Shipped',
    description: 'Your order is on its way to you',
  },
  cancelled: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Cancelled',
    description: 'Your order has been cancelled',
  },
};

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  statuses,
  currentStatus,
  estimatedDelivery,
}) => {
  const timelineStatuses: OrderStatus[] = [
    {
      id: 'pending',
      status: 'pending',
      label: 'Order Received',
      description: 'Your order has been received and is being reviewed',
      isCompleted: ['quoted', 'approved', 'in-production', 'completed', 'shipped'].includes(currentStatus),
      isCurrent: currentStatus === 'pending',
    },
    {
      id: 'quoted',
      status: 'quoted',
      label: 'Quote Ready',
      description: 'We\'ve prepared a quote for your order',
      isCompleted: ['approved', 'in-production', 'completed', 'shipped'].includes(currentStatus),
      isCurrent: currentStatus === 'quoted',
    },
    {
      id: 'approved',
      status: 'approved',
      label: 'Approved',
      description: 'Your order has been approved and queued for production',
      isCompleted: ['in-production', 'completed', 'shipped'].includes(currentStatus),
      isCurrent: currentStatus === 'approved',
    },
    {
      id: 'in-production',
      status: 'in-production',
      label: 'In Production',
      description: 'Your custom design is being printed right now',
      isCompleted: ['completed', 'shipped'].includes(currentStatus),
      isCurrent: currentStatus === 'in-production',
    },
    {
      id: 'completed',
      status: 'completed',
      label: 'Ready to Ship',
      description: 'Your order is complete and ready for shipment',
      isCompleted: ['shipped'].includes(currentStatus),
      isCurrent: currentStatus === 'completed',
    },
    {
      id: 'shipped',
      status: 'shipped',
      label: 'Shipped',
      description: 'Your order is on its way to you',
      isCompleted: false,
      isCurrent: currentStatus === 'shipped',
    },
  ];

  return (
    <div className="w-full">
      {/* Timeline */}
      <div className="space-y-4">
        {timelineStatuses.map((item, index) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          const isLast = index === timelineStatuses.length - 1;

          return (
            <div key={item.id} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-6 top-16 w-1 h-8 ${
                    item.isCompleted || item.isCurrent ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}

              {/* Status item */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.isCompleted || item.isCurrent
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        item.isCompleted || item.isCurrent
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-lg font-semibold ${
                        item.isCurrent
                          ? 'text-green-600'
                          : item.isCompleted
                          ? 'text-gray-700'
                          : 'text-gray-300'
                      }`}
                    >
                      {item.label}
                    </h3>
                    {item.isCurrent && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      item.isCompleted || item.isCurrent
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {item.description}
                  </p>
                  {item.timestamp && (
                    <p className="text-xs text-gray-300 mt-2">
                      {new Date(item.timestamp).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Delivery */}
      {estimatedDelivery && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Estimated Delivery:</span>{' '}
            {new Date(estimatedDelivery).toLocaleDateString('en-ZA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  );
};
