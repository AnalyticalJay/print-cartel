import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Zap, Eye, Truck, Lightbulb, Headphones, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();

  const galleryImages = [
    {
      src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/QrNKXFFoVGiiiKvY.jpg",
      alt: "DTF Print - Front Design",
    },
    {
      src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/xzpYUzlxNlKgrbZq.jpg",
      alt: "DTF Print - Sleeve Design",
    },
    {
      src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/HKHbQAkhneUpgQWZ.jpg",
      alt: "DTF Print - Back Design",
    },
    {
      src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/lZQjDrMLWvZfkrzW.jpg",
      alt: "DTF Print - Full Garment",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation("/")}>
            Print Cartel
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/track")}
              className="text-foreground hover:bg-gray-100 font-semibold"
            >
              Track Order
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="text-foreground hover:bg-gray-100 font-semibold"
            >
              My Account
            </Button>
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="text-foreground hover:bg-gray-100 font-semibold"
              >
                Admin
              </Button>
            )}
            <Button
              onClick={() => setLocation("/order")}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              Order Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-deep-charcoal to-black text-white py-32">
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl md:text-5xl font-black mb-4 leading-tight">
                Custom DTF
                <br />
                <span className="text-accent">Printing</span>
                <br />
                Made Simple
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-lg">
                Design, preview, and order custom-printed apparel with our intuitive platform. Premium quality DTF printing for your brand.
              </p>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={() => setLocation("/order")}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 font-bold"
              >
                Start Your Order
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 font-bold"
              >
                View Our Work
              </Button>
            </div>
          </div>

          {/* Hero Image - Print Cartel Logo */}
          <div className="relative h-96 md:h-full min-h-96 flex items-center justify-center">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/zvKZAvPjOrLorAIn.png"
              alt="Print Cartel Logo"
              className="max-h-96 max-w-96 object-contain hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-soft-grey py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-black mb-12 text-center text-foreground">How It Works</h2>
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
                description: "Upload your artwork in any format",
              },
              {
                step: 4,
                title: "Preview & Order",
                description: "See your design on the garment and submit",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-5xl font-black mb-12 text-center text-foreground">Our Products</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { name: "Lightweight T-Shirt", price: "R70", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/QrNKXFFoVGiiiKvY.jpg" },
            { name: "Men's Polo", price: "R120", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/xzpYUzlxNlKgrbZq.jpg" },
            { name: "Men's Dry Fit Polo", price: "R120", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/HKHbQAkhneUpgQWZ.jpg" },
            { name: "Hoodie", price: "R300", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/lZQjDrMLWvZfkrzW.jpg" },
          ].map((product) => (
            <div
              key={product.name}
              className="bg-white p-6 rounded-xl text-center border-3 border-gray-200 shadow-md hover:shadow-2xl hover:border-accent transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-full h-48 bg-gray-300 rounded mb-4 flex items-center justify-center overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{product.name}</h3>
              <p className="text-accent text-2xl font-black">{product.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Print Cartel */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-black mb-12 text-center text-foreground">Why Choose Print Cartel</h2>
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
            ].map((feature, index) => {
              const icons = [Zap, Eye, Truck, Lightbulb, Headphones, DollarSign];
              const Icon = icons[index];
              return (
                <div key={feature.title} className="border-2 border-accent/40 p-8 rounded-xl hover:border-accent hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={32} className="text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bold CTA Section */}
      <section className="bg-gradient-to-r from-black to-deep-charcoal text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-6xl font-black mb-6 leading-tight">
            Ready to Print Your Design?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your first custom order today and see the difference quality makes.
          </p>
          <Button
            onClick={() => setLocation("/order")}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-12 py-7 font-bold group"
          >
            Start Your Order
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-soft-grey">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-muted-foreground">
          <p className="font-semibold text-foreground">&copy; 2026 Print Cartel. All rights reserved.</p>
          <p className="mt-2">
            Email: <a href="mailto:sales@printcartel.co.za" className="text-accent hover:underline font-semibold">sales@printcartel.co.za</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
