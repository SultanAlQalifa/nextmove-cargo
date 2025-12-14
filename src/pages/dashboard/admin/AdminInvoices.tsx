import { useEffect, useState } from 'react';
import { invoiceService, Invoice } from '../../../services/invoiceService';
import { Download, Search, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../../../components/common/PageHeader';
import { format } from 'date-fns';


export default function AdminInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const data = await invoiceService.getAllInvoices();
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

    const handleMarkPaid = async (invoice: Invoice) => {
        if (!confirm(`Marquer la facture ${invoice.number} comme PAYÉE ?`)) return;
        try {
            await invoiceService.updateStatus(invoice.id, 'paid');
            toast.success('Statut mis à jour');
            loadInvoices();
        } catch (e) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: 'bg-green-100 text-green-800 border-green-200',
            unpaid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            overdue: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv as any).user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv as any).user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion des Factures"
                subtitle="Suivi de la facturation client"
                action={{
                    label: "Nouvelle Facture",
                    onClick: () => toast.info("Création manuelle non implémentée (Automatique via Expéditions)"),
                    icon: FileText
                }}
            />

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher (N°, Client, Email)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    aria-label="Filtrer par statut"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="paid">Payée</option>
                    <option value="unpaid">En attente</option>
                    <option value="overdue">En retard</option>
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Chargement...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Aucune facture trouvée</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">N° Facture</th>
                                    <th className="px-6 py-4">Client</th>
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
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{(invoice as any).user?.full_name || 'Client Inconnu'}</span>
                                                <span className="text-xs text-gray-400">{(invoice as any).user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownload(invoice)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Télécharger PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>

                                                {invoice.status === 'unpaid' && (
                                                    <button
                                                        onClick={() => handleMarkPaid(invoice)}
                                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Marquer comme payée"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
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
