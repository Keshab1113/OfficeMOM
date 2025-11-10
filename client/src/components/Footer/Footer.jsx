import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Youtube, Linkedin, Instagram, Facebook, Twitter, Sparkles, ArrowRight } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Supported Language", href: "/supported-language" },
    ],
    company: [
      { name: "About Us", href: "/about-us" },
      { name: "Contact", href: "/contact-us" },
    ],
    support: [
      { name: "Documentation", href: "/documentation" },
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
    ],
  };

  const socialLinks = [
    { 
      name: "YouTube", 
      href: "https://www.youtube.com/@QuantumHashCorporation", 
      icon: Youtube,
      color: "hover:bg-red-500"
    },
    { 
      name: "LinkedIn", 
      href: "https://www.linkedin.com/company/quantumhash-corporation/", 
      icon: Linkedin,
      color: "hover:bg-blue-600"
    },
    { 
      name: "Instagram", 
      href: "https://www.instagram.com/quantumhash_corporation/", 
      icon: Instagram,
      color: "hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-500"
    },
    { 
      name: "Facebook", 
      href: "https://www.facebook.com/share/14P25GcnrTX/", 
      icon: Facebook,
      color: "hover:bg-blue-700"
    },
    { 
      name: "X", 
      href: "https://x.com/QuantumhashCrp", 
      icon: Twitter,
      color: "hover:bg-black dark:hover:bg-black"
    },
  ];

  const hiddenRoutes = [
    "/meeting",
    "/generate-notes",
    "/live-meeting",
    "/login",
    "/signup",
    "/forgot-password",
  ];

  const hideFooterMargin = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <footer
      className={`relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 
                  dark:from-gray-950 dark:via-indigo-950/20 dark:to-gray-900 
                  overflow-hidden ${hideFooterMargin ? "mb-0" : "lg:mb-0 mb-4 md:mb-10"}`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Wave Divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

        {/* Newsletter Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-12 border-b border-gray-200/50 dark:border-gray-800/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Stay Updated
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Get the latest updates and AI meeting insights</p>
            </div>
            <Link
              to="/contact-us"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Mail className="w-5 h-5" />
              Contact Us
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-8 lg:gap-12 py-16">
          {/* Brand Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 space-y-6"
          >
            <Link to="/" className="inline-flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-white to-blue-100 dark:from-gray-800 dark:to-indigo-900 rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/logo.webp" alt="OfficeMoM Logo" className="w-8 h-8" loading="lazy" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  OfficeMoM
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI Meeting Assistant</p>
              </div>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Transform your meetings with AI-powered transcription, smart summaries, and seamless collaboration tools for teams of all sizes.
            </p>

            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Connect With Us</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className={`group relative w-11 h-11 flex items-center justify-center rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl ${social.color}`}
                      title={social.name}
                    >
                      <Icon className="w-5 h-5 relative z-10" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-indigo-500 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-purple-500 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-blue-500 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Card */}
          
        </div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-gray-200/50 dark:border-gray-800/50 py-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025{" "}
              <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                OfficeMoM
              </span>
              , a subsidiary of{" "}
              <a
                href="https://quantumhash.me"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                QuantumHash Corporation
              </a>
              . All rights reserved.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              Powered by cross-industry expertise, perfected for productivity ✨
            </p>
          </div>
        </motion.div>
      </div>

      {/* Floating Particles */}
      <div className="absolute bottom-20 left-10 w-2 h-2 bg-indigo-400 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute top-32 right-24 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-64 left-32 w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
    </footer>
  );
};

export default Footer;