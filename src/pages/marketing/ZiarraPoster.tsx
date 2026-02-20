import { MapPin, Clock, Phone, Users, Heart, Calendar } from 'lucide-react';

const ZiarraPoster = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
            {/* Postal Container - Optimized for Mobile/WhatsApp Share (9:16 aspect ratio feel) */}
            <div className="w-full max-w-md bg-white overflow-hidden shadow-2xl rounded-[2.5rem] relative border-8 border-[#D4AF37]/20">

                {/* Top Header - Islamic Patterns Overlay */}
                <div className="relative h-72 bg-[#006633] overflow-hidden">
                    {/* Decorative Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-[length:200px]"></div>

                    {/* Main Visual: Shrine of Cheikh Ahmed Tijani */}
                    <div className="absolute inset-0">
                        <img
                            src="https://wahidatoun.com/wp-content/uploads/2021/01/Zawiya-Tidjaniya-Fes.jpg"
                            alt="Mausolée Cheikh Ahmed Tijani"
                            className="w-full h-full object-cover brightness-75 contrast-125"
                        />
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#006633] via-transparent to-transparent opacity-80"></div>
                    </div>

                    {/* Central Ornament */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-48 h-48 border-2 border-[#D4AF37]/40 rounded-full flex items-center justify-center">
                        <div className="w-44 h-44 border-4 border-[#D4AF37] rounded-full overflow-hidden shadow-2xl bg-white p-1">
                            <img
                                src="https://images.unsplash.com/photo-1590011500350-13f50821217e?q=80&w=1000&auto=format&fit=crop"
                                alt="Shrine Detail"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 text-center z-10">
                        <h1 className="text-4xl font-serif text-[#D4AF37] font-bold drop-shadow-lg tracking-widest px-4 leading-tight">
                            ZIARRA VENDREDI
                        </h1>
                        <p className="text-white/95 text-xs uppercase tracking-[0.3em] font-medium mt-1">
                            Dernier Vendredi de Chaabane
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 bg-white relative">
                    {/* Date Badge */}
                    <div className="absolute -top-6 right-8 bg-[#D4AF37] text-white px-6 py-2 rounded-full shadow-lg font-bold text-lg border-2 border-white">
                        13 FÉVRIER 2026
                    </div>

                    {/* Itinerary - Reverted to Vertical Style */}
                    <div className="mb-8 mt-4">
                        <h2 className="text-[#006633] font-serif text-xl border-b-2 border-[#D4AF37]/10 pb-2 mb-4 flex items-center gap-2">
                            <MapPin size={22} className="text-[#D4AF37]" />
                            Parcours Spirituel
                        </h2>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-[#006633] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md">1</div>
                                <div>
                                    <p className="font-bold text-gray-900">Casablanca</p>
                                    <p className="text-[11px] text-[#006633] font-medium uppercase tracking-wide">Départ</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-[#006633] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md">2</div>
                                <div>
                                    <p className="font-bold text-gray-900 border-b border-gray-100 pb-0.5">ZAWIYA DE RABAT</p>
                                    <p className="text-[11px] text-gray-500 italic mt-0.5">Sidi Laarbi Ben Sayed</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-[#006633] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md">3</div>
                                <div>
                                    <p className="font-bold text-gray-900 border-b border-gray-100 pb-0.5 uppercase">ZAWIYA DE FÈS</p>
                                    <p className="text-[11px] text-gray-500 italic mt-0.5">Cheikh Ahmed Tijani Cherif</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#006633]/5 p-5 rounded-3xl border border-[#006633]/10 text-center">
                            <Clock className="text-[#006633] mx-auto mb-2" size={26} />
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Horaires</p>
                            <p className="font-bold text-[#006633] text-lg">06h00 - 20h00</p>
                        </div>
                        <div className="bg-[#D4AF37]/10 p-5 rounded-3xl border border-[#D4AF37]/20 text-center">
                            <Users className="text-[#D4AF37] mx-auto mb-2" size={26} />
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Places</p>
                            <p className="font-bold text-[#D4AF37] text-xl">2 Dispo.</p>
                        </div>
                        {/* Updated Date Section instead of Car Model */}
                        <div className="col-span-2 bg-slate-50 p-5 rounded-3xl flex items-center gap-4 border border-gray-100">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200">
                                <Calendar className="text-[#006633]" size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Date du Voyage</p>
                                <p className="font-bold text-gray-900 text-lg uppercase">Vendredi 12/02/2026</p>
                                <p className="text-[10px] text-[#006633] font-bold">Ziarra Spirituelle</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA / Contact */}
                    <div className="bg-gradient-to-br from-[#006633] to-[#004d26] text-white p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <p className="text-white/80 font-medium italic text-sm tracking-wide">Réservez votre place</p>
                            <Heart size={22} className="fill-[#D4AF37] text-[#D4AF37] animate-pulse" />
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner transition-transform group-hover:rotate-12">
                                <Phone size={28} />
                            </div>
                            <div>
                                <p className="text-[11px] text-white/50 uppercase tracking-widest mb-1 font-bold">WhatsApp & Appel</p>
                                <p className="text-2xl font-bold tracking-tighter text-white">+212 610 75 70 98</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Decoration */}
                    <div className="mt-8 text-center">
                        <div className="flex justify-center gap-1.5 mb-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-2 h-2 rounded-full bg-[#D4AF37]/30"></div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-medium">
                            NextMove Cargo • Carpool Spirituel
                        </p>
                    </div>
                </div>

                {/* Floating Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#006633]/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
            </div>
        </div>
    );
};

export default ZiarraPoster;
