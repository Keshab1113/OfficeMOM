// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FileText, History } from "lucide-react";

const Trancript = () => {
    const show = true;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-[22vh] w-full bg-white dark:bg-gray-900
                 rounded-2xl shadow-lg p-4 py-4 flex flex-col justify-center items-start hover:shadow-xl 
                 transition-shadow duration-300"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <FileText className="text-purple-600 dark:text-purple-400 w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Meeting Audio Transcript
        </h2>
      </div>
      <div className={` overflow-hidden overflow-y-auto w-full ${show? "max-h-[80%]":"max-h-full"}`}>
        {show ? (
          <p className="text-gray-700 dark:text-gray-800 text-sm leading-relaxed ">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Natus
            repellat voluptatibus dolorem accusantium rerum architecto ut,
            molestias facere? Aut, quam vitae sunt porro reiciendis atque
            sapiente impedit incidunt accusamus molestiae. voluptatibus dolorem
            accusantium rerum architecto ut, molestias facere? Aut, quam vitae
            sunt porro reiciendis atque sapiente impedit incidunt accusamus
            molestiae.
          </p>
        ) : (
          <div className="flex-1 flex w-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <History className="w-12 h-12 mb-2 opacity-50" />
            <p className="font-medium">No transcript found</p>
            <p className="text-sm">After meeting end, transcript will appear here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Trancript;
