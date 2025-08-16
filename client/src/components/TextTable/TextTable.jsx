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
} from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import axios from "axios";

export const saveTranscriptFiles = async (
  tableData,
  headers,
  addToast,
  downloadOptions,
  fileName,
  email,
  fullName,
  token
) => {
  const { word, excel } = downloadOptions;

  if (!Array.isArray(tableData)) {
    addToast("error", "Invalid data format from API");
    return;
  }

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
                new TextRun({ text: "SmartMom", bold: true, size: 48 }),
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
            new Table({ rows }),
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

  let fileBlob;
  let downloadFileName;

  if (!word && !excel) {
    fileBlob = await createWordFile();
    downloadFileName = `${fileName}.docx`;
  } else if (word) {
    fileBlob = await createWordFile();
    downloadFileName = `${fileName}.docx`;
    saveAs(fileBlob, downloadFileName);
  } else if (excel) {
    const excelBuffer = createExcelFile();
    fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    downloadFileName = `${fileName}.xlsx`;
    saveAs(fileBlob, downloadFileName);
  }

  try {
    const formData = new FormData();
    formData.append("file", fileBlob, downloadFileName);
    formData.append("email", email);
    formData.append("name", fullName);
    formData.append("fileName", downloadFileName);

    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/send-meeting-email`,
      formData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    addToast("success", "File processed and emailed successfully");
  } catch (err) {
    console.error(err);
    addToast("error", "Failed to send email");
  }
};
