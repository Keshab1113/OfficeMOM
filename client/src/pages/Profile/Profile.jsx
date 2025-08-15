// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import ProfilImageUploader from "../../components/ProfileImageUploader/ProfileImageUploader";
import Footer from "../../components/Footer/Footer";
import History from "../../components/History/History";

const Profile = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const backgroundVariants = {
    animate: {
      backgroundPosition: ["0% 0%", "100% 100%"],
      transition: {
        duration: 20,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  };

  return (
    <section className=" max-h-screen overflow-hidden overflow-y-scroll">
      <motion.div
        className="relative flex flex-col h-full min-h-screen w-full
      dark:bg-[linear-gradient(135deg,#06080D_0%,#0D121C_50%,#1a1f2e_100%)] 
      bg-[linear-gradient(135deg,white_0%,#e6f2ff_30%,#d3e4f0_70%,#b8d4ea_100%)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated background pattern */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-30",
            "[background-size:40px_40px]",
            "dark:[background-image:radial-gradient(circle,#404040_2px,transparent_2px)]",
            "[background-image:radial-gradient(circle,#94a3b8_1px,transparent_1px)]"
          )}
          animate={{
            backgroundPosition: ["0px 0px", "40px 40px"],
          }}
          transition={{
            duration: 10,
            ease: "linear",
            repeat: Infinity,
          }}
        />

        {/* Gradient overlay with animation */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center 
        dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] 
        dark:bg-[linear-gradient(135deg,#06080D_0%,#0D121C_100%)]
        [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]
        bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(211,228,240,0.3)_100%)]"
          variants={backgroundVariants}
          animate="animate"
        />

        {/* Floating particles */}
        <div className="absolute inset-0  pointer-events-none max-h-screen">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 dark:bg-blue-300/20 rounded-full"
              animate={{
                y: [-100, window.innerHeight + 100],
                x: [
                  Math.random() * window.innerWidth,
                  Math.random() * window.innerWidth,
                ],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear",
              }}
              style={{
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <motion.div
          className="relative z-20 w-full h-full flex flex-row"
          variants={itemVariants}
        >
          {/* Custom scrollbar container */}
          <div className="w-full min-h-screen  relative">
            <div
              className="w-full h-full pr-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#3b82f6 transparent",
              }}
            >
              <div className="w-full h-full min-h-screen">
                <div className="backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl shadow-blue-500/10 mx-4 my-8 min-h-screen">
                  {/* Profile section */}
                  <motion.div className="pt-8 pb-4" variants={itemVariants}>
                    <ProfilImageUploader />
                  </motion.div>

                  {/* History section */}
                  <motion.div
                    className="md:min-h-[60vh] w-full md:px-20 p-6 py-12"
                    variants={itemVariants}
                  >
                    <motion.div
                      className="backdrop-blur-sm bg-white/5 dark:bg-black/10 rounded-2xl border border-white/10 p-6"
                      whileHover={{
                        scale: 1.01,
                        boxShadow: "0 20px 40px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <History />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer - Full screen outside container */}
        <motion.div className="relative z-30 w-full" variants={itemVariants}>
          <Footer />
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </motion.div>
    </section>
  );
};

export default Profile;
