import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Zap, Eye, Truck, Lightbulb, Headphones, DollarSign, Loader2, Palette, Settings, Upload, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

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
      <Navigation />

      {/* Enhanced Hero Section - Center Aligned with Colorful Text */}
      <section className="relative overflow-hidden bg-black text-white py-20 sm:py-28 md:py-40">
        {/* T-Shirt Mockup Background */}
        <div 
          className="absolute inset-0 opacity-100 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/tshirt-hero-splash-czPtMi7tbbazyVqaoGTspp.webp)',
          }}
        />
        
        {/* Light overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Hero Content - Center Aligned */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            {/* Main Heading with Bold Colorful Text */}
            <div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-graffiti leading-tight mb-4 sm:mb-6 tracking-tight" style={{ fontFamily: '"Fredoka One", sans-serif', letterSpacing: '-0.02em' }}>
                <span className="block text-white drop-shadow-lg">Custom DTF</span>
                <span className="block text-yellow-300 drop-shadow-lg font-bold">
                  Printing
                </span>
                <span className="block text-white drop-shadow-lg">Made Simple</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Palette,
                title: "Choose Garment",
                description: "Select from our premium collection",
                color: "text-pink-500",
                bgColor: "bg-pink-100",
              },
              {
                icon: Settings,
                title: "Select Print Options",
                description: "Pick placement and size",
                color: "text-blue-500",
                bgColor: "bg-blue-100",
              },
              {
                icon: Upload,
                title: "Upload Design",
                description: "Upload your artwork",
                color: "text-purple-500",
                bgColor: "bg-purple-100",
              },
              {
                icon: CheckCircle,
                title: "Preview & Order",
                description: "See your design and submit",
                color: "text-green-500",
                bgColor: "bg-green-100",
              },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="flex md:flex-col md:text-center gap-4 md:gap-0">
                  <div className={`${item.bgColor} ${item.color} rounded-lg p-3 md:p-4 flex-shrink-0 md:mx-auto md:mb-4 w-fit md:w-auto`}>
                    <IconComponent className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1 md:flex-none">
                    <h3 className="text-base sm:text-lg md:text-lg font-bold mb-1 text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
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




      {/* Bold CTA Section with DTF Designs Background */}
      <section className="text-white py-16 sm:py-20 md:py-24 relative overflow-hidden bg-cover bg-center" style={{
        backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/dtf-cta-designs-background-X3wLnvasjvnYHrTRPkkvDQ.webp)',
      }}>
        {/* Slight dark overlay */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight drop-shadow-lg">
            Ready to Print Your Design?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 sm:mb-8 drop-shadow-md">
            Create your first custom order today and see the difference quality makes.
          </p>
          <Button
            onClick={() => setLocation("/order")}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-12 py-7 font-bold group shadow-lg"
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
