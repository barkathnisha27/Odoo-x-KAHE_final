import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToXLSX(filename: string, sheets: { name: string; rows: Record<string, unknown>[] }[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(filename: string, title: string, sections: { heading: string; columns: string[]; rows: (string | number)[][] }[]) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()} · DineFlow`, 14, 25);

  let y = 32;
  for (const sec of sections) {
    doc.setFontSize(13);
    doc.setTextColor(40);
    doc.text(sec.heading, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [sec.columns],
      body: sec.rows,
      theme: "striped",
      headStyles: { fillColor: [139, 111, 71] },
      styles: { fontSize: 9 },
    });
    // @ts-expect-error lastAutoTable injected by autotable
    y = doc.lastAutoTable.finalY + 10;
    if (y > 260) { doc.addPage(); y = 20; }
  }
  doc.save(`${filename}.pdf`);
}
