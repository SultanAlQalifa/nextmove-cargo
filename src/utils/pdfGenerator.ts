import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Define types for our data
interface ShipmentData {
  id: string;
  tracking_number: string;
  origin_country: string;
  destination_country: string;
  status: string;
  created_at: string;
  weight_kg: number;
  volume_cbm: number;
  transport_mode: string;
  forwarder: {
    company_name: string;
    full_name?: string;
    email?: string;
  };
  client?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  cargo_details?: {
    description: string;
    value: number;
  };
}

interface InvoiceData {
  shipment: ShipmentData;
  amount: number;
  currency: string;
  items: Array<{ description: string; amount: number }>;
}

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();
  const { shipment, amount, currency, items } = data;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185); // Primary Blue
  doc.text("INVOICE", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice #: INV-${shipment.tracking_number}`, 14, 30);
  doc.text(`Date: ${format(new Date(), "PPP")}`, 14, 35);

  // Company Info (Right side)
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("NextMove Cargo", 140, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("123 Logistics Way", 140, 28);
  doc.text("Guangzhou, China", 140, 33);
  doc.text("support@nextmovecargo.com", 140, 38);

  // Bill To
  doc.text("Bill To:", 14, 50);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(shipment.client?.full_name || "Valued Client", 14, 56);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(shipment.client?.email || "", 14, 61);

  // Shipment Details
  doc.text("Shipment Details:", 140, 50);
  doc.setTextColor(0);
  doc.text(`Tracking: ${shipment.tracking_number}`, 140, 56);
  doc.text(
    `Route: ${shipment.origin_country} -> ${shipment.destination_country}`,
    140,
    61,
  );
  doc.text(`Mode: ${shipment.transport_mode.toUpperCase()}`, 140, 66);

  // Table
  autoTable(doc, {
    startY: 80,
    head: [["Description", "Amount"]],
    body: items.map((item) => [item.description, `${item.amount} ${currency}`]),
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Amount: ${amount} ${currency}`, 140, finalY + 20);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });

  doc.save(`Invoice-${shipment.tracking_number}.pdf`);
};

export const generateWaybill = (shipment: ShipmentData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.text("WAYBILL", 105, 20, { align: "center" });

  // Barcode Placeholder (Visual only)
  doc.setFillColor(0);
  doc.rect(80, 25, 50, 10, "F");
  doc.setFontSize(10);
  doc.text(String(shipment.tracking_number), 105, 40, { align: "center" });

  // Grid Layout
  doc.setLineWidth(0.1);
  doc.line(10, 50, 200, 50); // Top line

  // Sender (Forwarder)
  doc.setFontSize(10);
  doc.text("FROM (Sender/Forwarder):", 15, 60);
  doc.setFontSize(12);
  doc.text(
    shipment.forwarder.company_name ||
      shipment.forwarder.full_name ||
      "Forwarder",
    15,
    68,
  );
  doc.setFontSize(10);
  doc.text(shipment.origin_country, 15, 74);

  // Recipient (Client)
  doc.text("TO (Consignee):", 110, 60);
  doc.setFontSize(12);
  doc.text(shipment.client?.full_name || "Client", 110, 68);
  doc.setFontSize(10);
  doc.text(shipment.destination_country, 110, 74);
  doc.text(shipment.client?.phone || "", 110, 80);

  doc.line(10, 90, 200, 90); // Middle line

  // Cargo Details
  doc.text("Cargo Description:", 15, 100);
  doc.setFontSize(12);
  doc.text(shipment.cargo_details?.description || "General Cargo", 15, 108);

  doc.setFontSize(10);
  doc.text("Weight:", 15, 120);
  doc.text(`${shipment.weight_kg} kg`, 40, 120);

  doc.text("Volume:", 110, 120);
  doc.text(`${shipment.volume_cbm} cbm`, 135, 120);

  doc.text("Service Type:", 15, 130);
  doc.text(shipment.transport_mode.toUpperCase(), 40, 130);

  doc.line(10, 140, 200, 140); // Bottom line

  // Terms
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Terms & Conditions:", 15, 150);
  doc.text("1. This waybill is non-negotiable.", 15, 155);
  doc.text(
    "2. Carrier liability is limited by international conventions.",
    15,
    160,
  );
  doc.text("3. Goods are subject to customs clearance.", 15, 165);

  // Signatures
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text("Sender Signature:", 15, 200);
  doc.line(15, 215, 80, 215);

  doc.text("Receiver Signature:", 110, 200);
  doc.line(110, 215, 175, 215);

  doc.save(`Waybill-${shipment.tracking_number}.pdf`);
};

interface ContractData {
  user: {
    company_name?: string;
    full_name?: string;
    email?: string;
    address?: string;
    country?: string;
  };
  plan: {
    name: string;
    price: number;
    currency: string;
    billing_cycle: string;
  };
}

export const generateSubscriptionContract = (data: ContractData) => {
  const doc = new jsPDF();
  const { user, plan } = data;
  const date = format(new Date(), "PPP");

  // Header
  doc.setFontSize(24);
  doc.setTextColor(41, 128, 185);
  doc.text("CONTRAT D'ABONNEMENT", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Date: ${date}`, 105, 30, { align: "center" });
  doc.text(`Réf: CTR-${Math.floor(Math.random() * 10000)}`, 105, 35, {
    align: "center",
  });

  // Parties
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("ENTRE LES SOUSSIGNÉS :", 15, 50);

  // Provider
  doc.setFontSize(12);
  doc.text("1. NextMove Cargo", 15, 60);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Société de technologie logistique", 20, 66);
  doc.text("123 Logistics Way, Guangzhou, China", 20, 71);
  doc.text('Ci-après dénommé "Le Prestataire"', 20, 76);

  // Subscriber
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(`2. ${user.company_name || user.full_name || "Le Client"}`, 15, 90);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Adresse: ${user.address || "Non renseignée"}`, 20, 96);
  doc.text(`Pays: ${user.country || "Non renseigné"}`, 20, 101);
  doc.text(`Email: ${user.email}`, 20, 106);
  doc.text('Ci-après dénommé "Le Client"', 20, 111);

  // Contract Object
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("IL A ÉTÉ CONVENU CE QUI SUIT :", 15, 130);

  doc.setFontSize(12);
  doc.text("Article 1 : Objet du contrat", 15, 140);
  doc.setFontSize(10);
  doc.text(
    "Le présent contrat a pour objet la souscription aux services de la plateforme NextMove Cargo.",
    15,
    146,
  );

  doc.setFontSize(12);
  doc.text("Article 2 : Détails de l'abonnement", 15, 156);
  doc.setFontSize(10);
  doc.text(`Plan souscrit : ${plan.name}`, 15, 162);
  doc.text(
    `Prix : ${plan.price} ${plan.currency} / ${plan.billing_cycle === "monthly" ? "Mois" : "An"}`,
    15,
    167,
  );

  doc.setFontSize(12);
  doc.text("Article 3 : Durée et Résiliation", 15, 180);
  doc.setFontSize(10);
  doc.text(
    "L'abonnement est conclu pour une durée indéterminée avec tacite reconduction.",
    15,
    186,
  );
  doc.text("Il peut être résilié à tout moment via l'espace client.", 15, 191);

  // Signatures
  doc.setFontSize(12);
  doc.text("Fait en deux exemplaires originaux.", 15, 220);

  doc.text("Pour Le Prestataire", 15, 240);
  doc.text("NextMove Cargo", 15, 250);
  doc.setTextColor(150);
  doc.text("(Signature électronique)", 15, 260);

  doc.setTextColor(0);
  doc.text("Pour Le Client", 110, 240);
  doc.text(user.company_name || user.full_name || "Client", 110, 250);
  doc.setTextColor(150);
  doc.text("(Signature électronique)", 110, 260);

  doc.save(`Contrat_Abonnement_${plan.name}.pdf`);
};

export const generateSubscriptionInvoice = (data: ContractData) => {
  const doc = new jsPDF();
  const { user, plan } = data;
  const date = new Date();
  const invoiceNumber = `INV-SUB-${Math.floor(Math.random() * 100000)}`;

  // Calculate amounts
  const baseAmount = plan.price;
  const fees = baseAmount * 0.01;
  const subtotal = baseAmount + fees;
  const vat = subtotal * 0.18;
  const totalAmount = Math.round(subtotal + vat);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185); // Primary Blue
  doc.text("FACTURE", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Facture N°: ${invoiceNumber}`, 14, 30);
  doc.text(`Date: ${format(date, "PPP")}`, 14, 35);

  // Company Info (Right side)
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("NextMove Cargo", 140, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("123 Logistics Way", 140, 28);
  doc.text("Guangzhou, China", 140, 33);
  doc.text("support@nextmovecargo.com", 140, 38);

  // Bill To
  doc.text("Facturé à :", 14, 50);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(user.company_name || user.full_name || "Client", 14, 56);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(user.email || "", 14, 61);
  doc.text(user.address || "", 14, 66);
  doc.text(user.country || "", 14, 71);

  // Table
  autoTable(doc, {
    startY: 80,
    head: [["Description", "Montant"]],
    body: [
      [
        `Abonnement ${plan.name} (${plan.billing_cycle === "monthly" ? "Mensuel" : "Annuel"})`,
        `${baseAmount.toLocaleString()} ${plan.currency}`,
      ],
      [
        "Frais de transaction (1%)",
        `${fees.toLocaleString()} ${plan.currency}`,
      ],
      ["TVA (18%)", `${vat.toLocaleString()} ${plan.currency}`],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(
    `Total à payer: ${totalAmount.toLocaleString()} ${plan.currency}`,
    140,
    finalY + 20,
  );

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Merci de votre confiance !", 105, 280, { align: "center" });

  doc.save(`Facture_${invoiceNumber}.pdf`);
};
