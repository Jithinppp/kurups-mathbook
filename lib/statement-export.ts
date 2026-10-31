import type { AccountStatement } from "@asharibook/shared";
import type { RowInput } from "jspdf-autotable";
import {
  formatDate,
  formatNumber,
  statementFileName,
  statementRowDescription,
  statementWorkbookRows,
} from "@asharibook/shared";

const BRAND: [number, number, number] = [113, 50, 245];
const INK: [number, number, number] = [16, 17, 20];
const MUTED: [number, number, number] = [104, 107, 130];
const SUBTLE: [number, number, number] = [148, 151, 169];
const LINE: [number, number, number] = [236, 236, 242];
const CANVAS: [number, number, number] = [250, 250, 252];

export async function createStatementPdf(statement: AccountStatement) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(...BRAND);
  doc.roundedRect(margin, margin - 16, contentWidth, 7, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text("AshariBook", margin, margin + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text("Account statement", margin, margin + 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(statement.periodLabel, margin, margin + 53);

  doc.setFontSize(8);
  doc.setTextColor(...SUBTLE);
  doc.text(`Generated ${statement.generatedOn}`, pageWidth - margin, margin + 18, {
    align: "right",
  });

  const detailsTop = margin + 68;
  const detailRows: [string, string][] = [
    ["Account holder", statement.holderName],
    ["Account", statement.accountName],
    ["Account type", statement.accountTypeLabel],
  ];
  if (statement.institution) {
    detailRows.push(["Institution", statement.institution]);
  }
  if (statement.accountNumber) {
    detailRows.push(["Account number", statement.accountNumber]);
  }
  detailRows.push(["Currency", statement.currency]);
  const detailsHeight = 24 + Math.ceil(detailRows.length / 2) * 22;
  doc.setFillColor(...CANVAS);
  doc.setDrawColor(...LINE);
  doc.roundedRect(margin, detailsTop, contentWidth, detailsHeight, 10, 10, "FD");

  const detailColumnWidth = contentWidth / 2;

  detailRows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + 16 + column * detailColumnWidth;
    const y = detailsTop + 20 + row * 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SUBTLE);
    doc.text(label, x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(value, detailColumnWidth - 32)[0] ?? "", x, y + 11);
  });

  const summaryTop = detailsTop + detailsHeight + 14;
  const summaryGap = 8;
  const summaryWidth = (contentWidth - summaryGap * 3) / 4;
  const summaryHeight = 52;
  const summaryItems: {
    label: string;
    value: number;
    tone: [number, number, number];
  }[] = [
    { label: "Opening balance", value: statement.openingBalance, tone: INK },
    { label: "Total debits", value: statement.totalDebits, tone: [180, 35, 24] },
    { label: "Total credits", value: statement.totalCredits, tone: [14, 122, 77] },
    { label: "Closing balance", value: statement.closingBalance, tone: INK },
  ];

  summaryItems.forEach((item, index) => {
    const x = margin + index * (summaryWidth + summaryGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LINE);
    doc.roundedRect(x, summaryTop, summaryWidth, summaryHeight, 8, 8, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SUBTLE);
    doc.text(item.label.toUpperCase(), x + 9, summaryTop + 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...item.tone);
    doc.text(
      `${statement.currency} ${formatNumber(item.value, 2)}`,
      x + 9,
      summaryTop + 34,
    );
  });

  const head = [
    [
      "Date",
      "Description",
      "Category",
      `Debit (${statement.currency})`,
      `Credit (${statement.currency})`,
      `Balance (${statement.currency})`,
    ],
  ];
  const body: RowInput[] = statement.rows.length
    ? statement.rows.map((row) => [
        formatDate(row.date, "long"),
        statementRowDescription(row),
        row.category,
        row.debit === null ? "" : formatNumber(row.debit, 2),
        row.credit === null ? "" : formatNumber(row.credit, 2),
        formatNumber(row.balance, 2),
      ])
    : [
        [
          {
            content: "No transactions in this period.",
            colSpan: 6,
            styles: { halign: "center", textColor: SUBTLE },
          },
        ],
      ];

  autoTable(doc, {
    startY: summaryTop + summaryHeight + 18,
    head,
    body,
    margin: { left: margin, right: margin, bottom: 40 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 6,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 7,
    },
    alternateRowStyles: {
      fillColor: CANVAS,
    },
    columnStyles: {
      0: { cellWidth: 68, textColor: MUTED },
      1: { minCellWidth: 120 },
      2: { cellWidth: 76 },
      3: { cellWidth: 64, halign: "right" },
      4: { cellWidth: 64, halign: "right" },
      5: { cellWidth: 66, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SUBTLE);
    doc.text(
      `AshariBook · ${statement.accountName} · ${statement.periodLabel}`,
      margin,
      pageHeight - 22,
    );
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 22, {
      align: "right",
    });
  }

  return doc;
}

export async function downloadStatementPdf(statement: AccountStatement) {
  const doc = await createStatementPdf(statement);
  downloadBlob(
    doc.output("blob"),
    statementFileName(statement, "pdf"),
  );
}

export async function downloadStatementXls(statement: AccountStatement) {
  const XLSX = await import("xlsx");
  const rows = statementWorkbookRows(statement);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 44 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  const firstTransactionRow = rows.findIndex(
    (row) => row[0] === "Date" && row[1] === "Description",
  );
  if (firstTransactionRow >= 0) {
    for (let rowIndex = firstTransactionRow + 1; rowIndex < rows.length; rowIndex += 1) {
      for (let columnIndex = 3; columnIndex <= 5; columnIndex += 1) {
        const cell = worksheet[
          XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
        ];
        if (cell && typeof cell.v === "number") {
          cell.z = "#,##0.00";
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Statement");
  const output = XLSX.write(workbook, { bookType: "xls", type: "array" });
  const blob = new Blob([output], { type: "application/vnd.ms-excel" });
  downloadBlob(blob, statementFileName(statement, "xls"));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  // Give the browser time to start the download before releasing the blob.
  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 2000);
}
