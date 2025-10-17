import Footer from "../../components/Footer/Footer";
import { Helmet } from "react-helmet";
import CTASection from "../../components/CTASection/CTASection";
import { CheckCircle, FileAudio, Clock, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import { cn } from "../../lib/utils";

const breadcrumbItems = [{ label: "Features" }];

const features = [
  {
    icon: <FileAudio className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    title: "AI-Powered Transcription",
    description:
      "Convert meeting audio into accurate transcripts in seconds with our AI engine.",
  },
  {
    icon: <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />,
    title: "Time-Saving Summaries",
    description:
      "Get concise meeting summaries and MoMs without reading lengthy notes.",
  },
  {
    icon: <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    title: "Collaboration",
    description:
      "Share transcripts and meeting minutes with your team instantly.",
  },
  {
    icon: <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />,
    title: "Data Security",
    description:
      "Your meeting data is encrypted and stored securely on trusted servers.",
  },
  {
    icon: (
      <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
    ),
    title: "Task Tracking",
    description:
      "Automatically extract action items and assign tasks to team members.",
  },
];

const DemoVideo = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | Features</title>
        <link rel="canonical" href="https://officemom.me/features" />
      </Helmet>
      <section className="relative h-full min-h-screen md:w-full w-screen dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)] pt-20">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-6xl mx-auto md:py-20 py-10 px-4"
          >
            <Breadcrumb items={breadcrumbItems} />
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 text-center mb-12"
            >
              Powerful Features to Simplify Your Meetings
            </motion.h1>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-col items-start hover:shadow-xl transition-all duration-300"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <CTASection />
          <Footer />
        </div>
      </section>
    </>
  );
};
export default DemoVideo;
