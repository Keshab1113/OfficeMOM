// import {
//   Document,
//   Packer,
//   Paragraph,
//   Table,
//   TableRow,
//   TableCell,
//   WidthType,
//   TextRun,
//   AlignmentType,
//   PageOrientation,
//   TableLayoutType,
// } from "docx";
// import { saveAs } from "file-saver";
// import * as XLSX from "xlsx";
// import axios from "axios";

// export const saveTranscriptFiles = async (
//   tableData,
//   addToast,
//   downloadOptions,
//   email,
//   fullName,
//   token
// ) => {
//   const { word, excel } = downloadOptions;

//   if (!Array.isArray(tableData) || tableData.length === 0) {
//     addToast("error", "Invalid or empty data format from API");
//     return;
//   }

//   const headers = Object.keys(tableData[0]);
//   const tableHeaders = headers.includes("Sr No")
//     ? headers
//     : ["Sr No", ...headers];

//   const rows = [
//     new TableRow({
//       children: tableHeaders.map(
//         (header) =>
//           new TableCell({
//             width: {
//               size: header === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
//               type: WidthType.PERCENTAGE,
//             },
//             children: [
//               new Paragraph({
//                 children: [new TextRun({ text: header, bold: true, size: 28 })],
//                 alignment: AlignmentType.CENTER,
//               }),
//             ],
//           })
//       ),
//     }),
//     ...tableData.map(
//       (row, i) =>
//         new TableRow({
//           children: tableHeaders.map(
//             (key) =>
//               new TableCell({
//                 width: {
//                   size: key === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
//                   type: WidthType.PERCENTAGE,
//                 },
//                 children: [
//                   new Paragraph({
//                     children: [
//                       new TextRun({
//                         text:
//                           key === "Sr No"
//                             ? String(i + 1)
//                             : String(row[key] ?? ""),
//                         size: 24,
//                       }),
//                     ],
//                   }),
//                 ],
//               })
//           ),
//         })
//     ),
//   ];

//   const createWordFile = async () => {
//     const doc = new Document({
//       sections: [
//         {
//           properties: {
//             page: { size: { orientation: PageOrientation.LANDSCAPE } },
//           },
//           children: [
//             new Paragraph({
//               children: [
//                 new TextRun({ text: "OfficeMoM", bold: true, size: 48 }),
//               ],
//               alignment: AlignmentType.CENTER,
//             }),
//             new Paragraph({
//               children: [
//                 new TextRun({ text: "Meeting Notes", italics: true, size: 32 }),
//               ],
//               alignment: AlignmentType.CENTER,
//             }),
//             new Paragraph({ text: "" }),
//             new Table({
//               rows,
//               width: { size: 100, type: WidthType.PERCENTAGE },
//               layout: TableLayoutType.FIXED,
//             }),
//           ],
//         },
//       ],
//     });
//     return await Packer.toBlob(doc);
//   };

//   const createExcelFile = () => {
//     const excelRows = [
//       tableHeaders,
//       ...tableData.map((r, i) =>
//         tableHeaders.map((key) => (key === "Sr No" ? i + 1 : r[key] ?? ""))
//       ),
//     ];
    
//     const ws = XLSX.utils.aoa_to_sheet(excelRows);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Action Items");
    
//     // Calculate column widths based on content
//     const colWidths = tableHeaders.map((header, colIndex) => {
//       // Start with header width
//       let maxLength = header.length;
      
//       // Check data in each row for this column
//       excelRows.forEach((row, rowIndex) => {
//         if (rowIndex > 0) { // Skip header row
//           const cellValue = row[colIndex];
//           if (cellValue) {
//             const cellLength = String(cellValue).length;
//             if (cellLength > maxLength) {
//               maxLength = cellLength;
//             }
//           }
//         }
//       });
      
//       // Add some padding and set a reasonable max width
//       return { width: Math.min(Math.max(maxLength + 2, 15), 50) };
//     });
    
//     ws['!cols'] = colWidths;
    
//     // Apply styling to header row
//     const headerRange = XLSX.utils.decode_range(ws['!ref']);
//     for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
//       const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
//       if (!ws[cellAddress]) continue;
      
//       // Create or update cell style
//       ws[cellAddress].s = {
//         font: { 
//           bold: true, 
//           sz: 12,
//           color: { rgb: "FFFFFF" }
//         },
//         fill: {
//           patternType: "solid",
//           fgColor: { rgb: "4472C4" } // Blue background
//         },
//         alignment: { 
//           horizontal: "center", 
//           vertical: "center",
//           wrapText: true
//         },
//         border: {
//           top: { style: "thin", color: { rgb: "000000" } },
//           bottom: { style: "thin", color: { rgb: "000000" } },
//           left: { style: "thin", color: { rgb: "000000" } },
//           right: { style: "thin", color: { rgb: "000000" } }
//         }
//       };
//     }
    
//     // Apply styling to data rows
//     for (let row = headerRange.s.r + 1; row <= headerRange.e.r; row++) {
//       for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
//         const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
//         if (!ws[cellAddress]) continue;
        
//         // Create or update cell style
//         ws[cellAddress].s = {
//           font: { sz: 11 },
//           alignment: { 
//             vertical: "center",
//             wrapText: true
//           },
//           border: {
//             top: { style: row === headerRange.s.r + 1 ? "thin" : "none", color: { rgb: "D9D9D9" } },
//             bottom: { style: "thin", color: { rgb: "D9D9D9" } },
//             left: { style: "thin", color: { rgb: "D9D9D9" } },
//             right: { style: "thin", color: { rgb: "D9D9D9" } }
//           }
//         };
        
//         // Alternate row coloring for better readability
//         if (row % 2 === 0) {
//           ws[cellAddress].s.fill = {
//             patternType: "solid",
//             fgColor: { rgb: "F2F2F2" } // Light gray for even rows
//           };
//         }
//       }
//     }
    
//     // Set row heights
//     ws['!rows'] = [];
//     for (let row = 0; row <= headerRange.e.r; row++) {
//       ws['!rows'][row] = { hpt: row === 0 ? 25 : 20 }; // Header row is slightly taller
//     }
    
//     return XLSX.write(wb, { bookType: "xlsx", type: "array" });
//   };

//   const attachments = [];
//   const now = new Date();
//   const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");

//   if (word) {
//     const wordBlob = await createWordFile();
//     const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
//     saveAs(wordBlob, wordFileName); // download locally
//     attachments.push({ blob: wordBlob, fileName: wordFileName });
//   }

//   if (excel) {
//     const excelBuffer = createExcelFile();
//     const excelBlob = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });
//     const excelFileName = `Officemom - minutes of the meeting, ${dateStr}.xlsx`;
//     saveAs(excelBlob, excelFileName); // download locally
//     attachments.push({ blob: excelBlob, fileName: excelFileName });
//   }

//   if (!word && !excel) {
//     const wordBlob = await createWordFile();
//     const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
//     attachments.push({ blob: wordBlob, fileName: wordFileName });
//   }

//   // --- SEND FILES USING FORMDATA ---
//   const formData = new FormData();
//   formData.append("email", email);
//   formData.append("name", fullName);
//   formData.append("tableData", JSON.stringify(tableData));
//   formData.append("downloadOptions", JSON.stringify(downloadOptions));

//   attachments.forEach((file) => {
//     formData.append("files", file.blob, file.fileName);
//   });

//   try {
//     await axios.post(
//       `${import.meta.env.VITE_BACKEND_URL}/api/send-meeting-email`,
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );
//     addToast("success", "Files processed and emailed successfully");
//   } catch (err) {
//     console.error(err);
//     addToast("error", "Failed to send email");
//   }
// };

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
  BorderStyle,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import axios from "axios";

// Helper function to parse topic label from content
const parseTopicLabel = (text) => {
  if (!text || typeof text !== 'string') return { label: '', content: text || '' };
  
  const colonIndex = text.indexOf(':');
  if (colonIndex > 0 && colonIndex < 100) {
    return {
      label: text.substring(0, colonIndex).trim(),
      content: text.substring(colonIndex + 1).trim()
    };
  }
  return { label: '', content: text };
};

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

  // Identify the first content header (usually "Discussion Summary" or similar)
  const firstContentHeader = tableHeaders.find(h => h !== "Sr No");

  const rows = [
    new TableRow({
      children: tableHeaders.map(
        (header) =>
          new TableCell({
            width: {
              size: header === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
              type: WidthType.PERCENTAGE,
            },
            shading: {
              fill: "1F4E78",
              type: ShadingType.SOLID,
              color: "1F4E78",
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: header, 
                    bold: true, 
                    size: 28,
                    color: "FFFFFF"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
              }),
            ],
          })
      ),
    }),
    ...tableData.map(
      (row, i) =>
        new TableRow({
          children: tableHeaders.map(
            (key) => {
              const cellValue = key === "Sr No" ? String(i + 1) : String(row[key] ?? "");
              
              // Parse topic label for first content column
              const isFirstContent = key === firstContentHeader;
              const { label, content } = isFirstContent ? parseTopicLabel(cellValue) : { label: '', content: cellValue };
              
              return new TableCell({
                width: {
                  size: key === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
                  type: WidthType.PERCENTAGE,
                },
                shading: i % 2 === 0 ? {
                  fill: "F2F2F2",
                  type: ShadingType.SOLID,
                  color: "F2F2F2",
                } : {
                  fill: "FFFFFF",
                  type: ShadingType.SOLID,
                  color: "FFFFFF",
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
                },
                children: [
                  new Paragraph({
                    children: isFirstContent && label ? [
                      // Bold, larger, and highlighted topic label
                      new TextRun({
                        text: label + ":",
                        bold: true,
                        size: 24, // Larger than content text
                         
                      }),
                      new TextRun({
                        text: "\n" + content, // Line break before content
                        size: 22,
                      }),
                    ] : [
                      new TextRun({
                        text: cellValue,
                        size: 22,
                      }),
                    ],
                    alignment: key === "Sr No" ? AlignmentType.CENTER : AlignmentType.LEFT,
                    spacing: { before: 80, after: 80 },
                  }),
                ],
              });
            }
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
                new TextRun({ 
                  text: "OfficeMoM", 
                  bold: true, 
                  size: 56,
                  color: "1F4E78"
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 },
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "Meeting Notes", 
                  bold: true,
                  italics: true, 
                  size: 40,
                  color: "000000"
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
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
    // Process data to split topic labels into separate lines
    const processedData = tableData.map((r, i) => {
      const processedRow = {};
      tableHeaders.forEach((key) => {
        if (key === "Sr No") {
          processedRow[key] = i + 1;
        } else if (key === firstContentHeader) {
          // Split topic label and content for first content column
          const cellValue = r[key] ?? "";
          const { label, content } = parseTopicLabel(String(cellValue));
          // Store as object for special formatting later
          processedRow[key] = label ? { label, content } : cellValue;
        } else {
          processedRow[key] = r[key] ?? "";
        }
      });
      return processedRow;
    });

    const excelRows = [
      ["OfficeMoM"],
      ["Meeting Notes"],
      [],
      tableHeaders,
      ...processedData.map((r) =>
        tableHeaders.map((key) => {
          if (typeof r[key] === 'object' && r[key].label) {
            // Return combined text for display
            return `${r[key].label}:\n${r[key].content}`;
          }
          return r[key];
        })
      ),
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meeting Notes");
    
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: tableHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: tableHeaders.length - 1 } },
    ];
    
    // Main title styling
    ws['A1'].s = {
      font: { 
        bold: true, 
        sz: 22,
        color: { rgb: "1F4E78" },
        name: "Calibri"
      },
      alignment: { horizontal: "center", vertical: "center" },
    };
    
    // Subtitle styling - BOLD only
    ws['A2'].s = {
      font: { 
        bold: true, 
        italic: true, 
        sz: 18,
        color: { rgb: "000000" },
        name: "Calibri"
      },
      alignment: { horizontal: "center", vertical: "center" },
    };
    
    const colWidths = tableHeaders.map((header, colIndex) => {
      let maxLength = header.length;
      
      excelRows.forEach((row, rowIndex) => {
        if (rowIndex > 3) {
          const cellValue = row[colIndex];
          if (cellValue) {
            // Calculate max line length for wrapped text
            const lines = String(cellValue).split('\n');
            const maxLineLength = Math.max(...lines.map(line => line.length));
            if (maxLineLength > maxLength) {
              maxLength = maxLineLength;
            }
          }
        }
      });
      
      return { width: Math.min(Math.max(maxLength + 3, 20), 65) };
    });
    
    ws['!cols'] = colWidths;
    
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    
    // Style table headers
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { 
          bold: true, 
          sz: 14,
          color: { rgb: "FFFFFF" },
          name: "Calibri"
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "1F4E78" }
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } }
        }
      };
    }
    
    // Find first content column index
    const firstContentColIndex = tableHeaders.findIndex(h => h !== "Sr No");
    
    // Style data rows
    for (let row = 4; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        const cellValue = ws[cellAddress].v;
        const isFirstContent = col === firstContentColIndex;
        
        // Base cell styling
        ws[cellAddress].s = {
          font: { 
            sz: 11,
            name: "Calibri"
          },
          alignment: { 
            horizontal: col === 0 ? "center" : "left",
            vertical: "top",
            wrapText: true
          },
          border: {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          }
        };
        
        // Special formatting for first content column with topic labels
        if (isFirstContent && cellValue && String(cellValue).includes('\n')) {
          const lines = String(cellValue).split('\n');
          const label = lines[0];
          const content = lines.slice(1).join('\n');
          
          // Apply rich text formatting
          ws[cellAddress].t = 's'; // Set as string type
          ws[cellAddress].r = [
            {
              t: label,
              s: {
                bold: true,
                sz: 12, // Larger font for label
                name: "Calibri"
              }
            },
            {
              t: '\n' + content,
              s: {
                sz: 11,
                name: "Calibri"
              }
            }
          ];
        }
        
        // Alternate row coloring
        if ((row - 4) % 2 === 0) {
          ws[cellAddress].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "F2F2F2" }
          };
        }
      }
    }
    
    // Set row heights
    ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 40 };
    ws['!rows'][1] = { hpt: 32 };
    ws['!rows'][2] = { hpt: 10 };
    ws['!rows'][3] = { hpt: 32 };
    
    // Calculate dynamic row heights for data rows
    for (let row = 4; row <= headerRange.e.r; row++) {
      let maxLines = 1;
      
      // Check all columns for line breaks
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = ws[cellAddress]?.v;
        if (cellValue) {
          const lines = String(cellValue).split('\n').length;
          if (lines > maxLines) maxLines = lines;
        }
      }
      
      // Set height based on number of lines (18 per line + 10 base)
      const calculatedHeight = Math.max(30, 18 * maxLines + 10);
      ws['!rows'][row] = { hpt: Math.min(calculatedHeight, 150) }; // Cap at 150
    }
    
    return XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  };

  const attachments = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");

  if (word) {
    const wordBlob = await createWordFile();
    const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
    saveAs(wordBlob, wordFileName);
    attachments.push({ blob: wordBlob, fileName: wordFileName });
  }

  if (excel) {
    const excelBuffer = createExcelFile();
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const excelFileName = `Officemom - minutes of the meeting, ${dateStr}.xlsx`;
    saveAs(excelBlob, excelFileName);
    attachments.push({ blob: excelBlob, fileName: excelFileName });
  }

  if (!word && !excel) {
    const wordBlob = await createWordFile();
    const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
    attachments.push({ blob: wordBlob, fileName: wordFileName });
  }

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