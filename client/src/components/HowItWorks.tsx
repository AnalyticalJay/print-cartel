import { motion } from "framer-motion";

interface Step {
  icon: string;
  title: string;
  description: string;
  number: number;
}

const steps: Step[] = [
  {
    icon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/icon-choose-garment-3d-DCELWzXs8piXWm8uhzuGx2.webp",
    title: "Choose Garment",
    description: "Select from our premium collection of high-quality apparel",
    number: 1,
  },
  {
    icon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/icon-select-options-3d-dyscytaP3T8nDLTFFqLKnN.webp",
    title: "Select Print Options",
    description: "Pick placement, size, and customize your design specifications",
    number: 2,
  },
  {
    icon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/icon-upload-design-3d-L4uzwNQMHezeth5Xbso5ih.webp",
    title: "Upload Design",
    description: "Upload your artwork in your preferred format",
    number: 3,
  },
  {
    icon: "https://d36hbw14aib5lz.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/icon-preview-order-3d-aGSps95cNpBxMVzVVTvjAq.webp",
    title: "Preview & Order",
    description: "Review your design and submit your order with confidence",
    number: 4,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as any,
      },
  },
};

const iconVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as any,
      },
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.3,
    },
  },
};

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Four simple steps to transform your designs into stunning custom DTF printed apparel
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative"
            >
              {/* Step Card */}
              <motion.div
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col items-center text-center"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step Number Badge */}
                <motion.div
                  className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  {step.number}
                </motion.div>

                {/* Icon */}
                <motion.div
                  className="mb-6 flex items-center justify-center"
                  variants={iconVariants}
                  whileHover="hover"
                >
                  <img
                    src={step.icon}
                    alt={step.title}
                    className="w-24 h-24 object-contain drop-shadow-lg bg-transparent"
                  />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed flex-grow">
                  {step.description}
                </p>

                {/* Connector Line (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 w-8 h-1 bg-gradient-to-r from-cyan-300 to-transparent transform -translate-y-1/2"></div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-slate-600 mb-6">
            Ready to create your custom designs?
          </p>
          <motion.a
            href="/order"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Order Now
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
