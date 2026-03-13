import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { CheckCircle, TrendingUp, Users, Award, ArrowRight, Zap, Shield, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function Reseller() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    estimatedMonthlyVolume: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitInquiry = trpc.reseller.submitInquiry.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitInquiry.mutateAsync(formData);
      toast.success('Inquiry submitted! We\'ll contact you soon.');
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        businessType: '',
        estimatedMonthlyVolume: '',
        message: '',
      });
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pricingTiers = [
    {
      volume: '10-50 Units',
      discount: '5%',
      description: 'Perfect for small businesses and event companies',
      features: ['Quick setup', 'Email support', 'Standard turnaround'],
    },
    {
      volume: '51-100 Units',
      discount: '10%',
      description: 'Great for growing resellers',
      features: ['Priority support', 'Faster turnaround', 'Bulk discounts'],
    },
    {
      volume: '101-500 Units',
      discount: '15%',
      description: 'Ideal for established retailers',
      features: ['Dedicated manager', 'Custom pricing', 'Premium support'],
      highlighted: true,
    },
    {
      volume: '500+ Units',
      discount: 'Custom',
      description: 'Enterprise solutions with dedicated support',
      features: ['White-label options', 'Custom contracts', '24/7 support'],
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Competitive Pricing',
      description: 'Volume-based discounts that grow with your business',
    },
    {
      icon: Users,
      title: 'Dedicated Support',
      description: 'Personal account manager for your reseller account',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Premium DTF printing with consistent quality',
    },
    {
      icon: Zap,
      title: 'Fast Turnaround',
      description: 'Quick production and reliable shipping',
    },
    {
      icon: Shield,
      title: 'Reliable Partner',
      description: 'Trusted by hundreds of resellers nationwide',
    },
    {
      icon: Rocket,
      title: 'Growth Support',
      description: 'Marketing materials and business guidance included',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-primary font-semibold text-sm">Wholesale Opportunity</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-foreground leading-tight">
            Grow Your Business with <span className="text-primary">Print Cartel</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Partner with us for wholesale DTF printing. Access competitive pricing, dedicated support, and premium quality to scale your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Your Partnership <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/track-order'}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section - Enhanced */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Partner With Print Cartel?</h2>
            <p className="text-lg text-muted-foreground">Everything you need to succeed as a reseller</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-8 hover:shadow-lg hover:border-primary/50 transition-all duration-300 border-2 border-transparent">
                  <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section - Enhanced */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Bulk Pricing Tiers</h2>
            <p className="text-lg text-muted-foreground">Flexible pricing that grows with your business</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`p-8 border-2 transition-all duration-300 ${
                  tier.highlighted 
                    ? 'border-primary bg-primary/5 shadow-xl scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {tier.highlighted && (
                  <div className="mb-4 inline-block px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-foreground mb-3">{tier.volume}</h3>
                <div className="text-4xl font-bold text-primary mb-6">{tier.discount}</div>
                <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
                
                <div className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-12">
            * Final pricing depends on product selection and customization requirements. Contact us for a detailed quote.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Get Started Today</h2>
            <p className="text-lg text-muted-foreground">Fill out the form below and our team will contact you within 24-48 hours</p>
          </div>
          
          <Card className="p-8 border-2 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <Input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Your company name"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contact Name *
                  </label>
                  <Input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="">Select business type</option>
                    <option value="Print Shop">Print Shop</option>
                    <option value="Clothing Brand">Clothing Brand</option>
                    <option value="Event Company">Event Company</option>
                    <option value="E-commerce Store">E-commerce Store</option>
                    <option value="Corporate Gifts">Corporate Gifts</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Estimated Monthly Volume *
                  </label>
                  <select
                    name="estimatedMonthlyVolume"
                    value={formData.estimatedMonthlyVolume}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="">Select volume range</option>
                    <option value="10-50">10-50 units</option>
                    <option value="51-100">51-100 units</option>
                    <option value="101-500">101-500 units</option>
                    <option value="500+">500+ units</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message (Optional)
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your business and what you're looking for..."
                  rows={5}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-md transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We'll review your inquiry and contact you within 24-48 hours.
              </p>
            </form>
          </Card>
        </div>
      </section>

      {/* Enhanced CTA Section with DTF Background */}
      <section 
        className="relative py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/reseller-dtf-cta-background-Us7opBVtM4DoWTmUyLrqE5.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join hundreds of successful resellers who trust Print Cartel for their DTF printing needs. Start your partnership today and unlock exclusive benefits.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Get Started Now <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
