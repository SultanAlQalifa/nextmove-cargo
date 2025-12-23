import { FileCheck, AlertTriangle, Scale, Truck, ShieldCheck } from "lucide-react";
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
                            1. Nature des Services
                        </h3>
                        <p>
                            NextMove Cargo opère une plateforme digitale de mise en relation logistique. Nous agissons en qualité de commissionnaire de transport digital ou intermédiaire. Le contrat de transport physique est régi par les conventions internationales (CMR pour la route, Convention de Varsovie/Montréal pour l'air, Règles de La Haye-Visby pour la mer).
                        </p>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                            2. Responsabilités et Déclarations
                        </h3>
                        <p>
                            Le Client garantit l'exactitude des poids, dimensions et de la nature des marchandises déclarées. Toute fausse déclaration pourra entraîner des frais de réajustement ou le refus de prise en charge. NextMove Cargo ne saurait être tenu responsable des retards dus à des cas de force majeure ou des contrôles douaniers imprévus.
                        </p>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            3. Assurance et Valeur Déclarée
                        </h3>
                        <p>
                            La responsabilité des transporteurs est limitée par les conventions internationales. Nous recommandons fortement la souscription à une assurance "Ad Valorem" via nos partenaires pour couvrir 100% de la valeur marchande en cas d'avarie ou de perte.
                        </p>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                            <Scale className="w-5 h-5 text-primary" />
                            4. Paiements et Séquestre
                        </h3>
                        <p>
                            Les paiements sont effectués via les passerelles sécurisées Wave, PayTech ou CinetPay. Pour les services de Marketplace, les fonds sont conservés en séquestre et ne sont libérés au transitaire qu'après confirmation de la livraison ou expiration du délai de contestation.
                        </p>
                    </div>

                    <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-800">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <FileCheck className="w-4 h-4" />
                            Dernière Mise à jour
                        </div>
                        Ces conditions de niveau "Audit Production" ont été mises à jour le 23 Décembre 2025.
                    </div>
                </div>
            </div>
        </div>
    );
}
