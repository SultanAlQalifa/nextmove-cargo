import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  client: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  shipment: {
    trackingNumber: string;
    origin: string;
    destination: string;
    weight: string;
    volume?: string;
    packages: number;
  };
  items: Array<{
    description: string;
    amount: number;
  }>;
  total: number;
  currency: string;
  status: string;
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Define brand colors
  const primaryColor = [37, 99, 235]; // Blue-600
  const grayColor = [107, 114, 128]; // Gray-500

  // --- HEADER ---
  // Logo (Simulated with text for now, replaced with image in production if available)
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("NextMove", 20, 20);
  doc.setTextColor(0, 0, 0);
  doc.text("Cargo", 62, 20);

  // Company Info
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont("helvetica", "normal");
  doc.text("123 Avenue de la Logistique", 20, 30);
  doc.text("Dakar, Sénégal", 20, 35);
  doc.text("Tél: +221 77 000 00 00", 20, 40);
  doc.text("Email: contact@nextmove-cargo.com", 20, 45);

  // Invoice Label
  doc.setFontSize(30);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", pageWidth - 20, 30, { align: "right" });

  // Invoice Details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Facture: ${data.invoiceNumber}`, pageWidth - 20, 45, {
    align: "right",
  });
  doc.text(
    `Date: ${format(data.date, "dd MMMM yyyy", { locale: fr })}`,
    pageWidth - 20,
    50,
    { align: "right" },
  );
  doc.text(`Expédition: ${data.shipment.trackingNumber}`, pageWidth - 20, 55, {
    align: "right",
  });

  // --- CLIENT INFO ---
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 65, pageWidth - 20, 65);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Facturé à :", 20, 75);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(data.client.name, 20, 82);
  doc.setFont("helvetica", "normal");
  if (data.client.address) doc.text(data.client.address, 20, 87);
  if (data.client.phone) doc.text(data.client.phone, 20, 92);
  if (data.client.email) doc.text(data.client.email, 20, 97);

  // --- SHIPMENT DETAILS ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Détails Expédition :", pageWidth / 2 + 10, 75);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Origine: ${data.shipment.origin}`, pageWidth / 2 + 10, 82);
  doc.text(`Destination: ${data.shipment.destination}`, pageWidth / 2 + 10, 87);
  doc.text(`Poids: ${data.shipment.weight}`, pageWidth / 2 + 10, 92);
  doc.text(`Colis: ${data.shipment.packages}`, pageWidth / 2 + 10, 97);

  // --- TABLE ---
  // @ts-ignore
  doc.autoTable({
    startY: 110,
    head: [["Description", "Montant"]],
    body: data.items.map((item) => [
      item.description,
      `${item.amount.toLocaleString("fr-FR")} ${data.currency}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 50, ha: "right" },
    },
  });

  // --- TOTALS ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.text("Sous-total:", pageWidth - 60, finalY);
  doc.text(
    `${data.total.toLocaleString("fr-FR")} ${data.currency}`,
    pageWidth - 20,
    finalY,
    { align: "right" },
  );

  doc.text("TVA (18%):", pageWidth - 60, finalY + 5);
  const tax = data.total * 0.18; // Example tax logic
  doc.text(
    `${tax.toLocaleString("fr-FR")} ${data.currency}`,
    pageWidth - 20,
    finalY + 5,
    { align: "right" },
  );

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Total à Payer:", pageWidth - 60, finalY + 15);
  doc.text(
    `${(data.total + tax).toLocaleString("fr-FR")} ${data.currency}`,
    pageWidth - 20,
    finalY + 15,
    { align: "right" },
  );

  // --- FOOTER ---
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont("helvetica", "italic");
  doc.text("Merci de votre confiance.", 20, finalY + 40);
  doc.text(
    "Ce document est une facture générée par ordinateur et est valide sans signature.",
    20,
    finalY + 45,
  );

  // Save
  doc.save(`Facture_${data.invoiceNumber}.pdf`);
};
