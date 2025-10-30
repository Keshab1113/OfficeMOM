import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import DownloadOptions from "../DownloadOptions/DownloadOptions";
import { translateText } from "../../lib/translateText";
import DataTable from "./Table";

const RealTablePreview = ({
  showFullData = [],
  detectLanguage = "en",
  onSaveTable,
}) => {
  const [tableData, setTableData] = useState(showFullData || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [translatedColumns, setTranslatedColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });

  useEffect(() => {
    setTableData(showFullData || []);
  }, [showFullData]);

  const allColumns = useMemo(() => {
    return Array.from(
      new Set(tableData?.flatMap((row) => Object.keys(row)) || [])
    );
  }, [tableData]);

  // useEffect(() => {
  //   const translateColumns = async () => {
  //     if (detectLanguage === "en") {
  //       setTranslatedColumns(allColumns);
  //     } else {
  //       const allColLang = await translateText(detectLanguage, allColumns);
  //       setTranslatedColumns(allColLang);
  //     }
  //   };

  //   if (allColumns.length && detectLanguage) {
  //     translateColumns();
  //   }
  // }, [allColumns, detectLanguage]);

  const handleAddRow = () => {
    const newRow = {};
    allColumns.forEach((col) => (newRow[col] = ""));
    setTableData([...tableData, newRow]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (onSaveTable) {
      await onSaveTable(tableData, downloadOptions);
    }
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const confirmDownloadOptions = () => {
    setIsModalOpen(true);
  };

  const handleDeleteRow = (rowId) => {
    setTableData((prevData) =>
      prevData.filter((_, index) => index + 1 !== rowId)
    );
  };
  const handleChange = (rowId, field, value) => {
    const updatedData = tableData.map((row, idx) =>
      idx + 1 === rowId ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  return (
    <section className="my-10 md:my-4  rounded-2xl w-full overflow-hidden lg:max-w-[95vw] max-w-[95vw] pt-16">
      <DataTable
        translatedColumns={translatedColumns || allColumns}
        header={allColumns}
        data={tableData}
        onDeleteRow={handleDeleteRow}
        onEditRow={handleChange}
      />
      <div className="py-6 flex flex-col sm:flex-row justify-center gap-4 w-fit mx-auto">
        <button
          onClick={handleAddRow}
          disabled={isSubmitting}
          className="group cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform active:scale-95"
        >
          <Plus
            size={20}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
          Add New Row
        </button>

        <button
          onClick={confirmDownloadOptions}
          disabled={isSubmitting}
          className={`group cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform active:scale-95 ${
            isSubmitting ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          <Download
            size={20}
            className={`${
              isSubmitting ? "animate-spin" : "group-hover:scale-110"
            } transition-transform duration-300`}
          />
          {isSubmitting ? "Submitting..." : "Submit & Export"}
        </button>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <DownloadOptions onChange={setDownloadOptions} />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 cursor-pointer rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 cursor-pointer rounded-md bg-indigo-600 text-white"
              >
                Save & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RealTablePreview;
