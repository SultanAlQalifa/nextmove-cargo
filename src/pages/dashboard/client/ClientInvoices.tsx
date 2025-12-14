import React, { useEffect, useState } from 'react';
import { invoiceService, Invoice } from '../../../services/invoiceService';
import { Download, CreditCard, Search, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const data = await invoiceService.getMyInvoices();
            setInvoices(data as any);
        } catch (error) {
            console.error('Error loading invoices:', error);
            toast.error('Erreur lors du chargement des factures');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (invoice: Invoice) => {
        try {
            invoiceService.generatePdf(invoice);
            toast.success('Facture téléchargée');
        } catch (e) {
            toast.error('Erreur lors de la génération du PDF');
        }
    };

    const handlePay = async (invoice: Invoice) => {
        if (!confirm(`Confirmer le paiement de ${invoice.amount} ${invoice.currency} avec votre Wallet ?`)) return;

        setProcessingId(invoice.id);
        try {
            await invoiceService.payWithWallet(invoice.id, invoice.amount);
            toast.success('Paiement effectué avec succès !');
            loadInvoices(); // Refresh to flush status
        } catch (error) {
            console.error(error);
            toast.error('Échec du paiement. Vérifiez votre solde.');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: 'bg-green-100 text-green-800 border-green-200',
            unpaid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            overdue: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        const icons: Record<string, any> = {
            paid: CheckCircle,
            unpaid: Clock,
            overdue: AlertCircle,
            cancelled: FileText
        };

        const Icon = icons[status] || FileText;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${styles[status] || styles.unpaid}`}>
                <Icon className="w-3 h-3" />
                {status === 'paid' ? 'Payée' :
                    status === 'unpaid' ? 'En attente' :
                        status === 'overdue' ? 'En retard' : 'Annulée'}
            </span>
        );
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv as any).shipment?.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
                    <p className="text-gray-500">Gérez vos paiements et factures</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Rechercher par N° facture ou Tracking..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Chargement...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-2" />
                        <p>Aucune facture trouvée</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">N° Facture</th>
                                    <th className="px-6 py-4">Expédition</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Montant</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{invoice.number}</td>
                                        <td className="px-6 py-4">{(invoice as any).shipment?.tracking_number || '-'}</td>
                                        <td className="px-6 py-4">
                                            {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownload(invoice)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Télécharger PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>

                                                {invoice.status === 'unpaid' && (
                                                    <button
                                                        onClick={() => handlePay(invoice)}
                                                        disabled={processingId === invoice.id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-medium"
                                                    >
                                                        <CreditCard className="w-3 h-3" />
                                                        {processingId === invoice.id ? '...' : 'Payer'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
