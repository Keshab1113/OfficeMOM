import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, MessageCircle, ArrowUp } from "lucide-react";

const Footer = () => {

  const footerLinks = {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
    //   { name: "Use Cases", href: "/use-cases" },
    ],
    company: [
      { name: "About Us", href: "/about-us" },
      { name: "Contact", href: "/contact-us" },
    //   { name: "Careers", href: "/careers" },
    ],
    support: [
      { name: "Documentation", href: "/documentation" },
      { name: "Privacy Policy", href: "/privacy-policy" },
    //   { name: "Terms of Service", href: "/terms" },
    ],
    connect: [
      {
        name: "support@officemom.com",
        href: "mailto:support@officemom.com",
        icon: Mail,
      },
      { name: "Live Chat", href: "/support", icon: MessageCircle },
    ],
  };

  return (
    <>
      <footer
        id="animated-footer"
        className="relative bg-gradient-to-br from-slate-50 via-blue-100 to-indigo-100 
                    dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30 
                    border-t border-white/30 dark:border-gray-700/50 overflow-hidden"
      >
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          {/* Main Footer Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-5 gap-8 mb-12"
          >
            {/* Brand Section */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center space-x-3 mb-6 group">
                <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
                <img src="/logo.webp" alt="logo" loading="lazy" />
              </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                    OfficeMoM
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI Meeting Assistant
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg mb-6">
                Transform your meetings with AI-powered transcription, smart
                summaries, and seamless collaboration tools for teams of all
                sizes.
              </p>
              <div className="flex items-center space-x-4">
                {footerLinks.connect.map((link, index) => {
                  const IconComponent = link.icon;
                  return (
                    <motion.a
                      key={index}
                      href={link.href}
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 
                                                hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 
                                                group"
                      whileHover={{ x: 5 }}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm">{link.name}</span>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>

            {/* Product Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                Product
              </h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  >
                    <Link
                      to={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 
                                                transition-all duration-300 relative group text-sm"
                    >
                      {link.name}
                      <span
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 
                                                transition-all duration-300 group-hover:w-full"
                      ></span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                Company
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <Link
                      to={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 
                                                transition-all duration-300 relative group text-sm"
                    >
                      {link.name}
                      <span
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 
                                                transition-all duration-300 group-hover:w-full"
                      ></span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                Support
              </h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <Link
                      to={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 
                                                transition-all duration-300 relative group text-sm"
                    >
                      {link.name}
                      <span
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 
                                                transition-all duration-300 group-hover:w-full"
                      ></span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              &copy; 2025{" "}
              <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                OfficeMoM
              </span>
              , a subsidiary of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                QuantumHash Corporation
              </span>
              . All rights reserved.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
              Powered by cross-industry expertise, perfected for productivity
            </p>
          </motion.div>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
      </footer>
    </>
  );
};

export default Footer;
