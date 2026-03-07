import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Shipment } from "./shipmentService";

export const labelService = {
    /**
     * Generates a thermal label PDF (4x6 format / 101.6 x 152.4 mm)
     */
    generateLabel: async (shipment: Shipment) => {
        // 4x6 inches in mm is ~101.6 x 152.4
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [101.6, 152.4]
        });

        const width = 101.6;
        const margin = 5;

        // 1. Header Area
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, width, 25, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("NEXTMOVE CARGO", width / 2, 15, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("LOGISTIQUE CHINE - AFRIQUE", width / 2, 21, { align: "center" });

        // 2. Tracking Number Area (BOLD)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text("NUMÉRO DE SUIVI / TRACKING #", margin, 35);

        doc.setFontSize(32);
        doc.setFont("helvetica", "bold");
        doc.text(shipment.tracking_number, margin, 50);

        // 3. QR code
        try {
            const trackingUrl = `https://nextmove-cargo.com/tracking?n=${shipment.tracking_number}`;
            const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
                margin: 1,
                width: 200,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            doc.addImage(qrDataUrl, "PNG", width - 45, 30, 40, 40);
        } catch (err) {
            console.error("QR Code generation failed", err);
        }

        // Horizontal Line
        doc.setLineWidth(1);
        doc.line(margin, 72, width - margin, 72);

        // 4. Destination & Mode
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("DESTINATION:", margin, 85);

        doc.setFontSize(36);
        doc.setFont("helvetica", "bold");
        doc.text(shipment.destination.country.toUpperCase(), margin, 100);

        // Mode Badge
        const modeColor = shipment.transport_mode === 'air' ? [14, 165, 233] : [79, 70, 229]; // sky-500 vs indigo-600
        doc.setFillColor(modeColor[0], modeColor[1], modeColor[2]);
        doc.rect(width - 50, 85, 45, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(shipment.transport_mode === 'air' ? "AÉRIEN" : "MARITIME", width - 27.5, 95, { align: "center" });

        doc.setTextColor(0, 0, 0);

        // 5. Details (Weight, Volume, Packages)
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Colis: ${shipment.cargo.packages || 1}`, margin, 115);
        doc.text(`Poids: ${shipment.cargo.weight} KG`, margin, 122);
        doc.text(`Volume: ${shipment.cargo.volume} CBM`, margin, 129);
        doc.text(`Service: ${shipment.service_type === 'express' ? 'EXPRESS' : 'STANDARD'}`, margin, 136);

        // 6. Recipient / Client (Small)
        doc.setFontSize(10);
        doc.text("EXPÉDITEUR / DESTINATAIRE:", margin, 145);
        doc.setFont("helvetica", "bold");
        doc.text(shipment.client?.full_name || "Client Passager", margin, 150);

        // Footer small text
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`Généré le: ${new Date().toLocaleString()}`, width - margin, 150, { align: "right" });

        // 7. Final Action
        const pdfBlobUrl = doc.output("bloburl");
        window.open(pdfBlobUrl, "_blank");
        return pdfBlobUrl;
    }
};
