import React, { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";

const RealTablePreview = ({ showFullData, onSaveTable }) => {
  const [tableData, setTableData] = useState(showFullData || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingCell]);

  useEffect(() => {
    if (showFullData && showFullData.length > 0) {
      setTableData(showFullData);
    }
  }, [showFullData]);

  const allColumns = Array.from(
    new Set(tableData?.flatMap((row) => Object.keys(row)))
  );

  const handleChange = (rowIndex, field, value) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][field] = value;
    setTableData(updatedData);
  };

  const handleAddRow = () => {
    const newRow = {};
    allColumns.forEach((col) => (newRow[col] = ""));
    setTableData([...tableData, newRow]);
  };

  const handleDeleteRow = (rowIndex) => {
    const updatedData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(updatedData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (onSaveTable) {
      await onSaveTable(tableData);
    }
    setIsSubmitting(false);
  };

  const startEditing = (rowIndex, columnName) => {
    setEditingCell([rowIndex, columnName]);
  };

  const finishEditing = () => {
    setEditingCell(null);
  };

  return (
    <section className="p-0 mb-6 mt-10 md:mt-6 bg-amber-50 dark:bg-gray-800 rounded-2xl w-full overflow-hidden lg:max-w-[70vw] max-w-[90vw] mx-auto">
      <div className="block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800">
        {/* Horizontally Scrollable Table for All Screen Sizes */}
        <div className="overflow-x-auto overflow-y-auto max-h-[71vh] hidescrollbar">
          <div className="min-w-max">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gradient-to-r sticky top-0 z-20 from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-600">
                  <th className=" z-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r-2 border-gray-200 dark:border-gray-600 px-3 sm:px-6 py-4 sm:py-8 text-left font-bold text-gray-800 dark:text-gray-100 shadow-xl backdrop-blur-sm text-sm sm:text-lg min-w-[80px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span>S. No</span>
                    </div>
                  </th>
                  {allColumns.map((col) => (
                    <th
                      key={col}
                      className="border-r border-gray-200 dark:border-gray-600 px-3 sm:px-8 py-4 sm:py-8 text-left font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap text-sm sm:text-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 min-w-[120px] sm:min-w-[150px]"
                    >
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"></div>
                        <span className="text-xs sm:text-base">
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 sm:px-8 py-4 sm:py-8 text-center font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-lg min-w-[100px]">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-r from-red-400 to-pink-500 rounded-full"></div>
                      <span className="text-xs sm:text-base">Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tableData?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:via-indigo-50/20 hover:to-purple-50/30 dark:hover:from-gray-700/30 dark:hover:via-gray-600/20 dark:hover:to-gray-700/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900/20"
                  >
                    <td className=" px-3 sm:px-8 py-3 sm:py-6 text-center border-r border-gray-100 dark:border-gray-700 ">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 my-auto sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg  group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ">
                          {rowIndex + 1}
                        </div>
                      </div>
                    </td>
                    {allColumns.map((col) => {
                      const isEditing =
                        editingCell &&
                        editingCell[0] === rowIndex &&
                        editingCell[1] === col;

                      return (
                        <td
                          key={col}
                          className={`border-x border-gray-100 dark:border-gray-700 max-w-[200px] sm:max-w-[300px] transition-all duration-300 relative ${
                            isEditing
                              ? ""
                              : "cursor-pointer px-3 sm:px-8 py-3 sm:py-6 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-700/30"
                          }`}
                          onClick={
                            !isEditing
                              ? () => startEditing(rowIndex, col)
                              : undefined
                          }
                        >
                          {isEditing ? (
                            <textarea
                              ref={textareaRef}
                              value={row[col] || ""}
                              onChange={(e) => {
                                handleChange(rowIndex, col, e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              onBlur={finishEditing}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") finishEditing();
                                if (e.key === "Enter" && e.ctrlKey)
                                  finishEditing();
                              }}
                              className="w-full h-auto px-3 sm:px-8 py-3 sm:py-6 border-0 focus:ring-0 outline-none bg-transparent text-gray-900 dark:text-gray-100 resize-none font-medium overflow-hidden text-sm sm:text-base"
                              autoFocus
                              style={{ minHeight: "2rem", height: "auto" }}
                              placeholder="Enter text here..."
                            />
                          ) : (
                            <>
                              <div className="min-h-[2rem] sm:min-h-[3rem] py-1 sm:py-2 px-1 overflow-hidden break-words whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-medium leading-relaxed hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 text-sm sm:text-base">
                                {row[col] || (
                                  <span className="text-gray-400 dark:text-gray-500 italic font-normal">
                                    Click to edit
                                  </span>
                                )}
                              </div>
                              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-600/50 rounded-lg transition-all duration-200 pointer-events-none opacity-0 group-hover:opacity-100"></div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                                  ✎
                                </div>
                              </div>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 sm:px-8 py-3 sm:py-6 text-center border-r border-gray-100 dark:border-gray-700">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="group/btn inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 text-red-500 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 border border-red-200 dark:border-red-700 hover:border-red-500 dark:hover:border-red-600"
                          title="Delete row"
                        >
                          <Trash2
                            size={18}
                            className="group-hover/btn:animate-pulse"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with responsive text */}
        <div className="px-4 lg:px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="text-center sm:text-left">
              <span className="hidden sm:inline">
                Click any cell to edit • Press Ctrl+Enter to save • Press Escape
                to cancel
              </span>
              <span className="sm:hidden">
                Tap to edit • Ctrl+Enter to save • Escape to cancel
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Interactive Mode</span>
            </div>
          </div>
        </div>
      </div>
      <div className="py-6 flex flex-col sm:flex-row justify-center gap-4 w-fit mx-auto ">
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
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`group cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform active:scale-95 ${
            isSubmitting ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          <Download
            size={20}
            className={` ${
              isSubmitting ? "animate-spin" : "group-hover:scale-110"
            } transition-transform duration-300`}
          />
          {isSubmitting ? "Submitting..." : "Submit & Export"}
        </button>
      </div>
    </section>
  );
};

export default RealTablePreview;
