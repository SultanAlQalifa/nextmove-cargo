import { Shield, Lock, Eye, FileText } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <PageHeader
                title="Politique de Confidentialité"
                subtitle="Comment nous protégeons vos données personnelles"
            />

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="prose prose-slate max-w-none">
                    <p className="text-lg text-slate-600 mb-6">
                        Chez NextMove Cargo, la confidentialité de vos données est notre priorité. Cette politique détaille comment nous collectons, utilisons et protégeons vos informations.
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <Shield className="w-5 h-5 text-primary" />
                        1. Collecte des Données
                    </h3>
                    <p>
                        Nous collectons les informations nécessaires au bon fonctionnement de nos services logistiques, notamment :
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Informations d'identité (Nom, Entreprise, NINEA/RC)</li>
                            <li>Documents officiels (CNI, Passeport, Permis) pour la procédure <strong>KYC</strong></li>
                            <li>Coordonnées (Email, Téléphone, Adresse)</li>
                            <li>Détails des expéditions et documents douaniers</li>
                        </ul>
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <Lock className="w-5 h-5 text-primary" />
                        2. Sécurité des Données
                    </h3>
                    <p>
                        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles robustes pour protéger vos données contre tout accès non autorisé, perte ou altération. Toutes les transactions sensibles sont chiffrées via SSL.
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <Eye className="w-5 h-5 text-primary" />
                        3. Partage d'Informations
                    </h3>
                    <p>
                        Vos données sont partagées uniquement avec les acteurs nécessaires à l'exécution de vos transports (Transitaires, transporteurs, douanes) et conformément aux obligations légales. Nous ne vendons jamais vos données à des tiers.
                    </p>

                    <div className="mt-12 p-4 bg-sky-50 rounded-xl border border-sky-100 text-sm text-sky-800 flex items-start gap-3">
                        <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Délégué à la Protection des Données (DPO)</p>
                            <p>Pour toute question concernant vos données, contactez notre DPO à : <a href="mailto:privacy@nextmovecargo.com" className="underline">privacy@nextmovecargo.com</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
