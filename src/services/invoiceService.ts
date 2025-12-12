import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    status: "paid" | "pending" | "overdue";
    sender: {
        name: string;
        address: string[];
        email: string;
        phone: string;
    };
    client: {
        name: string;
        address: string[];
        email?: string;
        phone?: string;
    };
    items: {
        description: string;
        quantity: number;
        price: number;
        total: number;
    }[];
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    currency: string;
    notes?: string;
}

export const invoiceService = {
    generateInvoice: async (data: InvoiceData) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const primaryColor = "#111827"; // Gray 900
        const accentColor = "#3B82F6"; // Blue 500

        // --- Header ---
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("NextMove Cargo", 20, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Transport & Logistique Simplifiés", 20, 26);

        // Invoice Label & Status
        doc.setFontSize(30);
        doc.setTextColor(200);
        doc.text(data.status === "paid" ? "REÇU" : "FACTURE", pageWidth - 20, 25, {
            align: "right",
        });

        // Divider
        doc.setLineWidth(0.5);
        doc.setDrawColor(220);
        doc.line(20, 35, pageWidth - 20, 35);

        // --- QR Code ---
        try {
            // Create a verification URL (pointing to the shipment detail page or a public verify page)
            // For now, we point to the shipment detail in the dashboard
            const qrData = `${window.location.origin}/dashboard/client/shipments?search=${data.invoiceNumber}`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
            doc.addImage(qrCodeDataUrl, "PNG", pageWidth - 45, 12, 25, 25);
        } catch (err) {
            console.warn("Failed to generate QR code", err);
        }

        // --- Meta Data (Right Side) ---
        let y = 45;
        const rightColX = pageWidth - 80;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Numéro:", rightColX, y);
        doc.setTextColor(primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(data.invoiceNumber, pageWidth - 20, y, { align: "right" });
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Date:", rightColX, y);
        doc.setTextColor(primaryColor);
        doc.text(data.date, pageWidth - 20, y, { align: "right" });
        y += 6;

        if (data.status !== "paid") {
            doc.setTextColor(100);
            doc.text("Échéance:", rightColX, y);
            doc.setTextColor(primaryColor);
            doc.text(data.dueDate, pageWidth - 20, y, { align: "right" });
        }

        // --- Sender & Client (Left Side) ---
        y = 45;
        // Sender
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("De:", 20, y);
        doc.setTextColor(primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(data.sender.name, 20, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);
        data.sender.address.forEach((line, i) => {
            doc.text(line, 20, y + 10 + i * 5);
        });
        const senderHeight = 10 + data.sender.address.length * 5;

        // Client
        y += senderHeight + 10;
        doc.setTextColor(100);
        doc.text("À:", 20, y);
        doc.setTextColor(primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(data.client.name, 20, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);
        data.client.address.forEach((line, i) => {
            doc.text(line, 20, y + 10 + i * 5);
        });

        const startTableY = Math.max(y + 25, 100);

        // --- Items Table ---
        const tableHeaders = [
            ["DESIGNATION", "QTE", "P. UNITAIRE", "TOTAL"],
        ];

        const tableData = data.items.map((item) => [
            item.description,
            item.quantity,
            new Intl.NumberFormat("fr-FR").format(item.price) + " " + data.currency,
            new Intl.NumberFormat("fr-FR").format(item.total) + " " + data.currency,
        ]);

        autoTable(doc, {
            startY: startTableY,
            head: tableHeaders,
            body: tableData,
            theme: "plain",
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontSize: 9,
                fontStyle: "bold",
                halign: "left",
            },
            styles: {
                fontSize: 10,
                cellPadding: 5,
                valign: "middle",
            },
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { cellWidth: 20, halign: "center" },
                2: { cellWidth: 35, halign: "right" },
                3: { cellWidth: 35, halign: "right" },
            },
        });

        // --- Totals ---
        // @ts-ignore
        let finalY = doc.lastAutoTable.finalY + 10;
        const totalsX = pageWidth - 90;
        const valuesX = pageWidth - 20;

        // Subtotal
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Sous-total:", totalsX, finalY);
        doc.setTextColor(primaryColor);
        doc.text(
            new Intl.NumberFormat("fr-FR").format(data.subtotal) + " " + data.currency,
            valuesX,
            finalY,
            { align: "right" }
        );
        finalY += 7;

        // Tax (if any)
        if (data.tax > 0) {
            doc.setTextColor(100);
            doc.text("Taxes:", totalsX, finalY);
            doc.setTextColor(primaryColor);
            doc.text(
                new Intl.NumberFormat("fr-FR").format(data.tax) + " " + data.currency,
                valuesX,
                finalY,
                { align: "right" }
            );
            finalY += 7;
        }

        // Discount (if any)
        if (data.discount && data.discount > 0) {
            doc.setTextColor(100);
            doc.text("Réduction:", totalsX, finalY);
            doc.setTextColor("#10B981"); // Green
            doc.text(
                "-" + new Intl.NumberFormat("fr-FR").format(data.discount) + " " + data.currency,
                valuesX,
                finalY,
                { align: "right" }
            );
            finalY += 7;
        }

        // Divider
        doc.setDrawColor(220);
        doc.line(totalsX, finalY, pageWidth - 20, finalY);
        finalY += 5;

        // Total
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor);
        doc.text("TOTAL:", totalsX, finalY + 2);
        doc.text(
            new Intl.NumberFormat("fr-FR").format(data.total) + " " + data.currency,
            valuesX,
            finalY + 2,
            { align: "right" }
        );

        // --- Footer ---
        const footerY = doc.internal.pageSize.getHeight() - 30;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);

        // Notes
        if (data.notes) {
            doc.text("Notes:", 20, finalY + 20);
            doc.setTextColor(100);
            doc.text(data.notes, 20, finalY + 26);
        }

        doc.text(
            "NextMove Cargo - Merci de votre confiance.",
            pageWidth / 2,
            footerY,
            { align: "center" }
        );
        doc.text(
            "Siège social : [Adresse du siège] - Email : support@nextmovecargo.com",
            pageWidth / 2,
            footerY + 5,
            { align: "center" }
        );

        // Save
        doc.save(`facture-${data.invoiceNumber}.pdf`);
    },
};
