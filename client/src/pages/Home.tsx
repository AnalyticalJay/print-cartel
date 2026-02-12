import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

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
          <div className="text-2xl font-bold text-foreground">Print Cartel</div>
          <Button
            onClick={() => setLocation("/order")}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            Order Now
          </Button>
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
              <h1 className="text-6xl md:text-7xl font-black mb-4 leading-tight">
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

          {/* Hero Image */}
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg overflow-hidden">
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/QrNKXFFoVGiiiKvY.jpg"
                alt="Premium DTF Apparel"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
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

      {/* NEW: Real DTF Prints in Action Gallery */}
      <section className="bg-black py-24 relative overflow-hidden">
        {/* Subtle spotlight effect */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4 text-white">Real DTF Prints in Action</h2>
            <p className="text-xl text-gray-400">See the quality before you order.</p>
          </div>

          {/* Carousel */}
          <div className="relative">
            <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden shadow-2xl">
              {/* Current Image */}
              <div className="absolute inset-0">
                <img
                  src={galleryImages[currentSlide].src}
                  alt={galleryImages[currentSlide].alt}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
                aria-label="Previous slide"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
                aria-label="Next slide"
              >
                <ChevronRight size={24} />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? "bg-accent w-8" : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Gallery Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Slide {currentSlide + 1} of {galleryImages.length}
            </p>
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
              className="bg-soft-grey p-6 rounded-lg text-center border-2 border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
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
      <section className="bg-deep-charcoal text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-black mb-12 text-center">Why Choose Print Cartel</h2>
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
              <div key={feature.title} className="border-2 border-accent/30 p-6 rounded-lg hover:border-accent hover:bg-accent/5 transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-accent">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
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
