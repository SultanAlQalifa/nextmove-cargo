import { FileCheck, AlertTriangle, Scale, Truck } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <PageHeader
                title="Conditions Générales d'Utilisation"
                subtitle="Règles régissant l'utilisation de la plateforme NextMove Cargo"
            />

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="prose prose-slate max-w-none space-y-8">
                    <p className="text-lg text-slate-600">
                        En accédant à NextMove Cargo, vous acceptez d'être lié par ces conditions, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable du respect de toutes les lois locales applicables.
                    </p>

                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                            <Truck className="w-5 h-5 text-primary" />
                            1. Services de Transport
                        </h3>
                        <p>
                            NextMove Cargo agit en tant qu'intermédiaire technologique connectant Clients et Transitaires. Nous ne sommes pas transporteurs. Le contrat de transport est conclu directement entre le Client et le Transitaire.
                        </p>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                            2. Responsabilités
                        </h3>
                        <p>
                            Le Client est responsable de l'exactitude des informations fournies (poids, nature des marchandises). Le Transitaire est responsable de la bonne exécution du transport selon les termes convenus. NextMove Cargo décline toute responsabilité en cas de litige commercial, bien que nous proposions un service de médiation.
                        </p>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                            <Scale className="w-5 h-5 text-primary" />
                            3. Paiements
                        </h3>
                        <p>
                            Les paiements effectués via la plateforme sont sécurisés. Les fonds peuvent être séquestrés jusqu'à la confirmation de livraison selon le type de contrat.
                        </p>
                    </div>

                    <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-800">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <FileCheck className="w-4 h-4" />
                            Mise à jour
                        </div>
                        Ces conditions ont été mises à jour le 12 Décembre 2025.
                    </div>
                </div>
            </div>
        </div>
    );
}
