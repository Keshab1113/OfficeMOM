import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  X,
  GripVertical,
  MoreVertical,
  Save,
  ArrowLeft,
  ArrowRight,
  Copy,
  Loader2,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { setTableData } from "../../redux/meetingSlice";
// import { useToast } from "../ToastContext";

const TablePreview = ({ onSaveHeaders, isSending }) => {
  const [columns, setColumns] = useState([
    { id: 1, heading: "Discussion Summary" },
    { id: 2, heading: "Action Items" },
    { id: 3, heading: "Responsibility" },
    { id: 4, heading: "Target Date" },
    { id: 5, heading: "Status" },

  ]);

  // eslint-disable-next-line no-unused-vars
  const [rows, setRows] = useState(6);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingHeading, setEditingHeading] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const dropdownRef = useRef(null);

  // const { addToast } = useToast();
  const dispatch = useDispatch();

  const addNewColumn = () => {
    const newColumn = {
      id: Date.now(),
      heading: "New Column",
    };
    setColumns([...columns, newColumn]);
  };

  const deleteColumn = (id) => {
    if (columns.length > 2) {
      setColumns(columns.filter((col) => col.id !== id));
    }
    setMenuOpen(null);
  };

  const updateHeading = (id, newHeading) => {
    setColumns(
      columns.map((col) =>
        col.id === id ? { ...col, heading: newHeading } : col
      )
    );
    setEditingHeading(null);
  };

  const shiftLeft = (index) => {
    if (index > 0) {
      const newCols = [...columns];
      const temp = newCols[index];
      newCols[index] = newCols[index - 1];
      newCols[index - 1] = temp;
      setColumns(newCols);
    }
    setMenuOpen(null);
  };

  const shiftRight = (index) => {
    if (index < columns.length - 1) {
      const newCols = [...columns];
      const temp = newCols[index];
      newCols[index] = newCols[index + 1];
      newCols[index + 1] = temp;
      setColumns(newCols);
    }
    setMenuOpen(null);
  };

  const copyColumn = (col, index) => {
    const newColumn = { id: Date.now(), heading: col.heading };
    const newCols = [...columns];
    newCols.splice(index + 1, 0, newColumn);
    setColumns(newCols);
    setMenuOpen(null);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newColumns = [...columns];
      const draggedColumn = newColumns[draggedIndex];
      newColumns.splice(draggedIndex, 1);
      const adjustedDropIndex =
        draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newColumns.splice(adjustedDropIndex, 0, draggedColumn);
      setColumns(newColumns);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveTable = async () => {
    const headersArray = [...columns.map((col) => col.heading)];
    const tableData = {
      headers: headersArray,
      columns: columns.length + 1,
    };

    dispatch(setTableData(tableData));

    if (onSaveHeaders) {
      onSaveHeaders(headersArray);
    }
    // addToast("success", "Header updated successfully");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="my-10 w-full max-w-full animate-fade-in h-fit ">
      <div className="dark:bg-gray-900 bg-white w-full h-full min-h-[40vh] p-4 md:p-6 py-16 rounded-xl  shadow-2xl hover:shadow-3xl transform  transition-all duration-500 ease-out backdrop-blur-sm">
        <div className="flex justify-center items-center gap-4 mb-8 animate-bounce-slow">
          <h1 className=" dark:text-white text-xl font-medium">Add Columns</h1>
          <button
            onClick={addNewColumn}
            disabled={isSending}
            className="group disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 cursor-pointer rounded-full p-2 shadow-lg hover:shadow-xl transform hover:scale-125 transition-all duration-300 animate-pulse-slow relative overflow-hidden"
            title="Add Column">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Plus className="w-6 h-6 text-white group-hover:rotate-180 transition-all duration-500 relative z-10" />
          </button>
        </div>
        <div className=" rounded-xl border border-gray-200 dark:border-gray-700 border-solid overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up">
          <div className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-gray-300 dark:scrollbar-track-gray-700 scrollbar-thumb-blue-500 scrollbar-thumb-rounded">
            <div
              className={`${columns.length > 3 ? "min-w-[800px]" : "w-full"
                } transition-all duration-300`}>
              <div className="flex dark:bg-gray-900   animate-slide-down">
                <div className="w-16 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 sm:w-20 p-3 sm:p-4 flex items-center justify-center flex-shrink-0  transition-colors duration-200">
                  <h3 className="dark:text-white text-gray-700 text-sm sm:text-lg font-bold animate-fade-in">
                    S. No.
                  </h3>
                </div>
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`group border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 relative ${columns.length > 3 ? "w-60" : "flex-1"
                      } min-w-[200px] p-3 sm:p-4 cursor-move transition-all duration-300 ease-out select-none ${dragOverIndex === index
                        ? " transform scale-[1.02] shadow-lg animate-pulse-fast"
                        : ""
                      } ${draggedIndex === index
                        ? "opacity-60 transform rotate-2 scale-95 shadow-2xl animate-shake"
                        : ""
                      } ${index !== columns.length ? " " : ""}`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: "both",
                    }}>
                    <div className="mt-2 flex items-center justify-between">
                      {editingHeading === column.id ? (
                        <input
                          type="text"
                          defaultValue={column.heading}
                          onBlur={(e) =>
                            updateHeading(column.id, e.target.value)
                          }
                          disabled={isSending}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              updateHeading(column.id, e.target.value);
                            }
                          }}
                          className="w-full bg-transparent dark:text-white text-gray-800 text-sm sm:text-lg font-bold  focus:outline-none pr-8 animate-fade-in  transition-colors duration-300"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center group/heading cursor-pointer pr-8 max-w-[90%] transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHeading(column.id);
                          }}>
                          <GripVertical className="w-3 h-3 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 mr-2 group-hover:text-blue-500 transition-colors duration-200 animate-pulse-slow" />
                          <h3 className="dark:text-white text-gray-700 text-sm sm:text-lg font-bold flex-1 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            {column.heading}
                          </h3>
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === column.id ? null : column.id)
                        }
                        disabled={isSending}
                        className="p-1 disabled:cursor-not-allowed disabled:opacity-50 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transform hover:rotate-90 hover:scale-110 transition-all duration-300 group-hover:animate-spin-slow">
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-colors duration-200" />
                      </button>
                    </div>
                    {menuOpen === column.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute dark:text-white top-10 right-2 bg-white dark:bg-gray-800 shadow-2xl rounded-lg z-50  p-2 w-40 animate-dropdown backdrop-blur-sm">
                        <button
                          onClick={() => deleteColumn(column.id)}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 w-full hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md">
                          <X className="w-4 h-4 hover:animate-spin" /> Delete
                          Column
                        </button>
                        {index > 0 && (
                          <button
                            onClick={() => shiftLeft(index)}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm hover:text-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-md">
                            <ArrowLeft className="w-4 h-4 hover:animate-bounce-x" />{" "}
                            Shift Left
                          </button>
                        )}
                        {index < columns.length - 1 && (
                          <button
                            onClick={() => shiftRight(index)}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm hover:text-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-md">
                            <ArrowRight className="w-4 h-4 hover:animate-bounce-x" />{" "}
                            Shift Right
                          </button>
                        )}
                        <button
                          onClick={() => copyColumn(column, index)}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 w-full hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-sm hover:text-green-600 transition-all duration-200 hover:scale-105 hover:shadow-md">
                          <Copy className="w-4 h-4 hover:animate-pulse" /> Copy
                          Column
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {Array.from({ length: rows }, (_, rowIndex) => {
                const opacity =
                  rowIndex === 0
                    ? "opacity-100 text-[18px]"
                    : rowIndex === 1
                      ? "opacity-90 text-[16px]"
                      : rowIndex === 2
                        ? "opacity-80 text-[14px]"
                        : rowIndex === 3
                          ? "opacity-60 text-[12px]"
                          : rowIndex === 4
                            ? "opacity-50 text-[10px]"
                            : "opacity-40 text-[8px]";

                const padding =
                  rowIndex === 0
                    ? "py-[12px]"
                    : rowIndex === 1
                      ? "py-[9px]"
                      : rowIndex === 2
                        ? "py-[7px]"
                        : rowIndex === 3
                          ? "py-[5px]"
                          : rowIndex === 4
                            ? "py-[3px]"
                            : "py-[2px]";

                return (
                  <div
                    key={rowIndex}
                    className={`flex transition-all duration-300 ease-out animate-slide-up w-full ${opacity}`}>
                    <div
                      className={`w-16 sm:w-20 flex items-center border-b border-r border-gray-200 dark:border-gray-700 justify-center flex-shrink-0 transition-all duration-200 ${rowIndex === 0
                          ? "dark:bg-[#162130] bg-[#a8aeb7]"
                          : rowIndex === 1
                            ? "dark:bg-[#1e2836] bg-[#c6cbd2]"
                            : "dark:bg-[#262f3b] bg-[#dae0e8]"
                        }`}>
                      <div className="dark:text-gray-300 text-gray-600 font-semibold transition-colors duration-200">
                        {rowIndex + 1}
                      </div>
                    </div>

                    {columns.map((column) => (
                      <div
                        key={`cell-${column.id}-${rowIndex}`}
                        className={`border-b border-r border-gray-200 dark:border-gray-700 ${columns.length > 3 ? "w-60" : "flex-1"
                          } min-w-[200px] transition-all duration-200 ${rowIndex === 0
                            ? "dark:bg-[#162130] bg-[#a8aeb7]"
                            : rowIndex === 1
                              ? "dark:bg-[#1e2836] bg-[#c6cbd2]"
                              : "dark:bg-[#262f3b] bg-[#dae0e8]"
                          } ${padding} px-4`}>
                        <div className="h-fit flex items-center">
                          <p className="dark:text-gray-300 text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-default">
                            Content
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
          style={{ animationDelay: "600ms", animationFillMode: "both" }}>
          <button
            onClick={handleSaveTable}
            disabled={isSending}
            className="px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 text-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
            {isSending ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Create MoM</span>
              </>
            )}
          </button>
        </div>
        <div
          className="mt-4 text-center animate-fade-in"
          style={{ animationDelay: "800ms", animationFillMode: "both" }}>
          <p className="text-gray-500 text-xs sm:text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
            Drag columns to reorder • Click headings to edit • Add/remove
            columns • Minimum 2 columns required
          </p>
        </div>
      </div>
    </div>
  );
};

export default TablePreview;
