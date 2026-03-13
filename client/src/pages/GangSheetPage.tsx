import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { GangSheetBuilder } from '@/components/GangSheetBuilder';

export default function GangSheetPage() {
  const [, setLocation] = useLocation();
  const [gangSheetName, setGangSheetName] = useState('My Gang Sheet');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [currentGangSheetId, setCurrentGangSheetId] = useState<number | null>(null);

  const createMutation = trpc.gangSheets.create.useMutation();
  const submitMutation = trpc.gangSheets.submit.useMutation();

  const handleCreateGangSheet = async () => {
    try {
      const result = await createMutation.mutateAsync({
        name: gangSheetName,
        quantity,
      });
      setCurrentGangSheetId(result.id);
      toast.success('Gang sheet created successfully');
    } catch (error) {
      toast.error('Failed to create gang sheet');
    }
  };

  const handleSubmitOrder = async () => {
    if (!currentGangSheetId) {
      toast.error('Please create a gang sheet first');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        gangSheetId: currentGangSheetId,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        quantity,
        exportFormat: 'png',
        exportFileUrl: '', // Would be populated with actual export URL
        exportFileName: `gang-sheet-${currentGangSheetId}.png`,
      });
      toast.success('Order submitted successfully! We will contact you soon.');
      setLocation('/my-account');
    } catch (error) {
      toast.error('Failed to submit order');
    }
  };

  if (!currentGangSheetId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setLocation('/for-resellers')}
            variant="ghost"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reseller Page
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Gang Sheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gang Sheet Name</label>
                <Input
                  value={gangSheetName}
                  onChange={(e) => setGangSheetName(e.target.value)}
                  placeholder="e.g., Spring Collection 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity of Gang Sheets</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <Button onClick={handleCreateGangSheet} className="w-full">
                Start Building Gang Sheet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <Button
          onClick={() => setLocation('/for-resellers')}
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reseller Page
        </Button>

        <div>
          <h1 className="text-3xl font-bold mb-2">Gang Sheet Builder</h1>
          <p className="text-gray-600">
            Arrange your designs on a {300}mm × {1000}mm gang sheet
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <GangSheetBuilder gangSheetId={currentGangSheetId} />
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company (Optional)</label>
                  <Input
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  className="w-full gap-2"
                  disabled={submitMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Order'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Width:</span>
                  <Badge>300 mm</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Height:</span>
                  <Badge>1000 mm</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DPI:</span>
                  <Badge>300</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Export Size:</span>
                  <Badge>3543 × 11811 px</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
