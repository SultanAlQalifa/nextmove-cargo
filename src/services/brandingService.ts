import { supabase } from "../lib/supabase";

export interface BrandingSettings {
  platform_name: string;
  logo_url: string;
  logo_nexus_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css: string;
  images: {
    login_background: string;
    sidebar_background: string;
  };
  content: {
    welcome_title: string;
    welcome_message: string;
    login_title: string;
    login_subtitle: string;
    footer_text: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta1: string;
    cta2: string;
    badge1: string;
    badge2: string;
    badge3: string;
  };
  stats: {
    shipments: string;
    value: string;
    forwarders: string;
    success: string;
  };
  features: {
    title: string;
    subtitle: string;
    description: string;
    escrow_title: string;
    escrow_desc: string;
    multimodal_title: string;
    multimodal_desc: string;
    tracking_title: string;
    tracking_desc: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    step1_title: string;
    step1_desc: string;
    step2_title: string;
    step2_desc: string;
    step3_title: string;
    step3_desc: string;
    step4_title: string;
    step4_desc: string;
  };
  testimonials: {
    title: string;
    review1_text: string;
    review1_name: string;
    review1_role: string;
    review2_text: string;
    review2_name: string;
    review2_role: string;
    review3_text: string;
    review3_name: string;
    review3_role: string;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    tagline: string;
    platform: string;
    company: string;
    rights: string;
  };
  pages: {
    about: {
      title: string;
      subtitle: string;
      mission_title: string;
      mission_desc: string;
      vision_title: string;
      vision_desc: string;
      values_title: string;
      values_desc: string;
    };
    contact: {
      title: string;
      subtitle: string;
      email: string;
      phone: string;
      address: string;
      hours: string;
    };
    privacy: {
      title: string;
      last_updated: string;
      content: string;
    };
  };
  pwa: {
    name: string;
    short_name: string;
    theme_color: string;
    background_color: string;
    icon_url: string;
    start_url: string;
    display: string;
    orientation: string;
  };
  social_media: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    tiktok: string;
    youtube: string;
    whatsapp_number: string;
  };
  seo: {
    meta_title_template: string;
    default_title: string;
    default_description: string;
    default_keywords: string;
    og_image: string;
  };
  documents: {
    invoice_logo?: string;
    company_name: string;
    company_address: string;
    company_tax_id?: string;
    invoice_footer_text: string;
    default_tax_rate: number;
  };
  id?: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  platform_name: "NextMove Cargo",
  logo_url: "https://via.placeholder.com/150x50?text=NextMove",
  logo_nexus_url: "https://via.placeholder.com/50x50?text=N",
  favicon_url: "https://via.placeholder.com/32x32",
  primary_color: "#2563eb", // blue-600
  secondary_color: "#1e40af", // blue-800
  accent_color: "#f59e0b", // amber-500
  font_family: "Inter, sans-serif",
  custom_css: "",
  images: {
    login_background:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    sidebar_background:
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  content: {
    welcome_title: "Bienvenue sur NextMove Cargo",
    welcome_message: "Gérez vos importations en toute simplicité.",
    login_title: "Connexion",
    login_subtitle: "Accédez à votre espace sécurisé",
    footer_text: "NextMove Cargo - Votre partenaire logistique de confiance.",
  },
  hero: {
    title: "Simplifiez vos Importations de la Chine vers l'Afrique",
    subtitle:
      "Une plateforme tout-en-un pour gérer vos expéditions, sécuriser vos paiements et suivre vos marchandises en temps réel.",
    cta1: "Demander une cotation",
    cta2: "Comment ça marche",
    badge1: "Paiement Sécurisé",
    badge2: "Livraison en 72h",
    badge3: "50+ Villes Couvertes",
  },
  stats: {
    shipments: "Expéditions",
    value: "Valeur Marchandise",
    forwarders: "Transitaires",
    success: "Taux de Succès",
  },
  features: {
    title: "Pourquoi choisir NextMove ?",
    subtitle: "Des outils conçus pour sécuriser et accélérer votre business",
    description:
      "Nous combinons technologie et expertise logistique pour vous offrir une expérience d'importation sans stress.",
    escrow_title: "Paiement Sécurisé (Séquestre)",
    escrow_desc:
      "Vos fonds sont protégés jusqu'à la validation de la livraison. Payez en toute confiance.",
    multimodal_title: "Transport Multimodal",
    multimodal_desc:
      "Maritime, Aérien, Routier. Nous optimisons le trajet pour réduire les coûts et les délais.",
    tracking_title: "Suivi en Temps Réel",
    tracking_desc:
      "Sachez exactement où se trouve votre marchandise à chaque étape du voyage.",
  },
  howItWorks: {
    title: "Comment ça marche ?",
    subtitle: "Un processus simple en 4 étapes",
    step1_title: "Demandez une cotation",
    step1_desc: "Décrivez votre besoin et recevez des offres compétitives.",
    step2_title: "Choisissez votre offre",
    step2_desc:
      "Comparez les prix et les délais, puis sélectionnez la meilleure option.",
    step3_title: "Paiement Sécurisé",
    step3_desc: "Versez les fonds sur notre compte séquestre sécurisé.",
    step4_title: "Suivi & Livraison",
    step4_desc: "Suivez votre expédition jusqu'à la livraison finale.",
  },
  testimonials: {
    title: "Approuvé par les Leaders du Commerce International",
    review1_name: "",
    review1_role: "",
    review1_text: "",
    review2_name: "",
    review2_role: "",
    review2_text: "",
    review3_name: "",
    review3_role: "",
    review3_text: "",
  },
  cta: {
    title: "Prêt à optimiser vos importations ?",
    subtitle:
      "Rejoignez des milliers d'entreprises qui font confiance à NextMove Cargo.",
    button: "Commencer maintenant",
  },
  footer: {
    tagline: "La solution logistique de nouvelle génération pour l'Afrique.",
    platform: "Plateforme",
    company: "Entreprise",
    rights: "© 2025 NextMove Cargo. Tous droits réservés.",
  },
  pages: {
    about: {
      title: "À Propos de Nous",
      subtitle: "Révolutionner la logistique entre la Chine et l'Afrique",
      mission_title: "Notre Mission",
      mission_desc:
        "Simplifier le commerce international pour les entrepreneurs africains en offrant une solution logistique transparente, fiable et abordable.",
      vision_title: "Notre Vision",
      vision_desc:
        "Devenir le pont numérique incontournable connectant les marchés mondiaux à l'Afrique.",
      values_title: "Nos Valeurs",
      values_desc:
        "Transparence, Fiabilité, Innovation et Satisfaction Client sont au cœur de tout ce que nous faisons.",
    },
    contact: {
      title: "Contactez-nous",
      subtitle: "Notre équipe est là pour vous aider",
      email: "djeylanidjitte@gmail.com",
      phone: "+221 77 000 00 00",
      address: "Dakar, Sénégal",
      hours: "Lun - Ven: 9h - 18h",
    },
    privacy: {
      title: "Politique de Confidentialité",
      last_updated: "Dernière mise à jour : 28 Novembre 2025",
      content:
        "Chez NextMove Cargo, nous prenons votre vie privée au sérieux. Cette politique décrit comment nous collectons, utilisons et protégeons vos données personnelles...",
    },
  },
  pwa: {
    name: "NextMove Cargo",
    short_name: "NextMove",
    theme_color: "#1e40af",
    background_color: "#ffffff",
    icon_url: "",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
  },
  social_media: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    tiktok: "",
    youtube: "",
    whatsapp_number: "221771234567",
  },
  seo: {
    meta_title_template: "%s | NextMove Cargo",
    default_title: "NextMove Cargo - Solution Logistique Chine-Afrique",
    default_description:
      "NextMove Cargo simplifie vos importations de la Chine vers l'Afrique. Transport maritime, aérien et services de paiement sécurisé.",
    default_keywords:
      "import chine afrique, transitaire chine, cargo sénégal, groupage maritime, paiement fournisseur chine",
    og_image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
  },
  documents: {
    company_name: "NextMove Cargo",
    company_address: "123 Avenue de la Logistique, Dakar, Sénégal",
    company_tax_id: "SN-DKR-2025-M-12345",
    invoice_footer_text:
      "Merci de votre confiance. Facture générée informatiquement.",
    default_tax_rate: 18,
  },
  id: "default",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const brandingService = {
  getBranding: async (): Promise<BrandingSettings> => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "branding")
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignore not found error
      console.error("Error fetching branding:", error);
    }

    const dbSettings = data?.value || {};

    // Deep merge with defaults
    return {
      ...DEFAULT_BRANDING,
      ...dbSettings,
      pwa: { ...DEFAULT_BRANDING.pwa, ...(dbSettings.pwa || {}) },
      images: { ...DEFAULT_BRANDING.images, ...(dbSettings.images || {}) },
      content: { ...DEFAULT_BRANDING.content, ...(dbSettings.content || {}) },
      hero: { ...DEFAULT_BRANDING.hero, ...(dbSettings.hero || {}) },
      stats: { ...DEFAULT_BRANDING.stats, ...(dbSettings.stats || {}) },
      features: {
        ...DEFAULT_BRANDING.features,
        ...(dbSettings.features || {}),
      },
      howItWorks: {
        ...DEFAULT_BRANDING.howItWorks,
        ...(dbSettings.howItWorks || {}),
      },
      testimonials: {
        ...DEFAULT_BRANDING.testimonials,
        ...(dbSettings.testimonials || {}),
      },
      cta: { ...DEFAULT_BRANDING.cta, ...(dbSettings.cta || {}) },
      footer: { ...DEFAULT_BRANDING.footer, ...(dbSettings.footer || {}) },
      pages: {
        ...DEFAULT_BRANDING.pages,
        ...(dbSettings.pages || {}),
        about: {
          ...DEFAULT_BRANDING.pages.about,
          ...(dbSettings.pages?.about || {}),
        },
        contact: {
          ...DEFAULT_BRANDING.pages.contact,
          ...(dbSettings.pages?.contact || {}),
        },
        privacy: {
          ...DEFAULT_BRANDING.pages.privacy,
          ...(dbSettings.pages?.privacy || {}),
        },
      },
      social_media: {
        ...DEFAULT_BRANDING.social_media,
        ...(dbSettings.social_media || {}),
      },
      seo: { ...DEFAULT_BRANDING.seo, ...(dbSettings.seo || {}) },
      documents: {
        ...DEFAULT_BRANDING.documents,
        ...(dbSettings.documents || {}),
      },
    };
  },

  updateBranding: async (
    settings: Partial<BrandingSettings>,
  ): Promise<BrandingSettings> => {
    // Fetch current to merge
    const current = await brandingService.getBranding();
    const updated = { ...current, ...settings };

    const { error } = await supabase.from("system_settings").upsert({
      key: "branding",
      value: updated,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return updated;
  },

  resetToDefaults: async (): Promise<BrandingSettings> => {
    const { error } = await supabase
      .from("system_settings")
      .delete()
      .eq("key", "branding");

    if (error) throw error;
    return DEFAULT_BRANDING;
  },
};
