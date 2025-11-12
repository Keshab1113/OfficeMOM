import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, Undo2, Redo2 } from "lucide-react";
import DownloadOptions from "../DownloadOptions/DownloadOptions";
import DataTable from "./Table";

const RealTablePreview = ({
  showFullData = [],
  detectLanguage = "en",
  onSaveTable,
}) => {
  const [tableData, setTableData] = useState(showFullData || []);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
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

  // Save current state to undo stack before making a change
  const pushToUndo = (prevData) => {
    setUndoStack((prev) => [...prev, prevData]);
    setRedoStack([]); // Clear redo stack on new change
  };

  const handleAddRow = () => {
    pushToUndo(tableData);
    const newRow = {};
    allColumns.forEach((col) => (newRow[col] = ""));
    setTableData([...tableData, newRow]);
  };

  const handleDeleteRow = (rowId) => {
    pushToUndo(tableData);
    setTableData((prevData) =>
      prevData.filter((_, index) => index + 1 !== rowId)
    );
  };

  const handleChange = (rowId, field, value) => {
    pushToUndo(tableData);
    const updatedData = tableData.map((row, idx) =>
      idx + 1 === rowId ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevData = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, tableData]);
    setTableData(prevData);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextData = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, tableData]);
    setTableData(nextData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (onSaveTable) {
      await onSaveTable(tableData, downloadOptions);
    }
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const confirmDownloadOptions = () => setIsModalOpen(true);

  return (
    <section className="my-10 md:my-4 rounded-2xl w-full overflow-hidden lg:max-w-[95vw] max-w-[95vw] pt-0">
      <div className="flex justify-between gap-4 mb-4  px-4">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50"
        >
          <Undo2 size={18} />
          Undo
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50"
        >
          <Redo2 size={18} />
          Redo
        </button>
      </div>

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
          {isSubmitting ? "Submitting..." : "Save & Export"}
        </button>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
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
