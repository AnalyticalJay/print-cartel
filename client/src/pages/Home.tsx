import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Print Cartel</div>
          <Button
            onClick={() => setLocation("/order")}
            className="bg-white text-black hover:bg-gray-200"
          >
            Order Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Custom DTF Printing
          <br />
          <span className="text-gray-400">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Design, preview, and order custom-printed apparel with our intuitive platform. 
          Premium quality DTF printing for your brand.
        </p>
        <Button
          onClick={() => setLocation("/order")}
          size="lg"
          className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6"
        >
          Start Your Order
        </Button>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Choose Garment",
                description: "Select from our premium apparel collection",
              },
              {
                step: 2,
                title: "Select Print Options",
                description: "Pick placement and size for your design",
              },
              {
                step: 3,
                title: "Upload Design",
                description: "Upload your artwork in PNG, JPG, or PDF",
              },
              {
                step: 4,
                title: "Preview & Order",
                description: "See your design on the garment and submit",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Our Products</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { name: "Lightweight T-Shirt", price: "R70" },
            { name: "Men's Polo", price: "R120" },
            { name: "Men's Dry Fit Polo", price: "R120" },
            { name: "Hoodie", price: "R300" },
          ].map((product) => (
            <div
              key={product.name}
              className="bg-gray-900 p-6 rounded-lg text-center border border-gray-800 hover:border-white transition"
            >
              <div className="w-full h-48 bg-gray-800 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-600">Product Image</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-white text-2xl font-bold">{product.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Print Cartel */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Choose Print Cartel</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Premium Quality",
                description: "High-quality DTF printing with vibrant colors and durability",
              },
              {
                title: "Live Preview",
                description: "See exactly how your design looks on the garment before ordering",
              },
              {
                title: "Fast Turnaround",
                description: "Quick processing and delivery of your custom orders",
              },
              {
                title: "Easy to Use",
                description: "Intuitive interface makes ordering simple and hassle-free",
              },
              {
                title: "Expert Support",
                description: "Our team is ready to help with any questions or custom requests",
              },
              {
                title: "Competitive Pricing",
                description: "Great prices without compromising on quality",
              },
            ].map((feature) => (
              <div key={feature.title} className="border border-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Create your first custom order today and see the difference quality makes.
        </p>
        <Button
          onClick={() => setLocation("/order")}
          size="lg"
          className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6"
        >
          Order Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400">
          <p>&copy; 2026 Print Cartel. All rights reserved.</p>
          <p className="mt-2">
            Email: <a href="mailto:sales@printcartel.co.za" className="text-white hover:underline">sales@printcartel.co.za</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
