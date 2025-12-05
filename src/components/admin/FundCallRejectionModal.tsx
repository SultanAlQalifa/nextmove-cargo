import { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import { FundCall } from '../../services/fundCallService';

interface FundCallRejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundCall: FundCall | null;
    onConfirm: (id: string, reason: string) => Promise<void>;
}

export default function FundCallRejectionModal({
    isOpen,
    onClose,
    fundCall,
    onConfirm
}: FundCallRejectionModalProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

    if (!isOpen || !fundCall) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setLoading(true);
        try {
            await onConfirm(fundCall.id, reason);
            onClose();
            setReason('');
        } catch (error) {
            console.error('Error rejecting fund call:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        Rejeter la demande
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-red-50 p-4 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                            <p className="font-medium">Attention</p>
                            <p className="mt-1">Cette action est irréversible. Le demandeur sera notifié du rejet et de la raison.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Motif du rejet <span className="text-red-500">*</span></label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[100px]"
                            placeholder="Veuillez expliquer pourquoi cette demande est rejetée..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Traitement...' : 'Confirmer le rejet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
