
import { useState } from "react";
import { X, Mail, CheckCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

interface NewsletterModalProps {
    onClose: () => void;
}

export default function NewsletterModal({ onClose }: NewsletterModalProps) {
    const { success } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setIsSubmitted(true);
            success("Vous êtes inscrit à la newsletter !");
            // Ideally call a service to save email to DB
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    title="Fermer"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {isSubmitted ? (
                    <div className="p-8 text-center bg-green-50">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription Confirmée !</h2>
                        <p className="text-gray-600 mb-6">
                            Merci de rejoindre notre communauté. Vous recevrez nos meilleures astuces logistiques directement dans votre boîte mail.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <div className="p-8">
                        {/* Duplicate Close Button removed as absolute one exists at top-right (line 32) */}
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restez informé</h2>
                        <p className="text-gray-500 mb-6">
                            Abonnez-vous à notre newsletter pour recevoir les dernières actualités sur le transport, les douanes et nos offres exclusives.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Votre Adresse Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="exemple@entreprise.com"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70"
                            >
                                {loading ? "Inscription..." : "S'abonner Maintenant"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
