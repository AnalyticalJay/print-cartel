import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { PromoBar } from "@/components/PromoBar";
import { Button } from "@/components/ui/button";
import { Zap, Eye, Truck, Lightbulb, Headphones, DollarSign, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { BulkDiscountTable } from "@/components/BulkDiscountTable";
import { ProductSlider } from "@/components/ProductSlider";
import { trpc } from "@/lib/trpc";

function ProductShowcase() {
  const productsQuery = trpc.products.list.useQuery();

  if (productsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!productsQuery.data || productsQuery.data.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No products available</div>;
  }

  return <ProductSlider products={productsQuery.data} />;
}

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
      <PromoBar />
      <Navigation />

      {/* Enhanced Hero Section - Center Aligned with Colorful Text */}
      <section className="relative overflow-hidden bg-black text-white py-20 sm:py-28 md:py-40">
        {/* DTF Artwork Background */}
        <div 
          className="absolute inset-0 opacity-60 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/dtf-hero-bg-NKCpFvYJN8Px8Z4DtsZHz8.webp)',
          }}
        />
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Hero Content - Center Aligned */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            {/* Main Heading with Bold Colorful Text */}
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6">
                <span className="block text-white">Custom DTF</span>
                <span className="block bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                  Printing
                </span>
                <span className="block text-white">Made Simple</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
                Design, preview, and order custom-printed apparel with our intuitive platform. Premium quality DTF printing for your brand.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
              <Button
                onClick={() => setLocation("/order")}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm sm:text-base md:text-lg px-6 sm:px-10 py-3 sm:py-6 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Your Order
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 text-sm sm:text-base md:text-lg px-6 sm:px-10 py-3 sm:py-6 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Contact Us
              </Button>
            </div>

          </div>
        </div>
      </section>


      {/* How It Works */}
      <section className="bg-soft-grey py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-8 sm:mb-12 text-center text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
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
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-black text-lg sm:text-2xl mx-auto mb-3 sm:mb-4">
                  {item.step}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-8 sm:mb-12 text-center text-foreground">Our Products</h2>
        <ProductShowcase />
      </section>

      {/* Why Choose Print Cartel */}
      <section className="bg-gradient-to-b from-soft-grey to-white py-16 sm:py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 text-foreground">Why Choose Print Cartel</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">We deliver exceptional quality and service that sets us apart from the competition</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Premium Quality",
                description: "High-quality DTF printing with vibrant colors and exceptional durability",
                icon: Zap,
              },
              {
                title: "Fast Turnaround",
                description: "Quick processing and reliable delivery of your custom orders",
                icon: Truck,
              },
              {
                title: "Easy to Use",
                description: "Intuitive interface makes ordering simple and hassle-free",
                icon: Lightbulb,
              },
              {
                title: "Expert Support",
                description: "Our dedicated team is ready to help with any questions",
                icon: Headphones,
              },
              {
                title: "Competitive Pricing",
                description: "Great prices without compromising on quality",
                icon: DollarSign,
              },
              {
                title: "Trusted Partner",
                description: "Serving hundreds of satisfied customers with consistent excellence",
                icon: Eye,
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group relative bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border hover:border-accent/50">
                  {/* Icon Background */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors duration-300" />
                  
                  {/* Icon */}
                  <div className="relative mb-4 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent/10 rounded-xl group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent group-hover:text-accent-foreground" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Bulk Discount Pricing Section */}
      <section className="bg-white py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 text-foreground">Bulk Order Pricing</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Save more when you order in bulk. Get up to 30% discount on orders of 100+ units.
            </p>
          </div>
          <BulkDiscountTable />
        </div>
      </section>

      {/* Bold CTA Section */}
      <section className="bg-gradient-to-r from-black to-deep-charcoal text-white py-16 sm:py-20 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight">
            Ready to Print Your Design?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
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
