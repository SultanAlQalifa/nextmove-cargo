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
                        Cette politique de confidentialité décrit comment <strong>Sultanat Mondial Service</strong> (ci-après "nous", "notre" ou "NextMove Cargo") collecte, utilise et partage vos informations lorsque vous utilisez notre application mobile et nos services logistiques.
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <Shield className="w-5 h-5 text-primary" />
                        1. Informations que nous collectons
                    </h3>
                    <p>
                        Pour le bon fonctionnement de nos services de transport et de livraison, nous collectons les données suivantes :
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Informations de compte</strong> : Nom, adresse email, numéro de téléphone, entreprise, NINEA/RC.</li>
                            <li><strong>Données de localisation</strong> : Nous collectons votre position GPS (y compris en arrière-plan pour les chauffeurs) pour permettre le suivi des colis en temps réel par les clients.</li>
                            <li><strong>Photos et Documents</strong> : Preuves de livraison ou documents officiels (CNI, Passeport) pour la procédure <strong>KYC</strong>.</li>
                            <li><strong>Données de transaction</strong> : Historique des paiements et rechargements de portefeuille virtuel.</li>
                        </ul>
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <Lock className="w-5 h-5 text-primary" />
                        2. Utilisation et Sécurité des Données
                    </h3>
                    <p>
                        Vos données sont utilisées exclusivement pour le suivi des expéditions, la gestion des paiements et la sécurité du système. Nous mettons en œuvre des mesures de sécurité techniques robustes (chiffrement SSL/TLS) pour protéger vos informations contre tout accès non autorisé.
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <Eye className="w-5 h-5 text-primary" />
                        3. Partage d'Informations
                    </h3>
                    <p>
                        Vos données sont partagées uniquement avec les acteurs nécessaires à l'exécution de vos transports (Prestataires, transporteurs, plateformes de paiement comme Wave ou Orange Money). Nous ne vendons jamais vos données à des tiers.
                    </p>

                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mt-8 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        4. Conservation et Suppression (Droit à l'oubli)
                    </h3>
                    <p>
                        Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression de votre compte et de toutes vos informations personnelles à tout moment en nous contactant à l'adresse ci-dessous.
                    </p>

                    <div className="mt-12 p-4 bg-sky-50 rounded-xl border border-sky-100 text-sm text-sky-800 flex items-start gap-3">
                        <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Contact et Support</p>
                            <p>Sultanat Mondial Service - Keur Mbaye Fall Extension, Dakar, Sénégal.</p>
                            <p>Pour toute question concernant vos données : <a href="mailto:wandifaproperties@gmail.com" className="underline">wandifaproperties@gmail.com</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
