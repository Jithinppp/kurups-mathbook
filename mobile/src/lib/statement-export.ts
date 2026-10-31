import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  buildStatementHtml,
  statementFileName,
  statementWorkbookRows,
  type AccountStatement,
} from "@asharibook/shared";

export async function shareStatementPdf(statement: AccountStatement) {
  const html = buildStatementHtml(statement);

  if (Platform.OS === "web") {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Allow pop-ups to open the statement.");
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: statementFileName(statement, "pdf"),
    UTI: "com.adobe.pdf",
  });
}

export async function shareStatementXls(statement: AccountStatement) {
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
  const fileName = statementFileName(statement, "xls");

  if (Platform.OS === "web") {
    const output = XLSX.write(workbook, { bookType: "xls", type: "array" });
    const blob = new Blob([output], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 2000);
    return;
  }

  const base64 = XLSX.write(workbook, { bookType: "xls", type: "base64" });
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(base64, { encoding: "base64" });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/vnd.ms-excel",
    dialogTitle: fileName,
  });
}
