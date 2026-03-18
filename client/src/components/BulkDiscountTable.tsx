import { Card } from "@/components/ui/card";

interface DiscountTier {
  quantity: number;
  discount: number;
  label: string;
}

interface BulkDiscountTableProps {
  printSizes?: {
    name: string;
    price: number;
  }[];
}

export function BulkDiscountTable({ printSizes }: BulkDiscountTableProps) {
  const discountTiers: DiscountTier[] = [
    { quantity: 1, discount: 0, label: "1-9 Units" },
    { quantity: 10, discount: 10, label: "10-49 Units" },
    { quantity: 50, discount: 20, label: "50-99 Units" },
    { quantity: 100, discount: 30, label: "100+ Units" },
  ];

  const defaultPrintSizes = [
    { name: "Pocket Size", price: 25 },
    { name: "A5", price: 45 },
    { name: "A4", price: 55 },
    { name: "A3", price: 75 },
  ];

  const sizes = printSizes || defaultPrintSizes;

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-accent/10 border-b-2 border-accent">
              <th className="px-4 py-3 text-left font-bold text-foreground">Quantity</th>
              <th className="px-4 py-3 text-center font-bold text-foreground">Discount</th>
              {sizes.map((size) => (
                <th key={size.name} className="px-4 py-3 text-center font-bold text-foreground">
                  {size.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {discountTiers.map((tier, index) => (
              <tr
                key={tier.quantity}
                className={`border-b border-border ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-accent/5 transition-colors`}
              >
                <td className="px-4 py-3 font-semibold text-foreground">{tier.label}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block bg-accent text-accent-foreground px-3 py-1 rounded font-bold">
                    {tier.discount}% OFF
                  </span>
                </td>
                {sizes.map((size) => {
                  const discountedPrice = size.price * (1 - tier.discount / 100);
                  return (
                    <td key={`${tier.quantity}-${size.name}`} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-gray-300 line-through">R{size.price.toFixed(2)}</span>
                        <span className="font-bold text-lg text-accent">R{discountedPrice.toFixed(2)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Benefits */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-accent/20">
          <h3 className="font-bold text-foreground mb-2">💰 Save More</h3>
          <p className="text-sm text-gray-600">Get up to 30% discount on bulk orders of 100+ units</p>
        </Card>
        <Card className="p-4 border-2 border-accent/20">
          <h3 className="font-bold text-foreground mb-2">⚡ Fast Processing</h3>
          <p className="text-sm text-gray-600">Bulk orders are prioritized for faster turnaround times</p>
        </Card>
        <Card className="p-4 border-2 border-accent/20">
          <h3 className="font-bold text-foreground mb-2">🎯 Quality Guaranteed</h3>
          <p className="text-sm text-gray-600">Same premium DTF printing quality on all order sizes</p>
        </Card>
      </div>
    </div>
  );
}
