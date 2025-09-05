import Footer from "../../components/Footer/Footer";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `Welcome to OfficeMoM! This documentation will guide you through setup and usage. 
    Start by creating an account, uploading meeting audio, and generating transcripts.`,
  },
  {
    id: "upload-audio",
    title: "Uploading Audio",
    content: `To upload audio, navigate to the Upload page and select your file. 
    Supported formats: MP3, WAV, and M4A. The system will securely store your audio and generate transcripts.`,
  },
  {
    id: "generate-mom",
    title: "Generating MoM",
    content: `After uploading audio, click "Generate MoM". Our AI will analyze the transcript, 
    extract action items, and create professional meeting minutes for you.`,
  },
  {
    id: "api",
    title: "API Integration",
    content: `Developers can integrate OfficeMoM via our REST API. 
    Use your API key from the dashboard to upload files, fetch transcripts, and manage meeting data programmatically.`,
  },
  {
    id: "faq",
    title: "FAQ",
    content: `Find answers to common questions about data privacy, supported formats, 
    transcription accuracy, and more.`,
  },
];

const Documentation = () => {

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Documentation</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative flex h-full min-h-screen md:w-full w-screen items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]"></div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
            <div className="relative z-20 w-full px-6 py-16 max-w-5xl mx-auto">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  OfficeMoM Documentation
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Learn how to set up, use, and integrate OfficeMoM to make your
                  meetings smarter and more productive.
                </p>
              </motion.div>

              {/* Documentation Sections */}
              <div className="space-y-12">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-8"
                  >
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {section.title}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
};
export default Documentation;
