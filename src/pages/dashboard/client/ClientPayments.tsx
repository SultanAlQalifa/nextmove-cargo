import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { CreditCard, Download, Filter, TrendingUp, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { paymentService, Invoice, Transaction } from '../../../services/paymentService';
import { useToast } from '../../../contexts/ToastContext';
import InvoiceCard from '../../../components/payment/InvoiceCard';
import PaymentModal from '../../../components/dashboard/PaymentModal';

export default function ClientPayments() {
    const { success } = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [invoicesData, transactionsData] = await Promise.all([
                paymentService.getClientInvoices(),
                paymentService.getClientTransactions()
            ]);
            setInvoices(invoicesData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        loadData(); // Refresh data to show updated status
    };

    const handleDownload = (invoice: Invoice) => {
        success(`Téléchargement de la facture ${invoice.number}`);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'unpaid') return ['unpaid', 'overdue'].includes(inv.status);
        if (filter === 'paid') return inv.status === 'paid';
        return true;
    });

    const totalDue = invoices
        .filter(inv => ['unpaid', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + inv.amount, 0);

    const totalPaid = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Paiements & Factures"
                subtitle="Gérez vos factures et consultez votre historique"
                action={{
                    label: "Recharger Crédit",
                    onClick: () => { },
                    icon: CreditCard
                }}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total à payer</p>
                            <h3 className="text-2xl font-bold">{totalDue.toLocaleString()} XOF</h3>
                        </div>
                    </div>
                    <div className="w-full bg-blue-800/50 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: '45%' }}></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Payé (2024)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalPaid.toLocaleString()} XOF</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Prochaine Échéance</p>
                            <h3 className="text-xl font-bold text-gray-900">10 Avril 2024</h3>
                        </div>
                    </div>
                    <p className="text-xs text-red-500 font-medium mt-2">Attention: 1 facture en retard</p>
                </div>
            </div>

            {/* Invoices Section */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Factures Récentes</h2>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => setFilter('unpaid')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unpaid' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            À Payer
                        </button>
                        <button
                            onClick={() => setFilter('paid')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'paid' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            Payées
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredInvoices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvoices.map((invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                onPay={handlePay}
                                onDownload={handleDownload}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Aucune facture trouvée</h3>
                        <p className="text-gray-500 mt-1">Vous n'avez aucune facture correspondant à ces critères.</p>
                    </div>
                )}
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Historique des Transactions</h2>
                    <button className="text-sm text-primary font-medium hover:underline">Voir tout</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Référence</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Méthode</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(txn.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                        {txn.reference}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                        {txn.method.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {txn.amount.toLocaleString()} {txn.currency}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${txn.status === 'completed' ? 'bg-green-50 text-green-700' :
                                                txn.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-red-50 text-red-700'}`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {selectedInvoice && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    amount={selectedInvoice.amount}
                    currency={selectedInvoice.currency}
                    shipmentId={selectedInvoice.shipment_ref || 'unknown'}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
