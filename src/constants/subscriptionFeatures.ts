export interface FeatureDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  type: "boolean" | "limit";
  defaultValue: number | boolean;
  category: "core" | "support" | "integration" | "usage";
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // --- CORE / USAGE ---
  {
    id: "def_1",
    key: "max_shipments_per_month",
    name: "Expéditions par mois",
    description:
      "Nombre maximum d'expéditions qu'un utilisateur peut créer par mois",
    type: "limit",
    defaultValue: 10,
    category: "usage",
  },
  {
    id: "def_4",
    key: "max_users",
    name: "Utilisateurs inclus",
    description: "Nombre de comptes utilisateurs inclus dans l'abonnement",
    type: "limit",
    defaultValue: 1,
    category: "core",
  },
  {
    id: "def_7",
    key: "max_active_rfqs",
    name: "RFQ Simultanés",
    description: "Nombre maximum de demandes de cotation actives en même temps",
    type: "limit",
    defaultValue: 5,
    category: "usage",
  },
  {
    id: "def_8",
    key: "storage_limit_gb",
    name: "Stockage Documents (Go)",
    description:
      "Espace de stockage alloué pour les documents (factures, POD, etc.)",
    type: "limit",
    defaultValue: 1,
    category: "usage",
  },

  // --- FUNCTIONALITY ---
  {
    id: "def_5",
    key: "custom_branding",
    name: "Personnalisation (Branding)",
    description:
      "Possibilité de personnaliser le logo et les couleurs de l'interface",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },
  {
    id: "def_9",
    key: "export_data",
    name: "Export de Données",
    description:
      "Possibilité d'exporter les données (Expéditions, Factures) en CSV/Excel",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },
  {
    id: "def_10",
    key: "multi_currency",
    name: "Multi-devises",
    description:
      "Affichage et facturation dans plusieurs devises (XOF, USD, EUR)",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },
  {
    id: "def_6",
    key: "advanced_analytics",
    name: "Analyses Avancées",
    description:
      "Accès aux tableaux de bord de performance et rapports détaillés",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },

  // --- SUPPORT & SERVICE ---
  {
    id: "def_2",
    key: "priority_support",
    name: "Support Prioritaire",
    description: "Accès au support client prioritaire (réponse < 2h)",
    type: "boolean",
    defaultValue: false,
    category: "support",
  },
  {
    id: "def_11",
    key: "dedicated_account_manager",
    name: "Gestionnaire de Compte",
    description: "Accès à un gestionnaire de compte dédié pour le suivi",
    type: "boolean",
    defaultValue: false,
    category: "support",
  },

  // --- INTEGRATION & SECURITY ---
  {
    id: "def_3",
    key: "api_access",
    name: "Accès API",
    description:
      "Accès aux clés API pour l'intégration avec des systèmes externes",
    type: "boolean",
    defaultValue: false,
    category: "integration",
  },
  {
    id: "def_12",
    key: "sso_login",
    name: "Connexion SSO",
    description:
      "Authentification unique (Single Sign-On) pour les entreprises",
    type: "boolean",
    defaultValue: false,
    category: "integration",
  },
  {
    id: "def_13",
    key: "webhook_access",
    name: "Webhooks",
    description:
      "Notifications en temps réel via Webhooks vers des services tiers",
    type: "boolean",
    defaultValue: false,
    category: "integration",
  },
  {
    id: "def_14",
    key: "audit_logs",
    name: "Logs d'Audit",
    description: "Accès à l'historique complet des actions des utilisateurs",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },
  // --- OPERATIONAL & LOGISTICS ---
  {
    id: "def_15",
    key: "real_time_tracking",
    name: "Suivi Conteneur Temps Réel",
    description: "Suivi GPS/Satellite en temps réel des conteneurs et navires",
    type: "boolean",
    defaultValue: false,
    category: "usage",
  },
  {
    id: "def_16",
    key: "bulk_upload",
    name: "Import en Masse (CSV)",
    description:
      "Création de multiples expéditions via import de fichier CSV/Excel",
    type: "boolean",
    defaultValue: false,
    category: "usage",
  },
  {
    id: "def_23",
    key: "max_sea_shipment_size_ft",
    name: "Taille Max. Maritime (Pieds)",
    description: "Taille maximale par expédition maritime (ex: 40 pieds)",
    type: "limit",
    defaultValue: 40,
    category: "usage",
  },
  {
    id: "def_24",
    key: "max_air_shipment_weight_kg",
    name: "Poids Max. Aérien (Kg)",
    description: "Poids maximum par expédition aérienne (ex: 1000 kg)",
    type: "limit",
    defaultValue: 1000,
    category: "usage",
  },
  {
    id: "def_25",
    key: "enable_credit_system",
    name: "Système de Crédits (Top-up)",
    description:
      "Permet d'acheter des crédits pour dépasser les limites d'expédition",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },
  {
    id: "def_17",
    key: "customs_assistance",
    name: "Assistance Douanière",
    description: "Support dédié pour les procédures de dédouanement complexes",
    type: "boolean",
    defaultValue: false,
    category: "support",
  },
  {
    id: "def_18",
    key: "insurance_included_limit",
    name: "Assurance Incluse (Montant)",
    description:
      "Valeur de marchandise assurée incluse dans l'abonnement (en XOF)",
    type: "limit",
    defaultValue: 0,
    category: "core",
  },
  {
    id: "def_19",
    key: "address_book_limit",
    name: "Carnet d'Adresses",
    description: "Nombre maximum de destinataires/fournisseurs enregistrés",
    type: "limit",
    defaultValue: 50,
    category: "usage",
  },
  {
    id: "def_20",
    key: "doc_generation",
    name: "Génération Auto. Documents",
    description:
      "Génération automatique de Packing List et Factures Commerciales",
    type: "boolean",
    defaultValue: false,
    category: "usage",
  },
  {
    id: "def_21",
    key: "credit_line",
    name: "Ligne de Crédit",
    description: "Accès au paiement différé (sous réserve d'éligibilité)",
    type: "boolean",
    defaultValue: false,
    category: "core",
  },
  {
    id: "def_22",
    key: "whatsapp_notifications",
    name: "Notifications WhatsApp",
    description: "Alertes de statut envoyées directement sur WhatsApp",
    type: "boolean",
    defaultValue: false,
    category: "integration",
  },
];
