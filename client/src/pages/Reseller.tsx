import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { CheckCircle, TrendingUp, Users, Award } from 'lucide-react';
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
    },
    {
      volume: '51-100 Units',
      discount: '10%',
      description: 'Great for growing resellers',
    },
    {
      volume: '101-500 Units',
      discount: '15%',
      description: 'Ideal for established retailers',
    },
    {
      volume: '500+ Units',
      discount: 'Custom',
      description: 'Enterprise solutions with dedicated support',
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
      icon: CheckCircle,
      title: 'Fast Turnaround',
      description: 'Quick production and reliable shipping',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            Become a Print Cartel Reseller
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Partner with us for wholesale DTF printing. Grow your business with our competitive pricing and dedicated support.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Why Partner With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Bulk Pricing Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className="p-6 border-2 hover:border-primary transition-colors">
                <h3 className="text-xl font-bold text-foreground mb-2">{tier.volume}</h3>
                <div className="text-3xl font-bold text-primary mb-4">{tier.discount} Off</div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </Card>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-8">
            * Final pricing depends on product selection and customization requirements. Contact us for a detailed quote.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Get Started Today</h2>
          <Card className="p-8">
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-md transition-colors"
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

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Join hundreds of resellers who trust Print Cartel for their DTF printing needs.
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Get Started Now
        </Button>
      </section>
    </div>
  );
}
