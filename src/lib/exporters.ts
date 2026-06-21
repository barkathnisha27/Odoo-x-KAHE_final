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

export function downloadOrderBillPDF(order: any) {
  try {
    if (!order) {
      throw new Error("Order not found");
    }

    const doc = new jsPDF();

    const items = Array.isArray(order.items) ? order.items : [];

    const rows = items.map((item: any, index: number) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || item.price || 0);
      const subtotal = Number(item.subtotal || quantity * unitPrice);

      return [
        index + 1,
        item.product_name || item.name || "Item",
        quantity,
        `Rs. ${unitPrice.toFixed(2)}`,
        `Rs. ${subtotal.toFixed(2)}`
      ];
    });

    const subtotal = Number(order.subtotal || rows.reduce((sum: number, row: any, index: number) => {
      const item = items[index];
      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.unit_price || item?.price || 0);
      return sum + quantity * unitPrice;
    }, 0));

    const discount = Number(order.discount_amount || order.discount || 0);
    const tax = Number(order.tax_amount || order.tax || 0);
    const total = Number(order.total_amount || order.total || subtotal - discount + tax);

    doc.setFontSize(18);
    doc.text("DineFlow Receipt", 14, 20);

    doc.setFontSize(11);
    doc.text(`Order: ${order.order_number || order.id || "N/A"}`, 14, 30);
    doc.text(`Date: ${new Date(order.created_at || Date.now()).toLocaleString()}`, 14, 38);
    doc.text(`Table: ${order.table_number || order.table_id || "N/A"}`, 14, 46);
    doc.text(`Customer: ${order.customer_name || "Walk-in Customer"}`, 14, 54);
    doc.text(`Payment: ${order.payment_method || order.payment_status || "Pending"}`, 14, 62);

    if ((doc as any).autoTable) {
      (doc as any).autoTable({
        startY: 70,
        head: [["#", "Item", "Qty", "Unit Price", "Subtotal"]],
        body: rows
      });
    } else {
      let y = 75;
      doc.text("#  Item  Qty  Unit Price  Subtotal", 14, y);
      rows.forEach((row: any) => {
        y += 8;
        doc.text(row.join("   "), 14, y);
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 120;

    doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Discount: Rs. ${discount.toFixed(2)}`, 14, finalY + 18);
    doc.text(`Tax: Rs. ${tax.toFixed(2)}`, 14, finalY + 26);
    doc.setFontSize(14);
    doc.text(`Total: Rs. ${total.toFixed(2)}`, 14, finalY + 38);

    doc.setFontSize(11);
    doc.text("Thank you for ordering with DineFlow!", 14, finalY + 50);

    const fileName = `dineflow_bill_${order.order_number || order.id || Date.now()}.pdf`;
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error("Bill PDF download failed:", error);
    return false;
  }
}
