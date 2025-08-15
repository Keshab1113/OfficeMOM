import React, { useState } from "react";
import { Plus, X, GripVertical, Edit3, Minus, Save } from "lucide-react";
import { useDispatch } from "react-redux";
import { setTableData } from "../../redux/meetingSlice";
import { useToast } from "../ToastContext";

const TablePreview = ({onSaveHeaders }) => {
  const [columns, setColumns] = useState([
    {
      id: 1,
      heading: "Description",
    },
    {
      id: 2,
      heading: "Participants",
    },
  ]);

  const [rows, setRows] = useState(3);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingHeading, setEditingHeading] = useState(null);
  const [fileName, setFileName] = useState("");

  const { addToast } = useToast();
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
  };

  const updateHeading = (id, newHeading) => {
    setColumns(
      columns.map((col) =>
        col.id === id ? { ...col, heading: newHeading } : col
      )
    );
    setEditingHeading(null);
  };

  const addRow = () => {
    if (rows < 20) {
      setRows(rows + 1);
    }
  };

  const removeRow = () => {
    if (rows > 1) {
      setRows(rows - 1);
    }
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
    if (!fileName.trim()) {
      addToast("error", "Please enter a file name");
      return;
    }

    const headersArray = [...columns.map((col) => col.heading)];
    const tableData = {
      headers: headersArray,
      columns: columns.length + 1,
      rows: rows,
    };
    
    dispatch(setTableData(tableData));
    
    if (onSaveHeaders) {
      onSaveHeaders(headersArray, rows, fileName.trim());
    }
    
    addToast("success", "Table updated successfully");
  };

  return (
    <div className="mb-10 w-full lg:max-w-[71vw]">
      <p className="mt-0 mb-6 dark:text-white text-center md:text-4xl text-2xl font-medium">
        Record Preview
      </p>
      <div className="dark:bg-gray-900 bg-white w-full h-full min-h-[40vh] p-4 md:p-6 rounded-xl border border-gray-300 dark:border-gray-700 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Columns:
            </span>
            <button
              onClick={addNewColumn}
              className="group bg-blue-600 cursor-pointer hover:bg-blue-500 rounded-full p-2 shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
              title="Add Column"
            >
              <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Rows:
            </span>
            <button
              onClick={removeRow}
              disabled={rows <= 1}
              className="bg-red-600 cursor-pointer hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full p-2 shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
              title="Remove Row"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <span className="mx-2 dark:text-white px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-semibold min-w-[40px] text-center">
              {rows}
            </span>
            <button
              onClick={addRow}
              disabled={rows >= 20}
              className="bg-green-600 cursor-pointer hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full p-2 shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
              title="Add Row"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="dark:bg-gray-800 bg-gray-100 rounded-xl border dark:border-gray-700 border-gray-300 overflow-hidden shadow-xl">
          <div className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-gray-300 dark:scrollbar-track-gray-700 scrollbar-thumb-blue-500 scrollbar-thumb-rounded">
            <div
              className={`${columns.length > 3 ? "min-w-[800px]" : "w-full"}`}
            >
              <div className="flex dark:bg-gray-900 bg-gray-200 border-b border-gray-300 dark:border-gray-700">
                <div className="w-16 sm:w-20 p-3 sm:p-4 border-r dark:border-gray-700 border-gray-400 flex items-center justify-center flex-shrink-0">
                  <h3 className="dark:text-white text-gray-700 text-sm sm:text-lg font-bold">
                    S No
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
                    className={`group relative ${
                      columns.length > 3 ? "w-60" : "flex-1"
                    } min-w-[200px] p-3 sm:p-4 cursor-move transition-all duration-200 select-none ${
                      dragOverIndex === index
                        ? "dark:bg-gray-600 bg-gray-300 transform scale-[1.02] shadow-lg"
                        : ""
                    } ${
                      draggedIndex === index
                        ? "opacity-60 transform rotate-1"
                        : ""
                    } ${
                      index !== columns.length
                        ? "border-r dark:border-gray-700 border-gray-400 border-b dark:bg-slate-900 bg-gray-300"
                        : ""
                    }`}
                  >
                    {columns.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteColumn(column.id);
                        }}
                        className="
    absolute cursor-pointer top-2 right-2 bg-red-600 hover:bg-red-500 
    rounded-full p-1.5 z-20 shadow-lg transform hover:scale-110 transition-all duration-200 
    opacity-100 md:opacity-0 md:group-hover:opacity-100
  "
                        title="Delete Column"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                    <div className="mt-2">
                      {editingHeading === column.id ? (
                        <input
                          type="text"
                          defaultValue={column.heading}
                          onBlur={(e) =>
                            updateHeading(column.id, e.target.value)
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              updateHeading(column.id, e.target.value);
                            }
                          }}
                          className="w-full bg-transparent dark:text-white text-gray-800 text-sm sm:text-lg font-bold border-b-2 dark:border-blue-500 border-gray-300 focus:outline-none pr-8"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center group/heading cursor-pointer pr-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHeading(column.id);
                          }}
                        >
                          <GripVertical className="w-3 h-3 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 mr-2" />
                          <h3 className="dark:text-white text-gray-700 text-sm sm:text-lg font-bold flex-1 truncate">
                            {column.heading}
                          </h3>
                          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 opacity-0 group-hover/heading:opacity-100 transition-opacity duration-200 ml-2 flex-shrink-0" />
                        </div>
                      )}
                    </div>
                    {dragOverIndex === index &&
                      draggedIndex !== null &&
                      draggedIndex !== index && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 animate-pulse z-10"></div>
                      )}
                  </div>
                ))}
              </div>

              {Array.from({ length: rows }, (_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className={`flex ${
                    rowIndex === rows - 1
                      ? "dark:bg-gray-800 bg-blue-50"
                      : "dark:bg-gray-800 bg-blue-50 "
                  } w-full`}
                >
                  <div className="w-16 sm:w-20 p-3 sm:p-4 border-r  flex items-center justify-center flex-shrink-0 border-b border-gray-300 dark:border-gray-700">
                    <div className="dark:text-gray-300 text-gray-600 font-semibold text-sm sm:text-base">
                      {rowIndex + 1}
                    </div>
                  </div>
                  {columns.map((column, colIndex) => (
                    <div
                      key={`cell-${column.id}-${rowIndex}`}
                      className={`${
                        columns.length > 3 ? "w-60" : "flex-1"
                      } min-w-[200px] p-3 sm:p-4 ${
                        colIndex !== columns.length
                          ? "border-r dark:border-gray-700 border-gray-400 border-b"
                          : " "
                      }`}
                    >
                      <div className="h-fit flex items-center">
                        <p className="dark:text-gray-300 text-gray-600 text-sm sm:text-base">
                          Content
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* File Name Input Section */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="fileName" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              File Name:
            </label>
            <input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-48 sm:w-56"
            />
          </div>
          <button
            onClick={handleSaveTable}
            className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            Drag columns to reorder • Click headings to edit • Add/remove rows
            and columns • Minimum 2 columns, 1 row required
          </p>
        </div>
      </div>
    </div>
  );
};

export default TablePreview;