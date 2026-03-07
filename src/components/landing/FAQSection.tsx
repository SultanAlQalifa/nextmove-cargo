import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
    const faqs = [
        {
            q: "Comment fonctionne le paiement Escrow ?",
            a: "Lorsque vous acceptez une offre, votre paiement est conservé dans notre compte de séquestre (Escrow) sécurisé. Le prestataire reçoit une confirmation mais l'argent n'est débloqué sur son compte que lorsque vous avez confirmé la bonne réception de la marchandise."
        },
        {
            q: "Quels sont les frais d'utilisation de la plateforme ?",
            a: "La création de compte est 100% gratuite. Nous prélevons une commission transparente uniquement sur les transactions réussies. Consultez notre page Tarifs pour les détails selon votre volume d'expédition."
        },
        {
            q: "Comment vérifiez-vous les prestataires ?",
            a: "Chaque prestataire doit passer un processus KYC (Know Your Customer) rigoureux. Nous vérifions leur CNI, leur registre de commerce (RCCM) et leur conformité fiscale avant de leur permettre de soumettre des offres."
        },
        {
            q: "Quels moyens de paiement acceptez-vous ?",
            a: "Nous sommes intégrés avec les solutions locales et internationales : Wave, Orange Money, MTN MoMo, Free Money, CinetPay, ainsi que les virements bancaires classiques."
        },
        {
            q: "Que se passe-t-il en cas de litige ?",
            a: "Si la marchandise n'est pas livrée ou est endommagée, vous pouvez ouvrir un litige depuis la plateforme avant de confirmer la réception. Nos experts bloqueront les fonds et entameront une médiation pour vous rembourser ou obtenir réparation."
        }
    ];

    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <div className="py-24 bg-white relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4">Support & FAQ</h2>
                    <h3 className="text-3xl lg:text-5xl font-black text-brand-dark mb-6 tracking-tight">
                        Des questions ? Nous avons les réponses.
                    </h3>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="border border-slate-200 rounded-2xl bg-white overflow-hidden hover:border-brand-orange/30 transition-colors shadow-sm"
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                            >
                                <span className="font-bold text-slate-800 text-lg">{faq.q}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIdx === idx ? "rotate-180 text-brand-orange" : ""}`}
                                />
                            </button>

                            <AnimatePresence>
                                {openIdx === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 text-slate-600 font-light leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
