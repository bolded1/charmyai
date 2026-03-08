import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  fileName: string;
  summaryRows?: { label: string; value: string }[];
}

export function exportToPdf({ title, subtitle, headers, rows, fileName, summaryRows }: ExportPdfOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Brand header bar
  doc.setFillColor(79, 70, 229); // primary violet
  doc.rect(0, 0, pageWidth, 18, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 12);

  // Subtitle (date, filters)
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth - 14, 12, { align: "right" });
  }

  // Generated date
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 25);

  // Record count
  doc.text(`${rows.length} record${rows.length !== 1 ? "s" : ""}`, pageWidth - 14, 25, { align: "right" });

  // Summary row if provided
  let startY = 30;
  if (summaryRows && summaryRows.length > 0) {
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(14, startY, pageWidth - 28, 12, 2, 2, "F");

    const boxWidth = (pageWidth - 28) / summaryRows.length;
    summaryRows.forEach((s, i) => {
      const x = 14 + boxWidth * i + boxWidth / 2;
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7);
      doc.text(s.label, x, startY + 4.5, { align: "center" });
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(s.value, x, startY + 9.5, { align: "center" });
      doc.setFont("helvetica", "normal");
    });
    startY += 17;
  }

  // Table
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 252],
    },
    styles: {
      lineColor: [220, 220, 230],
      lineWidth: 0.3,
      overflow: "linebreak",
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text("Charmy · Automated Financial Document Processing", 14, pageHeight - 8);
      const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.text(`Page ${pageNum}`, pageWidth - 14, pageHeight - 8, { align: "right" });
    },
  });

  doc.save(fileName);
}
