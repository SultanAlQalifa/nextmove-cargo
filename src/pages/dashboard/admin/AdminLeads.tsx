import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
    Search,
    Target,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    MessageSquare,
    Zap,
    ArrowRight,
    Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../contexts/ToastContext";

type LeadStatus = 'new' | 'contacted' | 'converted' | 'closed' | 'support';

interface SalesLead {
    id: string;
    user_id: string | null;
    query: string;
    status: LeadStatus;
    metadata: any;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        email: string;
        phone: string;
    };
}

export default function AdminLeads() {
    const [leads, setLeads] = useState<SalesLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    // Calculate Support Total
    const totalSupportAmount = leads
        .filter(l => l.metadata?.source === 'support_campaign')
        .reduce((sum, current) => sum + (Number(current.metadata?.amount) || 0), 0);

    const convertLeadToRFQ = (lead: SalesLead) => {
        // Map lead metadata to RFQ form state
        const prefillData = {
            origin_port: lead.metadata?.extraction?.origin || "",
            destination_port: lead.metadata?.extraction?.destination || "",
            cargo_type: lead.metadata?.extraction?.cargo_type || "",
            cargo_description: lead.query,
            weight_kg: lead.metadata?.extraction?.weight,
            transport_mode: lead.metadata?.extraction?.transport_mode || "sea",
            lead_id: lead.id
        };

        navigate("/dashboard/client/rfq/create", {
            state: {
                leadPrefill: prefillData,
                adminViewing: true
            }
        });
    };

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sales_leads')
                .select('*, profiles:user_id(full_name, email, phone)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (err: any) {
            console.error("Error fetching leads:", err);
            toastError("Erreur lors du chargement des leads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
        try {
            const { error } = await supabase
                .from('sales_leads')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
            success(`Statut mis à jour : ${newStatus}`);
        } catch (err) {
            toastError("Échec de la mise à jour");
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch =
            l.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.profiles?.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (l.profiles?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all'
            ? true
            : statusFilter === 'support'
                ? l.metadata?.source === 'support_campaign'
                : l.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: LeadStatus) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'converted': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'closed': return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getStatusLabel = (status: LeadStatus) => {
        switch (status) {
            case 'new': return 'Nouveau';
            case 'contacted': return 'Contacté';
            case 'converted': return 'Converti';
            case 'closed': return 'Fermé';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Gestion des Leads"
                subtitle="Leads capturés automatiquement par l'IA"
            />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: "Total Leads", value: leads.length, color: "blue", icon: Target },
                    { label: "Nouveaux", value: leads.filter(l => l.status === 'new').length, color: "amber", icon: Clock },
                    { label: "Convertis", value: leads.filter(l => l.status === 'converted').length, color: "emerald", icon: CheckCircle2 },
                    { label: "Total Soutien", value: `${totalSupportAmount.toLocaleString()} XOF`, color: "rose", icon: Heart },
                    { label: "Taux Conv.", value: leads.length ? `${Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)}%` : '0%', color: "purple", icon: Send }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`p-2 bg-${stat.color}-50 rounded-xl`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-2 w-full md:w-auto overflow-x-auto">
                    {['all', 'new', 'contacted', 'converted', 'closed', 'support'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${statusFilter === s
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {s === 'all' ? 'Tous' : s === 'support' ? 'Soutiens' : getStatusLabel(s as LeadStatus)}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un lead ou client..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 focus:border-primary/20 rounded-2xl text-sm focus:outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Récupération des prospects...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Prospect</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Demande IA</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Statut</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                    {lead.profiles?.full_name?.charAt(0) || "P"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{lead.profiles?.full_name || "Anonyme"}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{lead.profiles?.email || lead.profiles?.phone || "Contact inconnu"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 max-w-xs">
                                            <p className="text-sm text-gray-700 font-medium line-clamp-2 italic">
                                                "{lead.query}"
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                <MessageSquare className="w-3 h-3" />
                                                Source: {lead.metadata?.source || 'Inconnu'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {lead.metadata?.source === 'support_campaign' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1 w-fit`}>
                                                        <Heart className="w-3 h-3 fill-current" /> Soutien
                                                    </span>
                                                    <span className="text-sm font-black text-rose-600">
                                                        {Number(lead.metadata?.amount).toLocaleString()} XOF
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusColor(lead.status)}`}>
                                                    {getStatusLabel(lead.status)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => updateLeadStatus(lead.id, 'contacted')}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                                    title="Marquer comme contacté"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateLeadStatus(lead.id, 'converted')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                                    title="Marquer comme converti"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateLeadStatus(lead.id, 'closed')}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                    title="Fermer"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                                <div className="h-6 w-px bg-gray-100 mx-1" />
                                                <button
                                                    onClick={() => convertLeadToRFQ(lead)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl font-black text-[10px] tracking-tighter uppercase transition-all shadow-sm"
                                                    title="Convertir en RFQ"
                                                >
                                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                                    Créer RFQ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-5 bg-gray-50 rounded-full mb-4">
                                                    <Target className="w-10 h-10 text-gray-300" />
                                                </div>
                                                <p className="text-gray-500 font-bold">Aucun lead trouvé</p>
                                                <p className="text-gray-400 text-sm">Les nouveaux prospects s'afficheront ici</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </div >
        </div >
    );
}
