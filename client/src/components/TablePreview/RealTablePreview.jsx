import React, { useEffect, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";

const RealTablePreview = ({ showFullData, onSaveTable }) => {
  const [tableData, setTableData] = useState(showFullData || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

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
    <section className="p-0 mb-10 md:mt-10 bg-amber-50 dark:bg-gray-800 rounded-2xl w-full overflow-hidden lg:max-w-[70vw] max-w-[90vw] mx-auto">
      <div className="block lg:hidden overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-500">
                <th className="sticky left-0 z-10 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-500 border-r-2 border-gray-300 dark:border-slate-600 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 shadow-sm">
                  S. No
                </th>
                {allColumns.map((col) => (
                  <th
                    key={col}
                    className={`border-r border-gray-300 dark:border-slate-600 px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap`}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                  </th>
                ))}
                <th className="px-4 py-4 text-center font-semibold text-gray-700 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData?.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50/50 transition-all duration-200 dark:text-gray-200"
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-700 border-b border-r-2 border-gray-300 dark:border-slate-600 px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-200 shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-gray-800 dark:to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {rowIndex + 1}
                    </div>
                  </td>
                  {allColumns.map((col) => {
                    const avgCharsPerLine = 40;
                    const contentLength = row[col]?.length || 0;
                    const rowsCount = Math.max(
                      1,
                      Math.ceil(contentLength / avgCharsPerLine)
                    );
                    return (
                      <td
                        key={col}
                        className="border-r border-b border-gray-200 dark:border-slate-600 px-4 py-3 break-words max-w-[200px]"
                        onClick={() => startEditing(rowIndex, col)}
                      >
                        {editingCell &&
                        editingCell[0] === rowIndex &&
                        editingCell[1] === col ? (
                          <textarea
                            value={row[col] || ""}
                            onChange={(e) =>
                              handleChange(rowIndex, col, e.target.value)
                            }
                            onBlur={finishEditing}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-0 outline-0 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700"
                            autoFocus
                            rows={rowsCount}
                          />
                        ) : (
                          <div className="min-h-[2rem] py-1 overflow-hidden break-words whitespace-pre-wrap">
                            {row[col] || "-"}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center border-r border-b border-gray-300 dark:border-slate-600">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hidden lg:block overflow-hidden overflow-x-scroll">
        <div className={`${allColumns.length > 5 ? "overflow-x-auto" : ""}`}>
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-xl font-semibold">
                  <th className="sticky left-0 z-20 bg-gradient-to-r from-gray-100 to-gray-200 border-r-2 border-gray-300 dark:border-slate-600 dark:from-gray-800 dark:to-gray-700 px-4 py-6 text-left font-semibold text-gray-700 dark:text-gray-200 shadow-lg">
                    S. No
                  </th>
                  {allColumns.map((col) => (
                    <th
                      key={col}
                      className={`border-r border-gray-300 dark:border-slate-600 px-6 py-6 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap`}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </th>
                  ))}
                  <th className="px-6 py-6 text-center font-semibold text-gray-700 dark:text-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-blue-50/50 dark:text-gray-200 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-slate-600 transition-all duration-200"
                  >
                    <td className="sticky left-0 z-20 bg-white dark:bg-gray-700 border-r-2 border-gray-300 dark:border-slate-600 px-4 py-4 text-center shadow-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-gray-800 dark:to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                        {rowIndex + 1}
                      </div>
                    </td>
                    {allColumns.map((col) => {
                      const avgCharsPerLine = 40;
                      const contentLength = row[col]?.length || 0;
                      const rowsCount = Math.max(
                        1,
                        Math.ceil(contentLength / avgCharsPerLine)
                      );
                      return (
                        <td
                          key={col}
                          className="border-r border-gray-200 dark:border-slate-600 px-6 py-4 break-words max-w-[300px]"
                          onClick={() => startEditing(rowIndex, col)}
                        >
                          {editingCell &&
                          editingCell[0] === rowIndex &&
                          editingCell[1] === col ? (
                            <textarea
                              value={row[col] || ""}
                              onChange={(e) =>
                                handleChange(rowIndex, col, e.target.value)
                              }
                              onBlur={finishEditing}
                              className="w-full h-fit p-3 border border-gray-300 rounded-lg focus:ring-0 outline-0 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-600"
                              autoFocus
                              rows={rowsCount}
                            />
                          ) : (
                            <div className="min-h-[2.5rem] py-1 overflow-hidden break-words whitespace-pre-wrap">
                              {row[col] || "-"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center border-r border-gray-300 dark:border-slate-600">
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="inline-flex items-center justify-center w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="md:py-15 py-6 flex flex-col sm:flex-row justify-center gap-4   w-fit mx-auto ">
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
