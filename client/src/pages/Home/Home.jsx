import Footer from "../../components/Footer/Footer";
import { Helmet } from "react-helmet";
import FAQ from "../../components/FAQ/FAQ";
import CTASection from "../../components/CTASection/CTASection";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Home</title>
        <link rel="canonical" href="https://officemom.me/" />
      </Helmet>
      <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden 2xl:py-10 py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
            </div>
            <div className="absolute inset-0 opacity-10 dark:opacity-5">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
            </div>
          </div>
          <div className="relative z-10 ">
            <div className="text-center space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    OfficeMoM
                  </span>
                </h1>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium max-w-3xl mx-auto leading-relaxed">
                    Automate Meeting Minutes Seamlessly with AI
                  </p>
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                  Automate meeting minutes seamlessly with AI-powered
                  transcription and smart formatting. Capture every detail
                  without lifting a pen, from key points to action items. Get
                  organized summaries instantly, ready to share with your team.
                  Save time, improve accuracy, and keep every meeting
                  productive.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={()=>navigate("/meeting")}
                    className="flex items-center cursor-pointer gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Play className="w-5 h-5" />
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={()=>navigate("/contact-us")}
                    className="flex items-center cursor-pointer gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    Watch Demo
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
          <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
          <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
        </section>
        {/* <CTASection /> */}
        <FAQ />
        <Footer />
      </div>
    </>
  );
};

export default Home;
