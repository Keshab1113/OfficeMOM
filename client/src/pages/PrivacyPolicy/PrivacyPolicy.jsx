// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer/Footer";
import { Shield, Lock, Eye, UserCheck, FileText, Mail } from "lucide-react";
import Header from "../../components/Header/Header";
import { useEffect } from "react";

const PrivacyPolicy = () => {
  const privacySections = [
    {
      icon: UserCheck,
      title: "Information We Collect",
      content:
        "We may collect personal information such as your name, email, and meeting recordings when you use OfficeMoM to manage and generate meeting minutes. This includes audio/video data for transcription purposes and account information for service delivery.",
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content:
        "The information collected is used to provide transcription services, improve our AI models, ensure platform security, deliver personalized user experiences, and communicate important service updates. We never use your meeting content to train our AI without explicit consent.",
    },
    {
      icon: Lock,
      title: "Data Security",
      content:
        "We implement enterprise-grade security measures including end-to-end encryption, SOC 2 compliance, regular security audits, and strict access controls to protect your data from unauthorized access, alteration, disclosure, or destruction.",
    },
    {
      icon: Shield,
      title: "Sharing of Information",
      content:
        "OfficeMoM does not sell or rent your personal data. We may share data with trusted third-party service providers only to deliver our services, under strict confidentiality agreements and data processing agreements that meet GDPR requirements.",
    },
    {
      icon: FileText,
      title: "Your Rights",
      content:
        "You have the right to access, update, export, or delete your personal data at any time. You can manage your privacy preferences, opt out of communications, and request data portability through your account settings or by contacting our support team.",
    },
    {
      icon: Mail,
      title: "Contact Us",
      content:
        "If you have any questions or concerns about this Privacy Policy, or need assistance with data privacy matters, our dedicated privacy team is here to help you.",
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Privacy Policy</title>
        <link rel="canonical" href="https://officemom.me/privacy-policy" />
      </Helmet>

      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
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
        {/* <Header /> */}
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
                className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6"
              >
                <Shield className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Privacy Policy
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Your privacy is our priority. Learn how we protect and handle
                your data with enterprise-grade security and transparency.
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
                At{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  OfficeMoM
                </span>
                , we value your privacy and are committed to protecting your
                personal information. This Privacy Policy explains how we
                collect, use, and safeguard your data when you use our
                AI-powered meeting management services.
              </p>
            </motion.div>

            {/* Privacy Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {privacySections.map((section, index) => {
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
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
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

            {/* Additional Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Policy Updates
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We may update this Privacy Policy to reflect changes in our
                    practices or legal requirements. Significant changes will be
                    communicated through email notifications and platform
                    announcements.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Our Privacy Team
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    For privacy-related inquiries or to exercise your data
                    rights:
                  </p>
                  <a
                    href="mailto:support@officemom.me"
                    className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
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

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="text-center mt-12"
            >
              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 dark:text-gray-500">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">
                    End-to-End Encryption
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">SOC 2 Certified</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <Footer />
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
      </section>
    </>
  );
};

export default PrivacyPolicy;
