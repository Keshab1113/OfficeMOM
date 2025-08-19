// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useState } from "react";
import { FaFileWord, FaFileExcel } from "react-icons/fa";
import { Download } from "lucide-react";

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
    <div className="p-4 dark:bg-gray-900 bg-white shadow-lg w-full h-fit rounded-md mb-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
        <Download className="text-indigo-500 w-6 h-6" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 ">
          Download Options
        </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          A copy will be sent to your registered email automatically. You’ll also have the option to download it in your preferred format.
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-4">
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
          <span className="text-gray-800 dark:text-white">Word Document</span>
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
          <span className="text-gray-800 dark:text-white">Excel Spreadsheet</span>
        </motion.label>
      </div>
    </div>
  );
};

export default DownloadOptions;
