import { Building2, Globe, ShieldCheck, Users } from "lucide-react";
import { useBranding } from "../contexts/BrandingContext";

export default function About() {
  const { settings } = useBranding();
  const about = settings?.pages?.about;

  return (
    <div className="bg-white dark:bg-gray-950 font-sans">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-slate-900 py-32 sm:py-48">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop"
          alt="Team collaboration"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 scale-105 animate-in fade-in duration-1000"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-950" />
        <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="text-sm font-medium text-blue-100 tracking-wide uppercase">
                Notre Histoire & Vision
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              {about?.title || "Révolutionner la Logistique en Afrique"}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-blue-100 max-w-2xl mx-auto font-light animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              {about?.subtitle ||
                "NextMove Cargo est la première plateforme digitale qui simplifie, sécurise et accélère vos importations de la Chine vers l'Afrique."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative -mt-16 z-20 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="text-center space-y-2">
            <div className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400">
              5+
            </div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Années d'Expérience
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400">
              10k+
            </div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Clients Satisfaits
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400">
              50k+
            </div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Colis Livrés
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400">
              3
            </div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Pays Desservis
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center mb-20">
          <h2 className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-4">
            {about?.mission_title || "Notre Mission"}
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6">
            Connecter les marchés, créer des opportunités
          </p>
          <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            {about?.mission_desc ||
              "Nous croyons que le commerce international ne devrait pas être complexe. Notre mission est de fournir aux entrepreneurs africains les outils logistiques et financiers nécessaires pour développer leur activité sans frontières."}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            <div className="flex flex-col bg-slate-50 dark:bg-gray-900 rounded-[2.5rem] p-10 hover:bg-white dark:hover:bg-gray-800 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <dt className="flex items-center gap-x-4 text-2xl font-bold leading-7 text-slate-900 dark:text-white mb-6">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Globe className="h-7 w-7" aria-hidden="true" />
                </div>
                {about?.vision_title || "Notre Vision"}
              </dt>
              <dd className="flex flex-auto flex-col text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                <p className="flex-auto">
                  {about?.vision_desc ||
                    "Devenir le pont numérique incontournable connectant les marchés mondiaux à l'Afrique, en rendant l'importation aussi simple qu'un achat local."}
                </p>
              </dd>
            </div>

            <div className="flex flex-col bg-slate-50 dark:bg-gray-900 rounded-[2.5rem] p-10 hover:bg-white dark:hover:bg-gray-800 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <dt className="flex items-center gap-x-4 text-2xl font-bold leading-7 text-slate-900 dark:text-white mb-6">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                  <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                </div>
                {about?.values_title || "Nos Valeurs"}
              </dt>
              <dd className="flex flex-auto flex-col text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                <p className="flex-auto">
                  {about?.values_desc ||
                    "Transparence totale, Fiabilité absolue, Innovation constante et Satisfaction Client sont les piliers de notre entreprise."}
                </p>
              </dd>
            </div>

            <div className="flex flex-col bg-slate-50 dark:bg-gray-900 rounded-[2.5rem] p-10 hover:bg-white dark:hover:bg-gray-800 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <dt className="flex items-center gap-x-4 text-2xl font-bold leading-7 text-slate-900 dark:text-white mb-6">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <Users className="h-7 w-7" aria-hidden="true" />
                </div>
                Support Dédié
              </dt>
              <dd className="flex flex-auto flex-col text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                <p className="flex-auto">
                  Une équipe d'experts multilingues passionnés, disponible pour
                  vous accompagner personnellement à chaque étape de votre
                  expédition.
                </p>
              </dd>
            </div>

            <div className="flex flex-col bg-slate-50 dark:bg-gray-900 rounded-[2.5rem] p-10 hover:bg-white dark:hover:bg-gray-800 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <dt className="flex items-center gap-x-4 text-2xl font-bold leading-7 text-slate-900 dark:text-white mb-6">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                  <Building2 className="h-7 w-7" aria-hidden="true" />
                </div>
                Innovation Continue
              </dt>
              <dd className="flex flex-auto flex-col text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                <p className="flex-auto">
                  Nous développons constamment de nouvelles technologies pour
                  rendre la logistique plus transparente, plus rapide et plus
                  efficace pour tous.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            Prêt à transformer votre logistique ?
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300 mb-10">
            Rejoignez des milliers d'entrepreneurs qui font confiance à NextMove
            Cargo pour leurs importations.
          </p>
          <div className="flex items-center justify-center gap-x-6">
            <a
              href="/register"
              className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:-translate-y-1"
            >
              Créer un compte gratuit
            </a>
            <a
              href="/contact"
              className="text-lg font-semibold leading-6 text-white hover:text-blue-300 transition-colors"
            >
              Nous contacter <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
