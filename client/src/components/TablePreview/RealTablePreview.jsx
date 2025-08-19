import React, { useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";

const RealTablePreview = ({ showFullData, onSaveTable }) => {
  const [tableData, setTableData] = useState(showFullData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allColumns = Array.from(
    new Set(tableData.flatMap((row) => Object.keys(row)))
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

  return (
    <section className="p-4 bg-amber-50 dark:bg-gray-900 w-full overflow-x-auto lg:max-w-[70vw] max-w-[90vw]">
      <div className="block lg:hidden overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                <th className="sticky left-0 z-10 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-r-2 border-gray-300 dark:border-gray-600 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 shadow-sm">
                  S. No
                </th>
                {allColumns.map((col, index) => (
                  <th
                    key={col}
                    className={`border-r border-gray-300 dark:border-gray-600 px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap animate-slide-in-${index % 3}`}
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
              {tableData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-all duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${rowIndex * 50}ms` }}
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 border-r-2 border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {rowIndex + 1}
                    </div>
                  </td>
                  {allColumns.map((col) => (
                    <td key={col} className="border-r border-gray-200 dark:border-gray-600 px-4 py-3">
                      <input
                        type="text"
                        value={row[col] || ""}
                        onChange={(e) => handleChange(rowIndex, col, e.target.value)}
                        className="w-full min-w-[120px] p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
                        placeholder={`Enter ${col}`}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all duration-200 hover:scale-110"
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

      <div className="hidden lg:block">
        <div className={`${allColumns.length > 5 ? "overflow-x-auto" : ""}`}>
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <th className="sticky left-0 z-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-r-2 border-gray-300 dark:border-gray-600 px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 shadow-lg">
                    S. No
                  </th>
                  {allColumns.map((col, index) => (
                    <th
                      key={col}
                      className={`border-r border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap animate-slide-in-${index % 3}`}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-blue-50/50 border-b dark:border-gray-400 border-gray-200 dark:hover:bg-gray-800/50 transition-all duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${rowIndex * 50}ms` }}
                  >
                    <td className="sticky left-0 z-20 bg-white dark:bg-gray-900 border-r-2 border-gray-300 dark:border-gray-600 px-4 py-4 text-center shadow-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {rowIndex + 1}
                      </div>
                    </td>
                    {allColumns.map((col) => (
                      <td key={col} className="border-r border-gray-200 dark:border-gray-600 px-6 py-4">
                        <input
                          type="text"
                          value={row[col] || ""}
                          onChange={(e) => handleChange(rowIndex, col, e.target.value)}
                          className="w-full min-w-[180px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 hover:shadow-sm dark:bg-gray-700 dark:text-gray-100"
                          placeholder={`Enter ${col}`}
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="inline-flex items-center justify-center w-10 h-10 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all duration-200 hover:scale-110"
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

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
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
