import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
  AlignmentType,
  PageOrientation,
  TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import axios from "axios";

export const saveTranscriptFiles = async (
  tableData,
  addToast,
  downloadOptions,
  email,
  fullName,
  token
) => {
  const { word, excel } = downloadOptions;

  if (!Array.isArray(tableData) || tableData.length === 0) {
    addToast("error", "Invalid or empty data format from API");
    return;
  }

  const headers = Object.keys(tableData[0]);
  const tableHeaders = headers.includes("Sr No")
    ? headers
    : ["Sr No", ...headers];

  const rows = [
    new TableRow({
      children: tableHeaders.map(
        (header) =>
          new TableCell({
            width: {
              size: header === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: header, bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          })
      ),
    }),
    ...tableData.map(
      (row, i) =>
        new TableRow({
          children: tableHeaders.map(
            (key) =>
              new TableCell({
                width: {
                  size: key === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
                  type: WidthType.PERCENTAGE,
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text:
                          key === "Sr No"
                            ? String(i + 1)
                            : String(row[key] ?? ""),
                        size: 24,
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
    ),
  ];

  const createWordFile = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: { size: { orientation: PageOrientation.LANDSCAPE } },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "OfficeMoM", bold: true, size: 48 }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Meeting Notes", italics: true, size: 32 }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
            }),
          ],
        },
      ],
    });
    return await Packer.toBlob(doc);
  };

  const createExcelFile = () => {
    const excelRows = [
      tableHeaders,
      ...tableData.map((r, i) =>
        tableHeaders.map((key) => (key === "Sr No" ? i + 1 : r[key] ?? ""))
      ),
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Action Items");
    
    // Calculate column widths based on content
    const colWidths = tableHeaders.map((header, colIndex) => {
      // Start with header width
      let maxLength = header.length;
      
      // Check data in each row for this column
      excelRows.forEach((row, rowIndex) => {
        if (rowIndex > 0) { // Skip header row
          const cellValue = row[colIndex];
          if (cellValue) {
            const cellLength = String(cellValue).length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        }
      });
      
      // Add some padding and set a reasonable max width
      return { width: Math.min(Math.max(maxLength + 2, 15), 50) };
    });
    
    ws['!cols'] = colWidths;
    
    // Apply styling to header row
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      // Create or update cell style
      ws[cellAddress].s = {
        font: { 
          bold: true, 
          sz: 12,
          color: { rgb: "FFFFFF" }
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "4472C4" } // Blue background
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Apply styling to data rows
    for (let row = headerRange.s.r + 1; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        // Create or update cell style
        ws[cellAddress].s = {
          font: { sz: 11 },
          alignment: { 
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: row === headerRange.s.r + 1 ? "thin" : "none", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          }
        };
        
        // Alternate row coloring for better readability
        if (row % 2 === 0) {
          ws[cellAddress].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "F2F2F2" } // Light gray for even rows
          };
        }
      }
    }
    
    // Set row heights
    ws['!rows'] = [];
    for (let row = 0; row <= headerRange.e.r; row++) {
      ws['!rows'][row] = { hpt: row === 0 ? 25 : 20 }; // Header row is slightly taller
    }
    
    return XLSX.write(wb, { bookType: "xlsx", type: "array" });
  };

  const attachments = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");

  if (word) {
    const wordBlob = await createWordFile();
    const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
    saveAs(wordBlob, wordFileName); // download locally
    attachments.push({ blob: wordBlob, fileName: wordFileName });
  }

  if (excel) {
    const excelBuffer = createExcelFile();
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const excelFileName = `Officemom - minutes of the meeting, ${dateStr}.xlsx`;
    saveAs(excelBlob, excelFileName); // download locally
    attachments.push({ blob: excelBlob, fileName: excelFileName });
  }

  if (!word && !excel) {
    const wordBlob = await createWordFile();
    const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
    attachments.push({ blob: wordBlob, fileName: wordFileName });
  }

  // --- SEND FILES USING FORMDATA ---
  const formData = new FormData();
  formData.append("email", email);
  formData.append("name", fullName);
  formData.append("tableData", JSON.stringify(tableData));
  formData.append("downloadOptions", JSON.stringify(downloadOptions));

  attachments.forEach((file) => {
    formData.append("files", file.blob, file.fileName);
  });

  try {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/send-meeting-email`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    addToast("success", "Files processed and emailed successfully");
  } catch (err) {
    console.error(err);
    addToast("error", "Failed to send email");
  }
};