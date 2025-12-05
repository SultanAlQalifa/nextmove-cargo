import { useState } from 'react';
import { X, Download, Printer, Share2, Package, MapPin, Calendar, CreditCard, Truck, Percent, Loader2, CheckCircle2, ShieldCheck, Building2, Mail, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../contexts/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShipmentInvoiceModalProps {
    shipmentId: string;
    onClose: () => void;
}

export default function ShipmentInvoiceModal({ shipmentId, onClose }: ShipmentInvoiceModalProps) {
    const { success } = useToast();
    const [includeTax, setIncludeTax] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [processingStep, setProcessingStep] = useState('');

    // Mock Invoice Data with XOF values
    const invoice = {
        id: `FACT-${shipmentId.split('-')[1]}`,
        date: new Date().toLocaleDateString('fr-FR'),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toLocaleDateString('fr-FR'),
        deliveryMethod: 'delivery', // 'pickup' or 'delivery'
        sender: {
            name: 'NextMove Cargo',
            address: '123 Voie de la Logistique, Dakar, Sénégal',
            email: 'facturation@nextmove.com',
            phone: '+221 77 000 00 00'
        },
        forwarder: {
            name: 'Global Freight Solutions',
            address: 'Zone Fret, Aéroport AIBD, Sénégal',
            email: 'contact@gfs-logistics.com',
            phone: '+221 77 123 45 67'
        },
        client: {
            name: 'Client 1',
            address: '456 Parc d\'Affaires, Paris, France',
            email: 'client@exemple.com',
            phone: '+33 1 23 45 67 89'
        },
        items: [
            { description: 'Fret Aérien (517 kg)', quantity: 1, price: 2500000, total: 2500000, type: 'service' },
            { description: 'Assurance (Garantie Plateforme)', quantity: 1, price: 50000, total: 50000, type: 'platform' },
            { description: 'Livraison à Domicile', quantity: 1, price: 75000, total: 75000, type: 'service' }
        ],
        subtotal: 2625000,
        taxRate: 0.18
    };

    // Filter items based on delivery method
    const displayItems = invoice.items.filter(item => {
        if (invoice.deliveryMethod === 'pickup' && item.description.includes('Livraison')) return false;
        return true;
    });

    const calculatedSubtotal = displayItems.reduce((acc, item) => acc + item.total, 0);
    const calculatedTax = includeTax ? calculatedSubtotal * invoice.taxRate : 0;
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-XO', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    // Actions
    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const doc = new jsPDF();

        // Brand Header Background
        doc.setFillColor(30, 58, 138); // Primary Blue
        doc.rect(0, 0, 210, 40, 'F');

        // Title
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('FACTURE', 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text(`N° ${invoice.id}`, 14, 32);

        // Company Info (Right side of header)
        doc.setFontSize(16);
        doc.text('NextMove Cargo', 150, 20);
        doc.setFontSize(10);
        doc.text('Dakar, Sénégal', 150, 26);

        // Details Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Date d'émission: ${invoice.date}`, 14, 50);
        doc.text(`Date d'échéance: ${invoice.dueDate}`, 14, 55);

        // Addresses Grid
        const startY = 65;

        // Emitter
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text('ÉMETTEUR', 14, startY);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(invoice.sender.name, 14, startY + 6);
        doc.text(invoice.sender.email, 14, startY + 11);
        doc.text(invoice.sender.phone, 14, startY + 16);

        // Forwarder
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text('TRANSITAIRE', 80, startY);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(invoice.forwarder.name, 80, startY + 6);
        doc.text(invoice.forwarder.email, 80, startY + 11);
        doc.text(invoice.forwarder.phone, 80, startY + 16);

        // Client
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text('FACTURÉ À', 150, startY);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(invoice.client.name, 150, startY + 6);
        doc.text(invoice.client.address, 150, startY + 11);
        doc.text(invoice.client.email, 150, startY + 16);

        // Table
        autoTable(doc, {
            startY: 100,
            head: [['Description', 'Qté', 'Prix Unit.', 'Total']],
            body: displayItems.map(item => [
                item.description,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.total)
            ]),
            headStyles: { fillColor: [30, 58, 138], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.text(`Sous-total: ${formatCurrency(calculatedSubtotal)}`, 140, finalY + 10);
        if (includeTax) {
            doc.text(`TVA (18%): ${formatCurrency(calculatedTax)}`, 140, finalY + 15);
        }

        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.text(`Total: ${formatCurrency(calculatedTotal)}`, 140, finalY + 25);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Merci de votre confiance. Conditions de paiement : 30 jours.', 14, 280);

        doc.save(`Facture-${invoice.id}.pdf`);
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(`https://nextmove.com/invoice/${invoice.id}`);
            success('Lien de la facture copié dans le presse-papier !');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handlePay = async () => {
        setPaymentStatus('processing');

        setProcessingStep('Connexion à la passerelle de paiement...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setProcessingStep('Vérification des informations...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setProcessingStep('Traitement de la transaction...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setPaymentStatus('success');
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:fixed print:inset-0">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:rounded-none relative">

                {/* Payment Overlay */}
                {paymentStatus !== 'idle' && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                        {paymentStatus === 'processing' ? (
                            <div className="text-center space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full animate-spin mx-auto"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Paiement Sécurisé</h3>
                                    <p className="text-sm text-gray-500 animate-pulse">{processingStep}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-6 animate-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Paiement Effectué !</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto">
                                        Votre transaction de <span className="font-bold text-gray-900">{formatCurrency(calculatedTotal)}</span> a été validée avec succès.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 w-64 mx-auto">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Télécharger le reçu
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Header Actions - Hidden in Print */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 print:hidden">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Facture Proforma</span>
                        <span>•</span>
                        <span>{invoice.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIncludeTax(!includeTax)}
                            className={`p-2 rounded-full transition-colors ${includeTax ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-500'}`}
                            title={includeTax ? "Désactiver la TVA" : "Activer la TVA"}
                        >
                            <Percent className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Imprimer">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={handleDownload} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Télécharger">
                            <Download className="w-5 h-5" />
                        </button>
                        <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Partager">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 bg-gray-50/30 print:bg-white print:overflow-visible">
                    {/* Invoice Design */}
                    <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-full print:shadow-none">
                        {/* Brand Header */}
                        <div className="bg-[#1e3a8a] text-white p-8 print:p-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                        <Package className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">NextMove Cargo</h1>
                                        <p className="text-blue-200 text-sm">Logistique & Transport International</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-bold opacity-90">FACTURE</h2>
                                    <p className="text-blue-200 mt-1">#{invoice.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 print:p-8">
                            {/* Info Bar */}
                            <div className="flex justify-between items-center mb-12 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date d'émission</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {invoice.date}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date d'échéance</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {invoice.dueDate}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                                        <Truck className="w-4 h-4" />
                                        {invoice.deliveryMethod === 'delivery' ? 'Livraison à Domicile' : 'Retrait en Agence'}
                                    </div>
                                </div>
                            </div>

                            {/* Addresses Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 print:grid-cols-3">
                                {/* Emitter */}
                                <div className="p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Building2 className="w-3 h-3" /> Émetteur
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="font-bold text-gray-900 text-base">{invoice.sender.name}</p>
                                        <p className="flex items-start gap-2">
                                            <MapPin className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                            {invoice.sender.address}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            {invoice.sender.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            {invoice.sender.phone}
                                        </p>
                                    </div>
                                </div>

                                {/* Forwarder */}
                                <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/30 hover:shadow-md transition-shadow">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Truck className="w-3 h-3" /> Transitaire
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="font-bold text-gray-900 text-base">{invoice.forwarder.name}</p>
                                        <p className="flex items-start gap-2">
                                            <MapPin className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                            {invoice.forwarder.address}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            {invoice.forwarder.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            {invoice.forwarder.phone}
                                        </p>
                                    </div>
                                </div>

                                {/* Client */}
                                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-shadow">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Building2 className="w-3 h-3" /> Facturé à
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="font-bold text-gray-900 text-base">{invoice.client.name}</p>
                                        <p className="flex items-start gap-2">
                                            <MapPin className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                            {invoice.client.address}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            {invoice.client.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            {invoice.client.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="rounded-2xl border border-gray-200 overflow-hidden mb-8">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Qté</th>
                                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Prix Unit.</th>
                                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {displayItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                                                    {item.description}
                                                    {item.type === 'platform' && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide print:border print:border-purple-200">
                                                            NextMove Protect
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm text-gray-600">{item.quantity}</td>
                                                <td className="py-4 px-6 text-right text-sm text-gray-600">{formatCurrency(item.price)}</td>
                                                <td className="py-4 px-6 text-right text-sm text-gray-900 font-bold">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Section: QR & Totals */}
                            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                                <div className="print:hidden">
                                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm inline-block">
                                        <QRCodeSVG value={`https://nextmove.com/invoice/${invoice.id}`} size={100} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center font-medium">Scanner pour payer</p>
                                </div>

                                <div className="w-full md:w-80 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Sous-total</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(calculatedSubtotal)}</span>
                                    </div>
                                    {includeTax && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                TVA (18%)
                                                <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">PLATEFORME</span>
                                            </span>
                                            <span className="font-medium text-gray-900">{formatCurrency(calculatedTax)}</span>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t-2 border-gray-100 flex justify-between items-end">
                                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total à payer</span>
                                        <span className="text-2xl font-bold text-primary">{formatCurrency(calculatedTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Hidden in Print */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center print:hidden">
                    <p className="text-xs text-gray-400">Merci de votre confiance. Conditions de paiement : 30 jours.</p>
                    <button
                        onClick={handlePay}
                        className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 font-bold hover:scale-105 active:scale-95"
                    >
                        <CreditCard className="w-5 h-5" />
                        Payer {formatCurrency(calculatedTotal)}
                    </button>
                </div>
            </div>
        </div>
    );
}
