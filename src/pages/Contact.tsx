import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useBranding } from "../contexts/BrandingContext";
import { useToast } from "../contexts/ToastContext";

export default function Contact() {
  const { settings } = useBranding();
  const { success } = useToast();
  const contact = settings?.pages?.contact;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    success(
      "Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.",
    );
    setFormData({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 py-24 sm:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-100/50 via-slate-50/50 to-transparent dark:from-blue-900/20 dark:via-gray-900/50 dark:to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        {/* Decorative blobs */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Support 24/7
              </span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              {contact?.title || "Contactez-nous"}
            </h2>
            <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              {contact?.subtitle ||
                "Une question ? Un besoin spécifique ? Notre équipe est là pour vous aider. N'hésitez pas à nous écrire ou à nous rendre visite."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Contact Info Cards */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-gray-800 hover:-translate-y-1 transition-transform duration-300 group">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Notre Bureau
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                      {contact?.address ||
                        "123 Avenue de la Logistique, Dakar, Sénégal"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-gray-800 hover:-translate-y-1 transition-transform duration-300 group">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Téléphone
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      Du Lundi au Vendredi de 8h à 18h
                    </p>
                    <a
                      className="text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                      href={`tel:${contact?.phone || "+221338000000"}`}
                    >
                      {contact?.phone || "+221 33 800 00 00"}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-gray-800 hover:-translate-y-1 transition-transform duration-300 group">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Email
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      Notre équipe vous répond sous 24h
                    </p>
                    <a
                      className="text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                      href={`mailto:${contact?.email || "contact@nextmovecargo.com"}`}
                    >
                      {contact?.email || "contact@nextmovecargo.com"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="h-80 bg-slate-200 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                  alt="Map Location"
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-8 py-4 rounded-full shadow-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 pointer-events-auto hover:scale-105 transition-transform duration-300"
                  >
                    <MapPin className="w-6 h-6 text-red-500 animate-bounce" />
                    Voir sur la carte
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-blue-900/5 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Envoyez-nous un message
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-10">
                Remplissez le formulaire ci-dessous et nous vous répondrons
                rapidement.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div className="group">
                    <label
                      htmlFor="name"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1"
                    >
                      Nom complet
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="block w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium placeholder:text-slate-400"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="group">
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="block w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium placeholder:text-slate-400"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  <div className="group">
                    <label
                      htmlFor="subject"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1"
                    >
                      Sujet
                    </label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="block w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium placeholder:text-slate-400"
                      placeholder="L'objet de votre message"
                    />
                  </div>
                  <div className="group">
                    <label
                      htmlFor="message"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1"
                    >
                      Message
                    </label>
                    <textarea
                      name="message"
                      id="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="block w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium placeholder:text-slate-400 resize-none"
                      placeholder="Comment pouvons-nous vous aider ?"
                    />
                  </div>
                </div>
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 text-center text-lg font-bold text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-blue-600 hover:-translate-y-1 hover:shadow-blue-600/40 transition-all duration-300"
                  >
                    <Send className="w-6 h-6" />
                    Envoyer le message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
