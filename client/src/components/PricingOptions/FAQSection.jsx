import React, { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  MessageCircle,
  Mail,
  Clock,
  CreditCard,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const FAQSection = () => {
  const [openItems, setOpenItems] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageType = "planPage";

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/faq/${pageType}`
      );
      if (response.data.success) {
        setFaqs(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageType) {
      fetchFAQs();
    }
  }, [pageType]);

  const selectedCategories = [
    "Features & Capabilities",
    "Support & Security",
    "Billing & Payments",
    "Usage & Limits",
  ];

  const faqData = selectedCategories.map((category) => ({
    category,
    icon:
      category === "Features & Capabilities"
        ? MessageCircle
        : category === "Support & Security"
        ? Mail
        : category === "Billing & Payments"
        ? CreditCard
        : category === "Usage & Limits"
        ? Clock
        : null,
    items: faqs
      .filter((faq) => faq.category === category)
      .map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
  }));

  const generalQuestions = faqs.filter((faq) => faq.category === "General");

  if (error)
    return (
      <div>
        <h2 className="text-2xl text-center my-8">Error: {error}</h2>
        <p className=" text-center my-4">Please try again later.</p>
      </div>
    );
  if (loading)
    return (
      <div>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto py-20 px-4 border-t border-slate-200 dark:border-slate-600">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Get answers to common questions about our plans, features, and billing
        </p>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 max-w-2xl mx-auto border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MessageCircle
              className="text-indigo-600 dark:text-indigo-400"
              size={24}
            />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Still have questions?
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Our support team is here to help you choose the right plan
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/contact-us"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Categorized FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {faqData.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <IconComponent
                    size={20}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {category.category}
                </h3>
              </div>

              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const fullIndex = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems[fullIndex];

                  return (
                    <div
                      key={itemIndex}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(fullIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 dark:text-white pr-4">
                          {item.question}
                        </span>
                        <div className="flex-shrink-0">
                          {isOpen ? (
                            <Minus
                              size={20}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                          ) : (
                            <Plus
                              size={20}
                              className="text-gray-500 dark:text-gray-400"
                            />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* General Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8">
          General Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generalQuestions.map((item, index) => {
            const fullIndex = `general-${index}`;
            const isOpen = openItems[fullIndex];

            return (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(fullIndex)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white pr-4 text-sm md:text-base">
                    {item.question}
                  </span>
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <Minus
                        size={18}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    ) : (
                      <Plus
                        size={18}
                        className="text-gray-500 dark:text-gray-400"
                      />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied users who trust our transcription
            services. Start with our Free plan and upgrade when you're ready.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQSection;
