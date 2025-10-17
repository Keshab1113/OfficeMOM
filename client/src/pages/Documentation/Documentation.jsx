import Footer from "../../components/Footer/Footer";
import { Helmet } from "react-helmet";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import {
  BookOpen,
  Upload,
  FileText,
  Code,
  HelpCircle,
  Play,
  Zap,
  Users,
  Shield,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Play,
    content: `Welcome to OfficeMoM! This documentation will guide you through setup and usage. 
    Start by creating an account, uploading meeting audio, and generating transcripts.`,
    features: [
      "Create your account in under 2 minutes",
      "Set up your team workspace",
      "Configure your meeting preferences",
      "Invite team members to collaborate",
    ],
  },
  {
    id: "upload-audio",
    title: "Uploading Audio & Video",
    icon: Upload,
    content: `To upload audio, navigate to the Upload page and select your file. 
    Supported formats: MP3, WAV, M4A, MP4, and MOV. The system will securely store your media and generate transcripts.`,
    features: [
      "Drag & drop file upload",
      "Batch upload support",
      "Automatic format detection",
      "Secure cloud storage",
    ],
  },
  {
    id: "generate-mom",
    title: "Generating Meeting Minutes",
    icon: FileText,
    content: `After uploading audio, click "Generate MoM". Our AI will analyze the transcript, 
    extract action items, identify speakers, and create professional meeting minutes for you.`,
    features: [
      "AI-powered action item detection",
      "Speaker identification",
      "Smart summarization",
      "Customizable templates",
    ],
  },
  {
    id: "api",
    title: "API Integration",
    icon: Code,
    content: `Developers can integrate OfficeMoM via our REST API. 
    Use your API key from the dashboard to upload files, fetch transcripts, and manage meeting data programmatically.`,
    features: [
      "RESTful API endpoints",
      "Webhook support",
      "Comprehensive SDKs",
      "Rate limiting & quotas",
    ],
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    icon: HelpCircle,
    content: `Find answers to common questions about data privacy, supported formats, 
    transcription accuracy, team management, and billing.`,
    features: [
      "Data security & privacy",
      "Format compatibility",
      "Accuracy & limitations",
      "Team collaboration features",
    ],
  },
];

const quickStats = [
  { icon: Zap, label: "Setup Time", value: "2 minutes" },
  { icon: Users, label: "Team Members", value: "Unlimited" },
  { icon: Shield, label: "Security", value: "Enterprise-grade" },
  { icon: Clock, label: "Support", value: "24/7" },
];

const breadcrumbItems = [{ label: "Documentation" }];

const Documentation = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | Documentation</title>
        <link rel="canonical" href="https://officemom.me/documentation" />
      </Helmet>

      <section className="relative w-full min-h-screen overflow-hidden">

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

        {/* Main content */}
        <div className="relative z-10 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-20">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Breadcrumb items={breadcrumbItems} />
            </div>

            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6"
              >
                <BookOpen className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              >
                OfficeMoM Documentation
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
              >
                Learn how to set up, use, and integrate OfficeMoM to make your
                meetings smarter and more productive with AI-powered
                transcription and collaboration.
              </motion.p>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
              >
                {quickStats.map((stat) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 text-center border border-white/20 dark:border-gray-700/50"
                    >
                      <IconComponent className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Documentation Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Icon and Title */}
                      <div className="lg:w-1/4">
                        <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {section.title}
                          </h2>
                        </div>
                      </div>

                      {/* Content and Features */}
                      <div className="lg:w-3/4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          {section.content}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {section.features.map((feature, featureIndex) => (
                            <motion.div
                              key={feature}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: featureIndex * 0.1 }}
                              className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                            >
                              <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                              <span className="text-sm">{feature}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Support CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-500/30 dark:to-purple-600/40 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-3">Need More Help?</h3>
                <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                  Our support team is here to help you get the most out of
                  OfficeMoM. Contact us for technical assistance, feature
                  requests, or custom integrations.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => navigate("/contact-us")}
                    className="bg-white cursor-pointer text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Contact Support
                  </button>
                  <button className="border cursor-pointer border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                    Schedule Demo
                  </button>
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
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
      </section>
    </>
  );
};

export default Documentation;
