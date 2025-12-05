import { Invoice } from '../../services/paymentService';
import { FileText, Download, CreditCard, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InvoiceCardProps {
    invoice: Invoice;
    onPay?: (invoice: Invoice) => void;
    onDownload?: (invoice: Invoice) => void;
}

export default function InvoiceCard({ invoice, onPay, onDownload }: InvoiceCardProps) {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-50 text-green-700 border-green-200';
            case 'unpaid': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Payée';
            case 'unpaid': return 'À Payer';
            case 'overdue': return 'En Retard';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 className="w-4 h-4" />;
            case 'overdue': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <FileText className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{invoice.number}</h3>
                            <p className="text-xs text-gray-500">Émise le {new Date(invoice.issue_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                    </span>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">Montant Total</span>
                        <span className="text-2xl font-bold text-gray-900">
                            {invoice.amount.toLocaleString()} <span className="text-sm font-medium text-gray-500">{invoice.currency}</span>
                        </span>
                    </div>

                    {invoice.shipment_ref && (
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-500">Expédition</span>
                            <span className="font-mono font-medium text-gray-700">{invoice.shipment_ref}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Échéance</span>
                        <span className={`font-medium ${invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    {invoice.status !== 'paid' && (
                        <button
                            onClick={() => onPay?.(invoice)}
                            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            Payer
                        </button>
                    )}
                    <button
                        onClick={() => onDownload?.(invoice)}
                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${invoice.status === 'paid'
                                ? 'w-full bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Download className="w-4 h-4" />
                        {invoice.status === 'paid' ? 'Télécharger Facture' : 'PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
