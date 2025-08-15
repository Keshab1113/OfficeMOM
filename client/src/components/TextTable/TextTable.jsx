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

export const saveTranscriptFiles = async (
  tableData,
  headers,
  addToast,
  downloadOptions,
  fileName,
) => {
  const { word, excel } = downloadOptions;

  if (!word && !excel) {
    addToast("error", "Please choose a download option");
    // return;
  }

  if (!Array.isArray(tableData)) {
    console.error("Expected array but got:", tableData);
    addToast("error", "Invalid data format from API");
    return;
  }

  const tableHeaders = headers.includes("Sr No")
    ? headers
    : ["Sr No", ...headers];

  // Common rows for both Word and Excel
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

  // Generate Word document if selected
  if (word) {
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
            new Table({ rows }),
          ],
        },
      ],
    });

    const blobWord = await Packer.toBlob(doc);
    saveAs(blobWord, `${fileName}.docx`);
  }

  // Generate Excel file if selected
  if (excel) {
    const excelRows = [
      tableHeaders,
      ...tableData.map((r, i) =>
        tableHeaders.map((key) => (key === "Sr No" ? i + 1 : r[key] ?? ""))
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Action Items");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `${fileName}.xlsx`
    );
  }

  addToast("success", "Meeting converted to structured table successfully");
};
