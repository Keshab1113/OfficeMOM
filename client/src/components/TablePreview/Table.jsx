import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Trash2 } from "lucide-react";
import TextField from "@mui/material/TextField";

const paginationModel = { page: 0, pageSize: 5 };

export default function DataTable({
  translatedColumns,
  header,
  data,
  onDeleteRow,
  onEditRow,
}) {
  const [tableData, setTableData] = React.useState(data || []);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    setTableData(data);
  }, [data]);
  // console.log("tableData: ",tableData);

  const toCamelCase = (str) =>
    str
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, "");

  const formatBulletPoints = (content) => {
    if (!content || content === "Click to Edit") return content;

    if (content?.includes("•") && content?.includes("\n")) {
      const points = content.split("\n").filter((point) => point.trim() !== "");
      return (
        <ul className="list-disc pl-5 space-y-1">
          {points.map((point, index) => (
            <li key={index} className="text-sm">
              {point.replace(/^•\s*/, "").trim()}
            </li>
          ))}
        </ul>
      );
    }

    if (content.includes(":")) {
      const [boldPart, rest] = content.split(/:(.+)/);
      return (
        <span className="text-sm">
          <strong>{boldPart.trim()}:</strong>
          {rest && <span> {rest.trim()}</span>}
        </span>
      );
    }

    return content;
  };

  // Handle cell edit commit
  const handleProcessRowUpdate = (newRow, oldRow) => {
    const updatedRow = { ...newRow };

    // Find which field changed and update via onEditRow
    header.forEach((h) => {
      const field = toCamelCase(h);
      if (newRow[field] !== oldRow[field]) {
        const value = newRow[field] === "Click to Edit" ? "" : newRow[field];
        onEditRow(newRow.id, h, value);
      }
    });

    return updatedRow;
  };

  const handleProcessRowUpdateError = (error) => {
    console.error("Row update error:", error);
  };

  const columns = [
    { field: "id", headerName: "S. No.", width: 70 },

    ...header.map((h, index) => {
      const field = toCamelCase(h);
      return {
        field,
        headerName: translatedColumns[index] || h,
        width: 250,
        editable: true,
        renderCell: (params) => {
          const value = params.value || "";
          return <div className="w-full">{formatBulletPoints(value)}</div>;
        },
        renderEditCell: (params) => {
          const value = params.value === "Click to Edit" ? "" : params.value || "";

          return (
            <TextField
              multiline
              fullWidth
              minRows={3}
              value={value}
              onChange={(e) => {
                params.api.setEditCellValue({
                  id: params.id,
                  field: params.field,
                  value: e.target.value,
                });
              }}
              onKeyDown={(e) => {
                // Prevent default DataGrid keyboard behavior
                e.stopPropagation();
              }}
              variant="standard"
              placeholder="Click to Edit"
              autoFocus
              InputProps={{
                disableUnderline: false,
              }}
            />
          );
        },
      };
    }),

    {
      field: "action",
      headerName: "Action",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <div className="flex justify-center w-full">
          <button
            onClick={() => onDeleteRow(params.id)}
            className="group/btn cursor-pointer inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-red-500 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 border border-red-200 dark:border-red-700 hover:border-red-500 dark:hover:border-red-600"
            title="Delete row"
          >
            <Trash2 size={18} className="group-hover/btn:animate-pulse" />
          </button>
        </div>
      ),
    },
  ];

  const rows = tableData.map((item, index) => {
    const row = { id: index + 1 };
    header.forEach((h) => {
      const field = toCamelCase(h);
      row[field] = item[h] || "Click to Edit";
    });
    return row;
  });

  React.useEffect(() => {
    const currentTheme = localStorage.getItem("theme");
    setIsDarkMode(currentTheme === "dark");

    const observer = new MutationObserver(() => {
      const newTheme = localStorage.getItem("theme");
      setIsDarkMode(newTheme === "dark");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? "dark" : "light",
          primary: { main: "#2196f3" },
        },
      }),
    [isDarkMode]
  );

  const CustomNoRowsOverlay = () => {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
        <p className="mt-3 text-gray-400">Loading...</p>
      </div>
    );
  };


  return (
    <ThemeProvider theme={theme}>
      <Paper
        sx={{
          height: "auto",
          width: "100%",
          margin: "20px auto",
          border: `1px solid ${theme.palette.mode === "dark" ? "#333" : "#f0ebeb"}`,
          boxShadow: "none",
          borderRadius: 2,
          pt: 2,
          backgroundColor: "transparent",
          transition: "background-color 0.3s ease",
          overflowX: "auto",
        }}
        elevation={0}
      >
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5, 10]}
          columnHeaderHeight={56}
          disableRowSelectionOnClick
          checkboxSelection
          getRowHeight={() => "auto"}
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          editMode="cell"
          slots={{
            noRowsOverlay: CustomNoRowsOverlay,
          }}
          sx={{
            border: 0,
            color: theme.palette.mode === "dark" ? "#e0e0e0" : "#000",
            backgroundColor: "transparent",

            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "#e0e0e0"}`,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: "1.5",
              alignItems: "flex-start",
              display: "flex",
              paddingTop: "8px",
              paddingBottom: "8px",
              backgroundColor: "transparent",
            },

            "& .MuiDataGrid-cellContent": {
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            },

            "& .MuiDataGrid-row": {
              maxHeight: "none !important",
              height: "auto !important",
              backgroundColor: "transparent",
              '&:hover': {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              },
              '&.Mui-selected': {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(33, 150, 243, 0.2)" : "rgba(33, 150, 243, 0.08)",
                '&:hover': {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(33, 150, 243, 0.3)" : "rgba(33, 150, 243, 0.12)",
                },
              },
            },

            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "transparent", // Make header background transparent
              color: theme.palette.mode === "dark" ? "#90caf9" : "#0d47a1",
              borderBottom: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "#e0e0e0"}`,
            },

            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "transparent", // Make individual column headers transparent
            },

            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: "bold",
              fontSize: "0.95rem",
              backgroundColor: "transparent", // Make header title background transparent
            },

            "& .MuiDataGrid-columnHeaderTitleContainer": {
              backgroundColor: "transparent", // Make header title container transparent
            },

            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "transparent",
              borderTop: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "#e0e0e0"}`,
            },

            "& .MuiDataGrid-toolbarContainer": {
              backgroundColor: "transparent",
            },

            "& .MuiDataGrid-overlay": {
              backgroundColor: "transparent",
            },

            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: "transparent",
            },

            "& .MuiDataGrid-main": {
              backgroundColor: "transparent",
            },
          }}
        />
      </Paper>
    </ThemeProvider>
  );
}