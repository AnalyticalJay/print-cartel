import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { AlertCircle, Clock, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  icon: React.ReactNode;
}

const columns: KanbanColumn[] = [
  { id: 'pending', title: 'Pending', color: 'bg-gray-500', icon: <AlertCircle className="w-4 h-4" /> },
  { id: 'quoted', title: 'Quoted', color: 'bg-blue-500', icon: <Clock className="w-4 h-4" /> },
  { id: 'approved', title: 'Approved', color: 'bg-yellow-500', icon: <Zap className="w-4 h-4" /> },
  { id: 'in-production', title: 'In Production', color: 'bg-orange-500', icon: <Zap className="w-4 h-4" /> },
  { id: 'ready', title: 'Ready', color: 'bg-green-500', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'completed', title: 'Completed', color: 'bg-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> },
];

interface Order {
  id: number;
  orderId?: number;
  status: string;
  priority?: string;
  estimatedCompletionDate?: string;
  productionNotes?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  quantity?: number;
  totalPriceEstimate?: number;
  product?: { name: string };
  productName?: string;
  productId?: number;
  assignedToAdminId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function ProductionKanban() {
  const [kanbanData, setKanbanData] = useState<Record<string, Order[]>>({});
  const [draggedItem, setDraggedItem] = useState<{ item: Order; sourceColumn: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const { data: boardData, isLoading, refetch } = trpc.production.getKanbanBoard.useQuery();
  const updateStatusMutation = trpc.production.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success('Order status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  useEffect(() => {
    if (boardData) {
      setKanbanData(boardData);
    }
  }, [boardData]);

  const handleDragStart = (item: Order, sourceColumn: string) => {
    setDraggedItem({ item, sourceColumn });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-700/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-gray-700/50');
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-700/50');

    if (!draggedItem) return;

    if (draggedItem.sourceColumn !== targetColumn) {
      updateStatusMutation.mutate({
        queueId: draggedItem.item.id,
        status: targetColumn as any,
      });
    }

    setDraggedItem(null);
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    updateStatusMutation.mutate({
      queueId: order.id,
      status: newStatus as any,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'normal':
        return 'bg-blue-600 text-white';
      case 'low':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Loading production queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Production Dashboard</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col bg-gray-700/30 rounded-lg border border-gray-600 min-h-96"
          >
            {/* Column Header */}
            <div className={`${column.color} text-white p-3 rounded-t-lg flex items-center gap-2`}>
              {column.icon}
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <p className="text-xs opacity-90">
                  {kanbanData[column.id]?.length || 0} orders
                </p>
              </div>
            </div>

            {/* Column Content */}
            <div
              className="flex-1 p-3 space-y-2 overflow-y-auto"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {kanbanData[column.id]?.map((order) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={() => handleDragStart(order, column.id)}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-gray-600 p-3 rounded-lg border border-gray-500 cursor-move hover:border-accent hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">Order #{order.orderId}</p>
                      <p className="text-xs text-gray-300 truncate">{order.customerFirstName} {order.customerLastName}</p>
                      <p className="text-xs text-gray-400 truncate">{order.productName || 'Product'}</p>
                    </div>
                    {order.priority && (
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    )}
                  </div>

                  {order.estimatedCompletionDate && (
                    <p className="text-xs text-gray-300 mt-2">
                      Est: {new Date(order.estimatedCompletionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}

              {!kanbanData[column.id] || kanbanData[column.id].length === 0 ? (
                <div className="flex items-center justify-center h-20 text-gray-400 text-xs">
                  No orders
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Panel */}
      {selectedOrder && (
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Order Details - #{selectedOrder.orderId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Customer</p>
                <p className="text-white font-semibold">{selectedOrder.customerFirstName} {selectedOrder.customerLastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-semibold text-sm">{selectedOrder.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Product</p>
                <p className="text-white font-semibold">{selectedOrder.productName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Quantity</p>
                <p className="text-white font-semibold">{selectedOrder.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Status</p>
                <p className="text-white font-semibold capitalize">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Price</p>
                <p className="text-white font-semibold">R{selectedOrder.totalPriceEstimate?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Priority</p>
                {selectedOrder.priority && (
                  <Badge className={getPriorityColor(selectedOrder.priority)}>
                    {selectedOrder.priority}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Estimated Completion</p>
                <p className="text-white font-semibold">
                  {selectedOrder.estimatedCompletionDate
                    ? new Date(selectedOrder.estimatedCompletionDate).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>

            {selectedOrder.productionNotes && (
              <div>
                <p className="text-sm text-gray-400">Production Notes</p>
                <p className="text-white bg-gray-700/50 p-2 rounded text-sm">
                  {selectedOrder.productionNotes}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (newStatus) {
                    handleStatusChange(selectedOrder, newStatus);
                    setNewStatus('');
                    setSelectedOrder(null);
                  }
                }}
                disabled={!newStatus || updateStatusMutation.isPending}
              >
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
