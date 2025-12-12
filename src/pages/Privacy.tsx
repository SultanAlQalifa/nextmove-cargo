import { useBranding } from "../contexts/BrandingContext";

export default function Privacy() {
  const { settings } = useBranding();
  const privacy = settings?.pages?.privacy;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 py-24 sm:py-32 relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50 via-slate-50/50 to-transparent dark:from-blue-900/10 dark:via-gray-900/50 dark:to-transparent" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="mx-auto max-w-4xl px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {privacy?.title || "Politique de Confidentialité"}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Votre vie privée est notre priorité.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] p-10 sm:p-16 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
              {privacy?.content || (
                <>
                  <h3 className="text-slate-900 dark:text-white font-bold text-2xl mb-4">
                    1. Introduction
                  </h3>
                  <p className="mb-6">
                    Chez NextMove Cargo, nous accordons une importance capitale
                    à la confidentialité et à la sécurité de vos données
                    personnelles. Cette politique détaille comment nous
                    collectons, utilisons et protégeons vos informations.
                  </p>

                  <h3 className="text-slate-900 dark:text-white font-bold text-2xl mb-4">
                    2. Collecte des Données
                  </h3>
                  <p className="mb-6">
                    Nous collectons les informations nécessaires pour fournir
                    nos services de transport et de logistique, notamment :
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        Informations d'identification (Nom, Email, Téléphone)
                      </li>
                      <li>
                        Détails des expéditions (Origine, Destination, Contenu)
                      </li>
                      <li>
                        Informations de paiement (traitées de manière sécurisée)
                      </li>
                    </ul>
                  </p>

                  <h3 className="text-slate-900 dark:text-white font-bold text-2xl mb-4">
                    3. Utilisation des Données
                  </h3>
                  <p className="mb-6">
                    Vos données sont utilisées exclusivement pour :
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Traiter vos commandes et expéditions</li>
                      <li>Vous fournir un support client efficace</li>
                      <li>
                        Améliorer nos services et votre expérience utilisateur
                      </li>
                    </ul>
                  </p>

                  <h3 className="text-slate-900 dark:text-white font-bold text-2xl mb-4">
                    4. Sécurité
                  </h3>
                  <p className="mb-6">
                    Nous mettons en œuvre des mesures de sécurité techniques et
                    organisationnelles robustes pour protéger vos données contre
                    tout accès non autorisé, perte ou altération.
                  </p>
                </>
              )}
            </div>

            <section className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-500">
                {privacy?.last_updated ||
                  "Dernière mise à jour : 28 Novembre 2025"}
              </p>
              <a
                href="/"
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-sm"
              >
                Retour à l'accueil
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
