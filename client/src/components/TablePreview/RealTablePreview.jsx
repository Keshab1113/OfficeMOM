import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Plus, Trash2, Download } from "lucide-react";
import DownloadOptions from "../DownloadOptions/DownloadOptions";

const RealTablePreview = ({
  showFullData = [],
  detectLanguage = "en",
  onSaveTable,
}) => {
  const [tableData, setTableData] = useState(showFullData || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const textareaRef = useRef(null);
  const [translatedColumns, setTranslatedColumns] = useState([]);
  const [translatedAction, setTranslatedAction] = useState("Actions");
  const [translatedSerial, setTranslatedSerial] = useState("S. No");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });
  const [columnWidths, setColumnWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [isResizing, setIsResizing] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingCell]);

  useEffect(() => {
    if (showFullData && showFullData.length > 0) {
      setTableData(showFullData);
      const initialHeights = {};
      showFullData.forEach((_, index) => {
        initialHeights[index] = 64;
      });
      setRowHeights(initialHeights);
    }
  }, [showFullData]);

  const allColumns = useMemo(() => {
    return Array.from(
      new Set(tableData?.flatMap((row) => Object.keys(row)) || [])
    );
  }, [tableData]);

  useEffect(() => {
    const translateColumns = async () => {
      if (detectLanguage === "en") {
        setTranslatedColumns(allColumns);
        setTranslatedAction("Actions");
        setTranslatedSerial("S. No");
      } else {
        setTranslatedColumns(allColumns);
        setTranslatedAction("Actions");
        setTranslatedSerial("S. No");
      }
    };

    if (allColumns.length && detectLanguage) {
      translateColumns();
    }
  }, [allColumns, detectLanguage]);

  const handleMouseDown = useCallback(
    (e, type, index) => {
      // Disable resizing on mobile and tablet
      if (isMobile || isTablet) return;

      e.preventDefault();
      setIsResizing({ type, index, startX: e.clientX, startY: e.clientY });
    },
    [isMobile, isTablet]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing || isMobile || isTablet) return;

      const { type, index, startX, startY } = isResizing;

      if (type === "column") {
        const deltaX = (e.clientX - startX) * 0.02;

        setColumnWidths((prev) => {
          const newWidths = { ...prev };
          const current = prev[index] || 100 / allColumns.length;
          const updated = Math.max(10, current + deltaX);

          newWidths[index] = updated;

          return newWidths;
        });
      } else if (type === "row") {
        const deltaY = (e.clientY - startY) * 0.02;

        setRowHeights((prev) => ({
          ...prev,
          [index]: Math.max(48, (prev[index] || 64) + deltaY),
        }));
      }
    },
    [isResizing, allColumns, isMobile, isTablet]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing && !isMobile && !isTablet) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor =
        isResizing.type === "column" ? "col-resize" : "row-resize";
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, isMobile, isTablet]);

  const handleChange = (rowIndex, field, value) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][field] = value;
    setTableData(updatedData);
  };

  const handleAddRow = () => {
    const newRow = {};
    allColumns.forEach((col) => (newRow[col] = ""));
    setTableData([...tableData, newRow]);
    setRowHeights((prev) => ({
      ...prev,
      [tableData.length]: 64,
    }));
  };

  const handleDeleteRow = (rowIndex) => {
    const updatedData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(updatedData);
    setRowHeights((prev) => {
      const newHeights = { ...prev };
      delete newHeights[rowIndex];
      // Reindex the heights
      const reindexedHeights = {};
      Object.entries(newHeights).forEach(([key, value]) => {
        const numKey = parseInt(key);
        if (numKey > rowIndex) {
          reindexedHeights[numKey - 1] = value;
        } else if (numKey < rowIndex) {
          reindexedHeights[numKey] = value;
        }
      });
      return reindexedHeights;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (onSaveTable) {
      await onSaveTable(tableData, downloadOptions);
    }
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const startEditing = (rowIndex, columnName) => {
    setEditingCell([rowIndex, columnName]);
  };

  const finishEditing = () => {
    setEditingCell(null);
  };

  const confirmDownloadOptions = () => {
    setIsModalOpen(true);
  };

  const getColumnWidth = (index) =>
    columnWidths[index] || 82 / allColumns.length;
  const getRowHeight = (index) => rowHeights[index] || 64;

  return (
    <section className="my-10 md:my-4 bg-amber-50 dark:bg-gray-800 rounded-2xl w-full overflow-hidden lg:max-w-[70vw] max-w-[95vw]">
      <div className="block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800 w-full max-w-screen">
        <div className="overflow-auto max-h-[71vh] md:hide-scrollbar">
          {/* Mobile/Tablet horizontal scrolling container */}
          <div className={isMobile || isTablet ? "" : ""}>
            <table className="w-full border-collapse table-fixed min-w-[600px] md:min-w-full">
              <thead>
                <tr className="bg-gradient-to-r sticky top-0 z-20 from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-600">
                  <th
                    className="z-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r-2 border-gray-200 dark:border-gray-600 px-3 sm:px-6 py-4 sm:py-8 text-left font-bold text-gray-800 dark:text-gray-100 shadow-xl backdrop-blur-sm text-sm md:text-base relative"
                    style={{ width: "110px" }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span>{translatedSerial}</span>
                    </div>
                  </th>
                  {(translatedColumns.length > 0
                    ? translatedColumns
                    : allColumns
                  ).map((col, index) => (
                    <th
                      key={col}
                      className="border-r border-gray-200 dark:border-gray-600 px-3 sm:px-8 py-4 sm:py-8 text-left font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap text-sm sm:text-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 relative group"
                      style={{ width: (isMobile || isTablet) ? "250px" : `${getColumnWidth(index)}%` }}

                    >
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"></div>
                        <span className="text-xs sm:text-base overflow-hidden text-ellipsis">
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                        </span>
                      </div>
                      {!(isMobile || isTablet) && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-400 hover:bg-blue-600 transition-all duration-200"
                          onMouseDown={(e) =>
                            handleMouseDown(e, "column", index)
                          }
                          title="Drag to resize column"
                        />
                      )}
                    </th>
                  ))}
                  <th
                    className="px-3 sm:px-8 py-4 sm:py-8 text-center font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-lg"
                    style={{ width: "100px" }}
                  >
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-r from-red-400 to-pink-500 rounded-full"></div>
                      <span className="text-xs sm:text-base">
                        {translatedAction}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tableData?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:via-indigo-50/20 hover:to-purple-50/30 dark:hover:from-gray-700/30 dark:hover:via-gray-600/20 dark:hover:to-gray-700/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900/20 relative"
                    style={{ height: `${getRowHeight(rowIndex)}px` }}
                  >
                    <td
                      className="px-3 sm:px-8 py-3 sm:py-6 text-center border-r border-gray-100 dark:border-gray-700"
                      style={{ width: "100px" }}
                    >
                      <div className="flex justify-center">
                        <div className="w-8 h-8 my-auto sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          {rowIndex + 1}
                        </div>
                      </div>
                    </td>
                    {allColumns.map((col, colIndex) => {
                      const isEditing =
                        editingCell &&
                        editingCell[0] === rowIndex &&
                        editingCell[1] === col;

                      return (
                        <td
                          key={col}
                          className={`border-x border-gray-100 dark:border-gray-700 transition-all duration-300 relative overflow-hidden group/cell ${
                            isEditing
                              ? ""
                              : "cursor-pointer px-3 sm:px-8 py-3 sm:py-6 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-700/30"
                          }`}
                          style={{ width: (isMobile || isTablet) ? "250px" : `${getColumnWidth(colIndex)}%` }}

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
                              <div className="absolute inset-0 border-2 border-transparent group-hover/cell:border-blue-200 dark:group-hover/cell:border-blue-600/50 rounded-lg transition-all duration-200 pointer-events-none opacity-0 group-hover/cell:opacity-100"></div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover/cell:opacity-100 transition-all duration-200">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 dark:blue-600 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                                  ✎
                                </div>
                              </div>
                            </>
                          )}
                          {/* Add column resize handle to body cells - only on desktop */}
                          {!(isMobile || isTablet) && (
                            <>
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover/cell:opacity-100 bg-blue-400 hover:bg-blue-600 transition-all duration-200"
                                onMouseDown={(e) =>
                                  handleMouseDown(e, "column", colIndex)
                                }
                                title="Drag to resize column"
                              />
                              <div
                                className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize opacity-0 group-hover/cell:opacity-100 bg-green-400 hover:bg-green-600 transition-all duration-200"
                                onMouseDown={(e) =>
                                  handleMouseDown(e, "row", rowIndex)
                                }
                                title="Drag to resize row"
                              />
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td
                      className="px-3 sm:px-8 py-3 sm:py-6 text-center border-r border-gray-100 dark:border-gray-700"
                      style={{ width: "120px" }}
                    >
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="group/btn cursor-pointer inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 text-red-500 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 border border-red-200 dark:border-red-700 hover:border-red-500 dark:hover:border-red-600"
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

        <div className="px-4 lg:px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="text-center sm:text-left">
              <span className="hidden sm:inline">
                Click any cell to edit • Press Ctrl+Enter to save • Press Escape
                to cancel •{" "}
                {!(isMobile || isTablet) && "Hover borders to resize"}
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
