// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer/Footer";
import { FileText, Scale, Shield, AlertTriangle, Users, Globe, BookOpen, Mail } from "lucide-react";
import Header from "../../components/Header/Header";
import { useEffect } from "react";

const TermsOfService = () => {
  const termsSections = [
    {
      icon: FileText,
      title: "Acceptance of Terms",
      content: "By accessing and using OfficeMoM's AI-powered meeting management services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use of our services immediately."
    },
    {
      icon: Users,
      title: "User Accounts and Registration",
      content: "You must be at least 18 years old to use our services. When creating an account, you agree to provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
    },
    {
      icon: Shield,
      title: "Acceptable Use",
      content: "You agree not to use OfficeMoM for any illegal, harmful, or abusive purposes. This includes but is not limited to: transmitting malicious code, attempting unauthorized access, infringing on intellectual property rights, or using the service to harass others. You retain all rights to your meeting content while granting us limited rights to process it for service delivery."
    },
    {
      icon: Scale,
      title: "Service Terms and Limitations",
      content: "OfficeMoM provides AI-powered meeting transcription and minute generation services 'as is'. We reserve the right to modify, suspend, or discontinue any service feature at any time. While we strive for high accuracy, we do not guarantee error-free transcriptions and disclaim liability for decisions made based on meeting content."
    },
    {
      icon: AlertTriangle,
      title: "Prohibited Activities",
      content: "You may not: reverse engineer our services, use automated systems to access our platform excessively, attempt to bypass security measures, use the service for competitive analysis, or violate any applicable laws. We reserve the right to terminate accounts for violations of these terms."
    },
    {
      icon: Globe,
      title: "Intellectual Property",
      content: "OfficeMoM's platform, technology, and branding are protected by intellectual property laws. You grant us a limited license to process your meeting content solely for providing our services. We do not claim ownership over your meeting recordings or generated minutes."
    }
  ];

  const additionalTerms = [
    {
      title: "Payment and Billing",
      content: "For paid subscriptions, you agree to pay all applicable fees. Fees are non-refundable except as required by law. We may change service fees with 30 days' notice. Late payments may result in service suspension."
    },
    {
      title: "Termination",
      content: "Either party may terminate service with written notice. Upon termination, your right to use the services ceases immediately. We may retain your data for a reasonable period as required by law or for legitimate business purposes."
    },
    {
      title: "Disclaimer of Warranties",
      content: "Services are provided 'as available' without warranties of any kind. We do not guarantee uninterrupted or error-free service. Your use of the services is at your sole risk and discretion."
    },
    {
      title: "Limitation of Liability",
      content: "To the maximum extent permitted by law, OfficeMoM shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you paid for services in the past six months."
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Terms of Service</title>
        <link rel="canonical" href="https://officemom.me/terms-of-service" />
      </Helmet>

      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-300 dark:bg-amber-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-300 dark:bg-orange-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-300 dark:bg-yellow-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="w-20 h-20 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6"
              >
                <Scale className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Terms of Service
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Please read these terms carefully before using OfficeMoM. These terms govern your access to and use of our AI-powered meeting management services.
              </motion.p>
            </motion.div>

            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 mb-12"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-center">
                These Terms of Service ("Terms") constitute a legal agreement between you and{" "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  OfficeMoM
                </span>
                {" "}governing your use of our meeting management platform. By using our services, you agree to be bound by these Terms and our Privacy Policy.
              </p>
            </motion.div>

            {/* Main Terms Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {termsSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Additional Terms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Additional Terms and Conditions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {additionalTerms.map((term, index) => (
                  <div key={term.title} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-amber-500" />
                      <span>{term.title}</span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                      {term.content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Governing Law and Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Governing Law and Disputes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    These Terms shall be governed by the laws of the jurisdiction where OfficeMoM is established. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, rather than in court.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Contact for Legal Inquiries
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    For questions about these Terms or legal matters:
                  </p>
                  <a
                    href="mailto:support@officemom.me"
                    className="inline-flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200"
                  >
                    <Mail className="w-5 h-5" />
                    <span>support@officemom.me</span>
                  </a>
                </div>
              </div>

              {/* Last updated */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Last updated:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </motion.div>

            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="text-center mt-12"
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                    Important Legal Notice
                  </h4>
                </div>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  These Terms of Service constitute a binding legal agreement. By using OfficeMoM, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions outlined herein. If you do not agree to these terms, you must discontinue use of our services.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <Footer />
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-amber-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-orange-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-yellow-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
      </section>
    </>
  );
};

export default TermsOfService;