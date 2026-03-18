import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Truck, Package } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface OrderStatus {
  id: number;
  status: 'pending' | 'quoted' | 'approved' | 'in-production' | 'completed' | 'shipped' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  totalPriceEstimate: string;
  customerFirstName: string;
  customerLastName: string;
}

interface RealtimeOrderTrackerProps {
  orderId: number;
  autoRefreshInterval?: number; // milliseconds
}

export function RealtimeOrderTracker({ orderId, autoRefreshInterval = 5000 }: RealtimeOrderTrackerProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch order with auto-refresh
  const { data: order, isLoading, refetch } = trpc.orders.getById.useQuery(
    { id: orderId },
    {
      refetchInterval: autoRefreshInterval,
      staleTime: 0,
    }
  );

  useEffect(() => {
    if (order) {
      setLastUpdate(new Date());
    }
  }, [order?.updatedAt]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'quoted':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-production':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'quoted':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-production':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'quoted':
        return 'Quote Sent';
      case 'approved':
        return 'Approved';
      case 'in-production':
        return 'In Production';
      case 'completed':
        return 'Completed';
      case 'shipped':
        return 'Shipped';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order is being reviewed by our team';
      case 'quoted':
        return 'A quote has been sent to your email';
      case 'approved':
        return 'Your order has been approved and will start production soon';
      case 'in-production':
        return 'Your order is currently being printed';
      case 'completed':
        return 'Your order is complete and ready for pickup/delivery';
      case 'shipped':
        return 'Your order has been shipped';
      default:
        return 'Tracking your order status';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Order not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white">Order #{order.id} - Real-Time Status</CardTitle>
            <CardDescription>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </CardDescription>
          </div>
          <Badge className={`border ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="mt-1">
            {getStatusIcon(order.status)}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">
              {getStatusLabel(order.status)}
            </h3>
            <p className="text-gray-300 text-sm">
              {getStatusDescription(order.status)}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div>
          <h3 className="text-white font-semibold mb-4">Status Timeline</h3>
          <div className="space-y-3">
            {/* Pending */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${order.status !== 'pending' && order.status !== 'quoted' && order.status !== 'approved' && order.status !== 'in-production' && order.status !== 'completed' && order.status !== 'shipped' ? 'bg-gray-500' : 'bg-green-500'}`}></div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Order Received</p>
                <p className="text-gray-400 text-xs">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quoted */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${['quoted', 'approved', 'in-production', 'completed', 'shipped'].includes(order.status) ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Quote Sent</p>
                <p className="text-gray-400 text-xs">
                  {order.status === 'quoted' ? 'In progress' : order.status !== 'pending' ? new Date(order.updatedAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>

            {/* Approved */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${['approved', 'in-production', 'completed', 'shipped'].includes(order.status) ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Order Approved</p>
                <p className="text-gray-400 text-xs">
                  {['approved', 'in-production', 'completed', 'shipped'].includes(order.status) ? new Date(order.updatedAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>

            {/* In Production */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${['in-production', 'completed', 'shipped'].includes(order.status) ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">In Production</p>
                <p className="text-gray-400 text-xs">
                  {['in-production', 'completed', 'shipped'].includes(order.status) ? new Date(order.updatedAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${['completed', 'shipped'].includes(order.status) ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Order Completed</p>
                <p className="text-gray-400 text-xs">
                  {['completed', 'shipped'].includes(order.status) ? new Date(order.updatedAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>

            {/* Shipped */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${order.status === 'shipped' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Shipped</p>
                <p className="text-gray-400 text-xs">
                  {order.status === 'shipped' ? new Date(order.updatedAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-between text-xs text-gray-400 p-2 bg-gray-700/30 rounded">
          <span>Auto-refreshing every {autoRefreshInterval / 1000}s</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </CardContent>
    </Card>
  );
}
