import { useState } from 'react';
import { X, CheckCircle, Calendar, CreditCard, FileText } from 'lucide-react';
import { FundCall } from '../../services/fundCallService';

interface FundCallApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundCall: FundCall | null;
    onConfirm: (id: string, details: ApprovalDetails) => Promise<void>;
}

export interface ApprovalDetails {
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    notes: string;
}

export default function FundCallApprovalModal({
    isOpen,
    onClose,
    fundCall,
    onConfirm
}: FundCallApprovalModalProps) {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<ApprovalDetails>({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'transfer',
        reference: '',
        notes: ''
    });

    if (!isOpen || !fundCall) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm(fundCall.id, details);
            onClose();
        } catch (error) {
            console.error('Error approving fund call:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Approuver l'appel de fonds
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl mb-4">
                        <p className="text-sm text-gray-500">Montant à payer</p>
                        <p className="text-2xl font-bold text-gray-900">{fundCall.amount.toLocaleString()} {fundCall.currency}</p>
                        <p className="text-sm text-gray-600 mt-1">Demandeur: {fundCall.requester.name}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" /> Date de paiement
                        </label>
                        <input
                            type="date"
                            required
                            value={details.paymentDate}
                            onChange={(e) => setDetails({ ...details, paymentDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" /> Mode de paiement
                        </label>
                        <select
                            value={details.paymentMethod}
                            onChange={(e) => setDetails({ ...details, paymentMethod: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
                        >
                            <option value="transfer">Virement Bancaire</option>
                            <option value="check">Chèque</option>
                            <option value="cash">Espèces</option>
                            <option value="mobile_money">Mobile Money</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" /> Référence Transaction
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="ex: VIR-2024-001"
                            value={details.reference}
                            onChange={(e) => setDetails({ ...details, reference: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Notes (Optionnel)</label>
                        <textarea
                            value={details.notes}
                            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px]"
                            placeholder="Notes internes..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm shadow-green-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Traitement...' : 'Confirmer le paiement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
