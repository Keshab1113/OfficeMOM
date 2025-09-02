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
  const tableHeaders = headers.includes("Sr No") ? headers : ["Sr No", ...headers];

  const rows = [
    new TableRow({
      children: tableHeaders.map((header) =>
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
          children: tableHeaders.map((key) =>
            new TableCell({
              width: {
                size: key === "Sr No" ? 6 : 94 / (tableHeaders.length - 1),
                type: WidthType.PERCENTAGE,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: key === "Sr No" ? String(i + 1) : String(row[key] ?? ""),
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
              children: [new TextRun({ text: "OfficeMoM", bold: true, size: 48 })],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [new TextRun({ text: "Meeting Notes", italics: true, size: 32 })],
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
    return XLSX.write(wb, { bookType: "xlsx", type: "array" });
  };

  const attachments = [];

  if (word) {
    const wordBlob = await createWordFile();
    const wordFileName = `Mom.docx`;
    saveAs(wordBlob, wordFileName);
    attachments.push({ blob: wordBlob, fileName: wordFileName });
  }

  if (excel) {
    const excelBuffer = createExcelFile();
    const excelBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const excelFileName = `Mom.xlsx`;
    saveAs(excelBlob, excelFileName);
    attachments.push({ blob: excelBlob, fileName: excelFileName });
  }

  if (!word && !excel) {
    const wordBlob = await createWordFile();
    const wordFileName = `Mom.docx`;
    // saveAs(wordBlob, wordFileName);
    attachments.push({ blob: wordBlob, fileName: wordFileName });
  }

  try {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/send-meeting-email`,
      {
        email,
        name: fullName,
        tableData,
        downloadOptions
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    addToast("success", "Files processed and emailed successfully");
  } catch (err) {
    console.error(err);
    addToast("error", "Failed to send email");
  }
};
