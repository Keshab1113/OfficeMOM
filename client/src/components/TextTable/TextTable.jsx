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
  BorderStyle,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import axios from "axios";
import ExcelJS from 'exceljs';


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
    try {
      // Create a simple DOCX template using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Load logo
      let logoBase64 = '';
      try {
        const response = await fetch('/logo.png');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );
          logoBase64 = base64;
        }
      } catch (error) {
        console.warn('Could not load logo:', error);
      }

      // Get current date for footer
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Generate table rows with enhanced styling
      const tableRowsHTML = tableData.map((row, i) => {
        const cells = tableHeaders.map((key, colIndex) => {
          const cellValue = key === 'Sr No' ? String(i + 1) : String(row[key] ?? '');
          const isFirstContent = key === firstContentHeader;
          const { label, content } = isFirstContent
            ? parseTopicLabel(cellValue)
            : { label: '', content: cellValue };

          // Escape XML special characters
          const escapeXml = (text) => {
            return String(text)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
          };

          const cellContent = isFirstContent && label
            ? `<w:p>
              <w:pPr>
                <w:spacing w:before="100" w:after="80"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:color w:val="1F4E78"/>
                  <w:sz w:val="24"/>
                </w:rPr>
                <w:t xml:space="preserve">${escapeXml(label)}:</w:t>
              </w:r>
            </w:p>
            <w:p>
              <w:pPr>
                <w:spacing w:before="60" w:after="100"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:color w:val="333333"/>
                  <w:sz w:val="22"/>
                </w:rPr>
                <w:t xml:space="preserve">${escapeXml(content)}</w:t>
              </w:r>
            </w:p>`
            : `<w:p>
              <w:pPr>
                <w:spacing w:before="100" w:after="100"/>
                ${key === 'Sr No' ? '<w:jc w:val="center"/>' : ''}
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:color w:val="${key === 'Sr No' ? '1F4E78' : '333333'}"/>
                  <w:sz w:val="22"/>
                  ${key === 'Sr No' ? '<w:b/>' : ''}
                </w:rPr>
                <w:t xml:space="preserve">${escapeXml(cellValue)}</w:t>
              </w:r>
            </w:p>`;

          const bgColor = i % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
          const leftBorder = colIndex === 0 ? '<w:left w:val="single" w:sz="8" w:space="0" w:color="1F4E78"/>' : '<w:left w:val="single" w:sz="2" w:space="0" w:color="E2E8F0"/>';

          return `<w:tc>
          <w:tcPr>
            <w:tcW w:w="${key === 'Sr No' ? '800' : '3200'}" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="2" w:space="0" w:color="E2E8F0"/>
              ${leftBorder}
              <w:bottom w:val="single" w:sz="2" w:space="0" w:color="E2E8F0"/>
              <w:right w:val="single" w:sz="2" w:space="0" w:color="E2E8F0"/>
            </w:tcBorders>
            <w:tcMar>
              <w:top w:w="100" w:type="dxa"/>
              <w:left w:w="150" w:type="dxa"/>
              <w:bottom w:w="100" w:type="dxa"/>
              <w:right w:w="150" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          ${cellContent}
        </w:tc>`;
        }).join('');

        return `<w:tr>
        <w:trPr>
          <w:trHeight w:val="600" w:hRule="atLeast"/>
        </w:trPr>
        ${cells}
      </w:tr>`;
      }).join('');

      // Generate header row with gradient effect
      const headerRowXML = tableHeaders.map((header, colIndex) => `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${header === 'Sr No' ? '800' : '3200'}" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="1E40AF"/>
          <w:tcBorders>
            <w:top w:val="single" w:sz="12" w:space="0" w:color="1E40AF"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="3B82F6"/>
            <w:bottom w:val="single" w:sz="12" w:space="0" w:color="1E40AF"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="3B82F6"/>
          </w:tcBorders>
          <w:tcMar>
            <w:top w:w="150" w:type="dxa"/>
            <w:left w:w="150" w:type="dxa"/>
            <w:bottom w:w="150" w:type="dxa"/>
            <w:right w:w="150" w:type="dxa"/>
          </w:tcMar>
        </w:tcPr>
        <w:p>
          <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:before="120" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:color w:val="FFFFFF"/>
              <w:sz w:val="24"/>
              <w:szCs w:val="24"/>
            </w:rPr>
            <w:t>${header.toUpperCase()}</w:t>
          </w:r>
        </w:p>
      </w:tc>
    `).join('');

      // Logo section with better positioning
      const logoXML = logoBase64 ? `
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:after="150"/>
        </w:pPr>
        <w:r>
          <w:drawing>
            <wp:inline distT="0" distB="0" distL="0" distR="0">
              <wp:extent cx="685800" cy="685800"/>
              <wp:effectExtent l="0" t="0" r="0" b="0"/>
              <wp:docPr id="1" name="Logo"/>
              <wp:cNvGraphicFramePr>
                <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
              </wp:cNvGraphicFramePr>
              <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:nvPicPr>
                      <pic:cNvPr id="1" name="Logo"/>
                      <pic:cNvPicPr/>
                    </pic:nvPicPr>
                    <pic:blipFill>
                      <a:blip r:embed="rId4"/>
                      <a:stretch><a:fillRect/></a:stretch>
                    </pic:blipFill>
                    <pic:spPr>
                      <a:xfrm>
                        <a:off x="0" y="0"/>
                        <a:ext cx="685800" cy="685800"/>
                      </a:xfrm>
                      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                    </pic:spPr>
                  </pic:pic>
                </a:graphicData>
              </a:graphic>
            </wp:inline>
          </w:drawing>
        </w:r>
      </w:p>
    ` : '';

      // Create document.xml content with enhanced styling
      const documentXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${logoXML}
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="1E40AF"/>
          <w:sz w:val="60"/>
          <w:szCs w:val="60"/>
        </w:rPr>
        <w:t>OfficeMoM</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="64748B"/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
        </w:rPr>
        <w:t>Minutes of the Meeting</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="94A3B8"/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>Generated on: ${today}</w:t>
      </w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
      </w:tblPr>
      <w:tblGrid>
        ${tableHeaders.map(h => `<w:gridCol w:w="${h === 'Sr No' ? '800' : '3200'}"/>`).join('')}
      </w:tblGrid>
      <w:tr>
        <w:trPr>
          <w:trHeight w:val="800" w:hRule="atLeast"/>
        </w:trPr>
        ${headerRowXML}
      </w:tr>
      ${tableRowsHTML}
    </w:tbl>
    <w:p>
      <w:pPr>
        <w:spacing w:before="400"/>
      </w:pPr>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:pBdr>
          <w:top w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/>
        </w:pBdr>
        <w:spacing w:before="200" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="94A3B8"/>
          <w:sz w:val="18"/>
        </w:rPr>
        <w:t>Total Items: ${tableData.length} | Powered by OfficeMoM</w:t>
      </w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

      // Add to ZIP
      zip.file('word/document.xml', documentXML);

      // Add content types
      const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
      zip.file('[Content_Types].xml', contentTypes);

      // Add _rels/.rels
      const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
      zip.folder('_rels').file('.rels', mainRels);

      // Add word/_rels/document.xml.rels
      const documentRels = logoBase64 ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>
</Relationships>` : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

      zip.folder('word').folder('_rels').file('document.xml.rels', documentRels);

      // Add logo to media folder if available
      if (logoBase64) {
        const logoBuffer = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
        zip.folder('word').folder('media').file('logo.png', logoBuffer);
      }

      // Generate blob
      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE'
      });

      return blob;
    } catch (error) {
      console.error('Error creating Word file:', error);
      addToast('error', 'Failed to create Word file');
      throw error;
    }
  };


  const createExcelFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'OfficeMoM';
      workbook.lastModifiedBy = 'OfficeMoM';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('OfficeMoM - Minutes of the Meeting', {
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          fitToHeight: 1,
          fitToWidth: 1,
          margins: {
            left: 0.3, right: 0.3,
            top: 0.4, bottom: 0.4,
            header: 0.3, footer: 0.3
          }
        }
      });

      worksheet.properties.defaultRowHeight = 25;

      // Modern color scheme
      const colors = {
        primary: 'FF2563EB',
        primaryLight: 'FFDBEAFE',
        secondary: 'FF1E293B',
        accent: 'FF10B981',
        headerBg: 'FF1E40AF',
        evenRow: 'FFF8FAFC',
        oddRow: 'FFFFFFFF',
        border: 'FFE2E8F0'
      };

      let currentRow = 1;

      // Company Logo with better positioning
      try {
        const response = await fetch('/logo.webp');
        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'webp',
          });

          worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            br: { col: 1.5, row: 3 },
            editAs: 'oneCell'
          });

          worksheet.getColumn(1).width = 12;
        }
      } catch (error) {
        console.warn('Could not load logo, continuing without it:', error);
      }

      // Calculate last column letter
      const lastCol = String.fromCharCode(64 + tableHeaders.length);

      // Decorative header background (rows 1-3)
      worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow + 2}`);
      const headerBgCell = worksheet.getCell(`A${currentRow}`);
      headerBgCell.fill = {
        type: 'gradient',
        gradient: 'angle',
        degree: 45,
        stops: [
          { position: 0, color: { argb: colors.primary } },
          { position: 1, color: { argb: colors.headerBg } }
        ]
      };

      // Main Title (within the merged area, using column B)
      const titleCell = worksheet.getCell(`B${currentRow}`);
      titleCell.value = 'OfficeMoM';
      titleCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      titleCell.font = {
        name: 'Segoe UI',
        size: 28,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      worksheet.getRow(currentRow).height = 45;

      // Subtitle (row 2, within merged area)
      currentRow++;
      const subtitleCell = worksheet.getCell(`B${currentRow}`);
      subtitleCell.value = 'OfficeMoM - Minutes of the Meeting';
      subtitleCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      subtitleCell.font = {
        name: 'Segoe UI',
        size: 16,
        italic: true,
        color: { argb: 'FFFFFFFF' }
      };
      worksheet.getRow(currentRow).height = 32;

      // Row 3 (part of merged header background)
      currentRow++;
      worksheet.getRow(currentRow).height = 10;

      // Meeting metadata section
      currentRow++;
      const metadataRow = worksheet.getRow(currentRow);
      metadataRow.height = 25;

      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
      const metadataCell = metadataRow.getCell(1);
      metadataCell.value = `Generated on: ${today}`;
      metadataCell.alignment = {
        vertical: 'middle',
        horizontal: 'right'
      };
      metadataCell.font = {
        name: 'Segoe UI',
        size: 10,
        italic: true,
        color: { argb: 'FF64748B' }
      };

      // Spacing row
      currentRow++;
      worksheet.getRow(currentRow).height = 15;

      // Modern Table Headers
      currentRow++;
      const headerRow = worksheet.getRow(currentRow);
      headerRow.height = 40;
      const headerRowNum = currentRow;

      tableHeaders.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header.toUpperCase();
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        };
        cell.font = {
          name: 'Segoe UI Semibold',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.headerBg }
        };
        cell.border = {
          top: { style: 'medium', color: { argb: colors.headerBg } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'medium', color: { argb: colors.headerBg } },
          right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
      });

      // Data Rows with enhanced styling
      const dataStartRow = currentRow + 1;
      tableData.forEach((rowData, rowIndex) => {
        currentRow++;
        const dataRow = worksheet.getRow(currentRow);
        dataRow.height = 30; // This will be adjusted later

        tableHeaders.forEach((key, colIndex) => {
          const cellValue = key === "Sr No" ? String(rowIndex + 1) : String(rowData[key] ?? "");
          const cell = dataRow.getCell(colIndex + 1);

          const isFirstContent = key === firstContentHeader;

          if (isFirstContent) {
            const { label, content } = parseTopicLabel(cellValue);

            if (label && content) {
              // Use rich text for partial formatting
              cell.value = {
                richText: [
                  {
                    text: `${label}:\n`,
                    font: {
                      name: 'Segoe UI',
                      size: 10,
                      bold: true,
                      color: { argb: colors.secondary }
                    }
                  },
                  {
                    text: content,
                    font: {
                      name: 'Segoe UI',
                      size: 10,
                      bold: false,
                      color: { argb: colors.secondary }
                    }
                  }
                ]
              };
            } else if (label && !content) {
              // Only label exists
              cell.value = {
                richText: [
                  {
                    text: `${label}:`,
                    font: {
                      name: 'Segoe UI',
                      size: 10,
                      bold: true,
                      color: { argb: colors.secondary }
                    }
                  }
                ]
              };
            } else {
              // No label found, use regular text
              cell.value = cellValue;
              cell.font = {
                name: 'Segoe UI',
                size: 10,
                color: { argb: colors.secondary }
              };
            }
          } else {
            // Regular cell formatting for non-content columns
            cell.value = cellValue;
            cell.font = {
              name: 'Segoe UI',
              size: 10,
              color: { argb: colors.secondary }
            };
          }

          cell.alignment = {
            vertical: 'top',
            horizontal: colIndex === 0 ? 'center' : 'left',
            wrapText: true, // This ensures text wraps to next line
            indent: colIndex === 0 ? 0 : 1
          };

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowIndex % 2 === 0 ? colors.evenRow : colors.oddRow }
          };

          cell.border = {
            top: { style: 'thin', color: { argb: colors.border } },
            left: { style: 'thin', color: { argb: colors.border } },
            bottom: { style: 'thin', color: { argb: colors.border } },
            right: { style: 'thin', color: { argb: colors.border } }
          };

          if (colIndex === 0) {
            cell.font = {
              name: 'Segoe UI',
              size: 10,
              bold: true,
              color: { argb: colors.primary }
            };
          }
        });
      });

      // Enhanced Intelligent row height adjustment
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber >= dataStartRow) {
          let maxLineCount = 1;

          row.eachCell((cell) => {
            if (cell.value) {
              let text = '';

              // Handle both rich text and regular text
              if (cell.value.richText) {
                // For rich text, combine all text segments
                text = cell.value.richText.map(segment => segment.text).join('');
              } else {
                text = String(cell.value);
              }

              if (text) {
                const lineCount = text.split('\n').length;
                const colWidth = worksheet.getColumn(cell.col).width || 10;
                const approxCharsPerLine = Math.floor(colWidth * 2); // Better calculation for wrapped text
                const contentLines = Math.ceil(text.length / approxCharsPerLine);
                maxLineCount = Math.max(maxLineCount, lineCount, contentLines);
              }
            }
          });

          // Calculate height to accommodate ALL content (no max limit to hide content)
          const baseLineHeight = 16; // Height per line of text
          const padding = 16; // Top and bottom padding
          const calculatedHeight = Math.max(30, (maxLineCount * baseLineHeight) + padding);
          // REMOVED max height limit - let it grow as much as needed
          row.height = calculatedHeight;
        }
      });

      // Ensure columns have proper width to accommodate wrapped text
      worksheet.columns = tableHeaders.map((header, index) => {
        let maxLength = header.length;

        tableData.forEach(row => {
          const value = header === "Sr No" ? String(tableData.indexOf(row) + 1) : String(row[header] ?? "");
          if (value) {
            // For content columns, consider the actual content length for better wrapping
            const lines = value.split('\n');
            const maxLineLength = Math.max(...lines.map(line => line.length));
            maxLength = Math.max(maxLength, maxLineLength);
          }
        });

        if (header === "Sr No") return { width: 8 };
        if (index === 0) return { width: 12 };

        // Increased minimum width and added more space for better text wrapping
        const calculatedWidth = Math.min(Math.max(maxLength * 1.3 + 3, 20), 80);
        return { width: calculatedWidth };
      });

      // Smart column width calculation
      worksheet.columns = tableHeaders.map((header, index) => {
        let maxLength = header.length;

        tableData.forEach(row => {
          const value = header === "Sr No" ? String(tableData.indexOf(row) + 1) : String(row[header] ?? "");
          if (value) {
            const lines = value.split('\n');
            const maxLineLength = Math.max(...lines.map(line => line.length));
            maxLength = Math.max(maxLength, maxLineLength);
          }
        });

        if (header === "Sr No") return { width: 8 };
        if (index === 0) return { width: 12 };

        return {
          width: Math.min(Math.max(maxLength * 1.2 + 2, 15), 70)
        };
      });

      // Intelligent row height adjustment
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber >= dataStartRow) {
          let maxLineCount = 1;

          row.eachCell((cell) => {
            if (cell.value) {
              let text = '';

              // Handle both rich text and regular text
              if (cell.value.richText) {
                // For rich text, combine all text segments
                text = cell.value.richText.map(segment => segment.text).join('');
              } else {
                text = String(cell.value);
              }

              if (text) {
                const lineCount = text.split('\n').length;
                const colWidth = worksheet.getColumn(cell.col).width || 10;
                const approxCharsPerLine = Math.floor(colWidth * 2); // Better calculation for wrapped text
                const contentLines = Math.ceil(text.length / approxCharsPerLine);
                maxLineCount = Math.max(maxLineCount, lineCount, contentLines);
              }
            }
          });

          // Calculate height to accommodate ALL content (no max limit to hide content)
          const baseLineHeight = 16; // Height per line of text
          const padding = 16; // Top and bottom padding
          const calculatedHeight = Math.max(30, (maxLineCount * baseLineHeight) + padding);
          // REMOVED max height limit - let it grow as much as needed
          row.height = calculatedHeight;
        }
      });

      // Footer row with summary
      currentRow += 2;
      const footerRow = worksheet.getRow(currentRow);
      footerRow.height = 25;
      worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
      const footerCell = footerRow.getCell(1);
      footerCell.value = `Total Items: ${tableData.length} | Generated by OfficeMoM`;
      footerCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      footerCell.font = {
        name: 'Segoe UI',
        size: 9,
        italic: true,
        color: { argb: 'FF94A3B8' }
      };

      // Freeze panes - REMOVED COLUMN FREEZING
      worksheet.views = [
        {
          state: 'frozen',
          xSplit: 0, // Changed from 1 to 0 to remove column freezing
          ySplit: headerRowNum,
          activeCell: `A${dataStartRow}`,
          showGridLines: true
        }
      ];

      // Add auto-filter for easy sorting
      worksheet.autoFilter = {
        from: { row: headerRowNum, column: 1 },
        to: { row: headerRowNum, column: tableHeaders.length }
      };

      worksheet.properties.showGridLines = true;
      worksheet.properties.tabColor = { argb: colors.primary };

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Error creating Excel file:', error);
      addToast("error", "Failed to create Excel file");
      throw error;
    }
  };

  const attachments = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");

  if (word) {
    try {
      const wordBlob = await createWordFile();
      const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
      saveAs(wordBlob, wordFileName);
      attachments.push({ blob: wordBlob, fileName: wordFileName });
    } catch (error) {
      console.error('Error creating Word file:', error);
      addToast("error", "Failed to create Word file");
    }
  }

  if (excel) {
    try {
      const excelBuffer = await createExcelFile(); // Added await here
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const excelFileName = `Officemom - minutes of the meeting, ${dateStr}.xlsx`;
      saveAs(excelBlob, excelFileName);
      attachments.push({ blob: excelBlob, fileName: excelFileName });
    } catch (error) {
      console.error('Error creating Excel file:', error);
      // Error toast is already shown in createExcelFile
    }
  }

  if (!word && !excel) {
    try {
      const wordBlob = await createWordFile();
      const wordFileName = `Officemom - minutes of the meeting, ${dateStr}.docx`;
      attachments.push({ blob: wordBlob, fileName: wordFileName });
    } catch (error) {
      console.error('Error creating Word file:', error);
      addToast("error", "Failed to create Word file");
    }
  }

  // Only proceed with email if we have attachments
  if (attachments.length > 0) {
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
  } else {
    addToast("error", "No files were created to send");
  }
};