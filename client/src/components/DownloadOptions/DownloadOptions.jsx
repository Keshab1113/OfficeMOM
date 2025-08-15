// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useState } from "react";
import { FaFileWord, FaFileExcel } from "react-icons/fa";

const DownloadOptions = ({ onChange }) => {
  const [wordChecked, setWordChecked] = useState(false);
  const [excelChecked, setExcelChecked] = useState(false);

  const handleWordChange = () => {
    const newValue = !wordChecked;
    setWordChecked(newValue);
    onChange?.({ word: newValue, excel: excelChecked });
  };

  const handleExcelChange = () => {
    const newValue = !excelChecked;
    setExcelChecked(newValue);
    onChange?.({ word: wordChecked, excel: newValue });
  };

  return (
    <div className="p-4 w-full h-fit rounded-md border border-solid dark:border-white/20 border-gray-300 mt-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Download Options
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You'll automatically receive a copy in your Gmail. You can also download in your preferred format:
        </p>
      </div>

      <div className="flex gap-6 mt-2">
        {/* Word File Option */}
        <motion.label whileTap={{ scale: 0.95 }} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="hidden" checked={wordChecked} onChange={handleWordChange} />
          <motion.div
            animate={{
              scale: wordChecked ? 1.1 : 1,
              backgroundColor: wordChecked ? "#2563eb" : "#ffffff",
              borderColor: wordChecked ? "#2563eb" : "#d1d5db",
            }}
            className="w-5 h-5 border rounded-md flex items-center justify-center"
          >
            {wordChecked && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-2 h-2 bg-white rounded-sm"
              />
            )}
          </motion.div>
          <FaFileWord className="text-blue-600 text-xl" />
          <span className="text-gray-800 dark:text-white">Word File</span>
        </motion.label>

        {/* Excel File Option */}
        <motion.label whileTap={{ scale: 0.95 }} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="hidden" checked={excelChecked} onChange={handleExcelChange} />
          <motion.div
            animate={{
              scale: excelChecked ? 1.1 : 1,
              backgroundColor: excelChecked ? "#22c55e" : "#ffffff",
              borderColor: excelChecked ? "#22c55e" : "#d1d5db",
            }}
            className="w-5 h-5 border rounded-md flex items-center justify-center"
          >
            {excelChecked && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-2 h-2 bg-white rounded-sm"
              />
            )}
          </motion.div>
          <FaFileExcel className="text-green-600 text-xl" />
          <span className="text-gray-800 dark:text-white">Excel File</span>
        </motion.label>
      </div>
    </div>
  );
};

export default DownloadOptions;
