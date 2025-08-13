import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const HeaderModal = ({ onSave, onClose }) => {
  const [headers, setHeaders] = useState(["Description"]);

  const addHeader = () => {
    if (headers[headers.length - 1].trim() !== "") {
      setHeaders([...headers, ""]);
    }
  };

  const updateHeader = (value, index) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const deleteHeader = (index) => {
    if (headers.length > 1) {
      const newHeaders = headers.filter((_, i) => i !== index);
      setHeaders(newHeaders);
    }
  };

  const handleSave = () => {
    const finalHeaders = headers.filter((h) => h.trim() !== "");
    onSave(finalHeaders);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Define Table Headers</h2>

        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {headers.map((h, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={h}
                  onChange={(e) => updateHeader(e.target.value, idx)}
                  placeholder={`Header ${idx + 1}`}
                  className="flex-1 p-2 border rounded outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <button
                  onClick={() => deleteHeader(idx)}
                  disabled={headers.length === 1}
                  className={`p-2 rounded cursor-pointer transition ${
                    headers.length === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-500 hover:bg-red-100"
                  }`}
                >
                  <FiTrash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div
          onClick={addHeader}
          className={`flex items-center justify-end gap-1 text-blue-600 cursor-pointer hover:underline mb-4 ${
            headers[headers.length - 1].trim() === "" ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <FiPlus /> Need more column
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded cursor-pointer hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HeaderModal;
