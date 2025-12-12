import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectUserLocale } from "./utils/localeDetection";

const resources = {
  en: {
    translation: {
      // Navigation
      calculator: "Calculator",
      login: "Login",
      getStarted: "Get Started",
      signOut: "Sign Out",
      dashboard: "Dashboard",

      // Hero Section
      "hero.title": "Bridge the Gap Between China and Africa",
      "hero.subtitle":
        "The most secure and reliable logistics platform. We handle the shipping, customs, and payments so you can focus on growing your business.",
      "hero.cta1": "Get an Instant Quote",
      "hero.cta2": "Start Shipping Now",
      "hero.badge1": "Escrow Protected",
      "hero.badge2": "72h Delivery Available",
      "hero.badge3": "50+ Cities Covered",

      // Stats
      "stats.shipments": "Shipments Delivered",
      "stats.value": "Goods Value Protected",
      "stats.forwarders": "Verified Forwarders",
      "stats.success": "Success Rate",

      // Features
      "features.title": "Why Choose Us",
      "features.subtitle": "Logistics Reimagined for Modern Trade",
      "features.description":
        "We combine technology with on-the-ground expertise to solve the biggest challenges in cross-border trade.",
      "features.escrow.title": "Secure Escrow Payments",
      "features.escrow.desc":
        "Never worry about fraud again. Your funds are held securely in our escrow vault and only released to the forwarder when you confirm delivery.",
      "features.multimodal.title": "Multimodal Solutions",
      "features.multimodal.desc":
        "Whether you need speed (Air Freight) or cost-efficiency (Sea Freight), we instantly compare rates from top-rated forwarders.",
      "features.tracking.title": "End-to-End Tracking",
      "features.tracking.desc":
        "Real-time visibility from the supplier's warehouse in China to your doorstep in Africa. Know exactly where your cargo is 24/7.",

      // How It Works
      "howItWorks.title": "How It Works",
      "howItWorks.subtitle":
        "Shipping with NextMove Cargo is as easy as 1-2-3-4",
      "howItWorks.step1.title": "Get a Quote",
      "howItWorks.step1.desc":
        "Enter your cargo details and instantly get competitive rates.",
      "howItWorks.step2.title": "Book & Pay",
      "howItWorks.step2.desc":
        "Select the best offer and pay securely via Escrow.",
      "howItWorks.step3.title": "Track Cargo",
      "howItWorks.step3.desc":
        "Follow your shipment in real-time with our tracking dashboard.",
      "howItWorks.step4.title": "Confirm & Release",
      "howItWorks.step4.desc":
        "Inspect your goods upon arrival and release funds.",

      // Testimonials
      "testimonials.title": "Trusted by Businesses Across Africa",
      "testimonials.1.text":
        "NextMove Cargo changed my business. I used to worry about my goods getting lost or stolen. Now I sleep easy knowing my money is safe until I see my boxes.",
      "testimonials.1.name": "Amadou Diallo",
      "testimonials.1.role": "Importer, Senegal",
      "testimonials.2.text":
        "The rates are unbeatable. I saved 20% on my last shipment compared to my old agent. Plus, the tracking is actually accurate!",
      "testimonials.2.name": "Sarah Okafor",
      "testimonials.2.role": "Retailer, Nigeria",
      "testimonials.3.text":
        "As a supplier, I prefer clients who use NextMove. It builds trust instantly and the payment process is transparent for both sides.",
      "testimonials.3.name": "Wei Chen",
      "testimonials.3.role": "Supplier, Guangzhou",

      // CTA
      "cta.title": "Ready to streamline your logistics?",
      "cta.subtitle": "Join thousands of businesses shipping smarter today.",
      "cta.button": "Create Free Account",

      // Footer
      "footer.tagline":
        "The trusted bridge for China-Africa trade. Secure, fast, and reliable.",
      "footer.platform": "Platform",
      "footer.getQuote": "Get Quote",
      "footer.company": "Company",
      "footer.about": "About Us",
      "footer.contact": "Contact",
      "footer.privacy": "Privacy Policy",
      "footer.rights": "All rights reserved",

      // Calculator
      "calculator.title": "Instant Quote Calculator",
      "calculator.pageTitle": "Get Your Instant Quote",
      "calculator.subtitle": "Get the best rates for your shipment instantly.",
      "calculator.pageSubtitle":
        "Compare rates from verified forwarders and book your shipment in minutes.",
      "calculator.origin": "Origin",
      "calculator.destination": "Destination",
      "calculator.transportMode": "Transport Mode",
      "calculator.serviceType": "Service Type",
      "calculator.cargoDetails": "Cargo Details",
      "calculator.calculate": "Calculate Shipping Cost",
      "calculator.calculating": "Calculating...",
      "calculator.availableQuotes": "Available Quotes",
      "calculator.fillForm": "Fill out the form to get a quote",
      "calculator.noRates":
        "No rates found for these criteria. Try adjusting your search.",
      "calculator.noQuotesFound":
        "No quotes found. Please check your criteria.",
      "calculator.measure": "Measure",
      "calculator.tariff": "Tariff",
      "calculator.duration": "Duration",
      "calculator.conditions": "Conditions",
      "calculator.pricing": "Pricing",
      "calculator.volumeCBM": "Volume (CBM)",
      "calculator.weightKG": "Weight (kg)",
      "calculator.cbmNote": "1 CBM = 1m x 1m x 1m",
      "calculator.days": "days",
      "calculator.securePayment": "Secure Payment",
      "calculator.totalCost": "Total estimated cost",
      "calculator.estimatedCost": "Estimated Cost",
      "calculator.bookNow": "Book Now",

      // Marketplace
      "marketplace.title": "Marketplace",
      "marketplace.heroTitle": "Live Opportunities",
      "marketplace.heroSubtitle":
        "Find groupage offers or respond to shipping requests.",
      "marketplace.tabs.all": "View All",
      "marketplace.tabs.groupage": "Groupage Offers",
      "marketplace.tabs.expedition": "Expedition Offers",
      "marketplace.officialRate": "Official Rate",
      "marketplace.offerGroupage": "Groupage Offer",
      "marketplace.offerExpedition": "Expedition Offer",
      "marketplace.departure": "Departure",
      "marketplace.arrival": "Arrival",
      "marketplace.availability": "Availability",
      "marketplace.bookNow": "Book Now",
      "marketplace.requestQuote": "Request Quote",
      "marketplace.viewAll": "View all opportunities",

      // Dashboard Sidebar
      "dashboard.menu.main": "Main Menu",
      "dashboard.menu.dashboard": "Dashboard",
      "dashboard.menu.operations": "Operations",
      "dashboard.menu.myRequests": "My RFQ Requests",
      "dashboard.menu.groupage": "Groupage",
      "dashboard.menu.myShipments": "My Shipments",
      "dashboard.menu.calculator": "Calculator",
      "dashboard.menu.finances": "Finances",
      "dashboard.menu.payments": "Payments",
      "dashboard.menu.communication": "Communication",
      "dashboard.menu.messages": "Messages",
      "dashboard.menu.support": "Support",
      "dashboard.menu.settings": "Settings",
      "dashboard.menu.availableRfq": "Available RFQs",
      "dashboard.menu.myOffers": "My Offers",
      "dashboard.menu.shipments": "Shipments",
      "dashboard.menu.pod": "POD",
      "dashboard.menu.management": "Management",
      "dashboard.menu.personnel": "Personnel",
      "dashboard.menu.myClients": "My Clients",
      "dashboard.menu.fundCalls": "Fund Calls",
      "dashboard.menu.coupons": "Coupons",
      "dashboard.menu.rfqAndOffers": "RFQ & Offers",
      "dashboard.menu.administration": "Administration",
      "dashboard.menu.users": "Users",
      "dashboard.menu.forwarders": "Forwarders",
      "dashboard.menu.personnelAndRoles": "Personnel & Roles",
      "dashboard.menu.subscriptions": "Subscriptions",
      "dashboard.menu.feesAndServices": "Fees & Services",
      "dashboard.menu.configuration": "Configuration",
      "dashboard.menu.features": "Features",
      "dashboard.menu.paymentGateway": "Payment Gateway",
      "dashboard.menu.branding": "Branding & Pages",
      "dashboard.menu.referenceData": "Reference Data",
      "dashboard.menu.destinations": "Destinations",
      "dashboard.menu.packageTypes": "Package Types",
      "dashboard.menu.deliveries": "Deliveries",
      "dashboard.menu.podHistory": "POD History",
      "dashboard.menu.myPayments": "My Payments",
      "dashboard.menu.documents": "Documents",
      "dashboard.menu.becomePartner": "Become a Partner",
      "dashboard.upgrade.title": "Become a Forwarder Partner",
      "dashboard.upgrade.description":
        "Grow your business by accessing quote requests and managing your own shipments.",
      "dashboard.upgrade.button": "Upgrade Now",

      // Transport Modes
      "calculator.sea.label": "Sea Freight",
      "calculator.sea.measurement": "Volume in CBM (cubic meters)",
      "calculator.sea.pricing": "Price calculated per CBM",
      "calculator.sea.duration": "25-35 days",
      "calculator.sea.conditions":
        "Ideal for large volumes, economical solution",
      "calculator.sea.advantages.economical": "Economical",
      "calculator.sea.advantages.largeVolumes": "Large volumes",
      "calculator.sea.advantages.ecological": "Ecological",

      "calculator.air.label": "Air Freight",
      "calculator.air.measurement": "Weight in kilograms (kg)",
      "calculator.air.pricing": "Price calculated per kg",
      "calculator.air.duration": "3-7 days",
      "calculator.air.conditions": "Fast, ideal for urgent and small volumes",
      "calculator.air.advantages.fast": "Fast",
      "calculator.air.advantages.secure": "Secure",
      "calculator.air.advantages.urgent": "Urgent",

      // Service Types
      "calculator.standard.label": "Standard (Economical)",
      "calculator.standard.description":
        "Standard service with normal delivery time",
      "calculator.standard.pricing": "Reduced rate",
      "calculator.standard.features.consolidation": "Consolidation possible",
      "calculator.standard.features.bestValue": "Best value for money",
      "calculator.standard.features.normalDelay": "Normal delivery time",
      "calculator.standard.transitNote":
        "Standard transit time according to chosen mode",

      "calculator.express.label": "Express (Fastest)",
      "calculator.express.description":
        "Priority service with accelerated delivery",
      "calculator.express.pricing": "Premium rate (+30-50%)",
      "calculator.express.features.maxPriority": "Maximum priority",
      "calculator.express.features.directTransit": "Direct transit",
      "calculator.express.features.fastCustoms":
        "Accelerated customs clearance",
      "calculator.express.transitNote": "Transit time reduced by up to 40%",

      // Destinations
      "calculator.destinations.senegal": "Senegal (Dakar)",
      "calculator.destinations.ivoryCoast": "Ivory Coast (Abidjan)",
      "calculator.destinations.mali": "Mali (Bamako)",
      "calculator.origins.china": "China (All Ports)",

      // Forwarder Selection
      "calculator.calculationMode": "Calculation Mode",
      "calculator.platformRates": "Platform Rates",
      "calculator.platformRatesDesc": "Standard rates guaranteed by NextMove",
      "calculator.compareForwarders": "Compare Forwarders",
      "calculator.compareForwardersDesc": "Compare offers from all partners",
      "calculator.specificForwarder": "Specific Forwarder",
      "calculator.specificForwarderDesc": "Choose a specific partner",
      "calculator.selectForwarder": "Select a forwarder",
      "calculator.noRatesForwarder":
        "No rates available for this forwarder with these criteria.",
      "calculator.sort.price": "Price",
      "calculator.sort.speed": "Speed",
      "calculator.sort.rating": "Rating",

      // Dimensions and Units
      "calculator.measurementUnit": "Measurement Unit",
      "calculator.dimensions": "Dimensions",
      "calculator.length": "Length",
      "calculator.width": "Width",
      "calculator.height": "Height",
      "calculator.volumeCalculated": "Calculated volume",
      "calculator.units.meters": "Meters",
      "calculator.units.centimeters": "Centimeters",
      "calculator.units.inches": "Inches",

      // UI Labels
      "calculator.selected": "Selected",
      "calculator.features": "Features",

      // Auth
      "auth.welcomeBack": "Welcome back",
      "auth.signInSubtitle": "Sign in to your account to continue",
      "auth.createAccount": "Create Account",
      "auth.signUpSubtitle": "Join thousands of businesses shipping smarter",
      "auth.email": "Email Address",
      "auth.password": "Password",
      "auth.forgotPassword": "Forgot password?",
      "auth.signIn": "Sign In",
      "auth.signUp": "Sign Up",
      "auth.noAccount": "Don't have an account?",
      "auth.hasAccount": "Already have an account?",
      "auth.roleSelection": "Select your role",
      "auth.roles.client": "Client",
      "auth.roles.forwarder": "Freight Forwarder",
      "auth.roles.supplier": "Supplier",
      "auth.roles.driver": "Driver",
      "auth.signingIn": "Signing in...",
      "auth.signingUp": "Creating account...",
      "auth.testimonial":
        "NextMove has completely transformed how we handle our logistics. It's the partner we've been waiting for.",

      // RFQ (Request for Quote)
      "rfq.title": "Request for Quote",
      "rfq.create": "Create RFQ",
      "rfq.myRequests": "My Requests",
      "rfq.availableRequests": "Available Requests",
      "rfq.detail": "RFQ Details",
      "rfq.edit": "Edit RFQ",
      "rfq.delete": "Delete RFQ",
      "rfq.publish": "Publish RFQ",
      "rfq.cancel": "Cancel RFQ",
      "rfq.saveDraft": "Save as Draft",

      // RFQ Form
      "rfq.form.route": "Route Information",
      "rfq.form.cargo": "Cargo Details",
      "rfq.form.dates": "Dates & Timeline",
      "rfq.form.budget": "Budget & Services",
      "rfq.form.review": "Review & Publish",
      "rfq.form.originPort": "Origin Port",
      "rfq.form.destinationPort": "Destination Port",
      "rfq.form.cargoType": "Cargo Type",
      "rfq.form.cargoDescription": "Cargo Description",
      "rfq.form.preferredDepartureDate": "Preferred Departure Date",
      "rfq.form.requiredDeliveryDate": "Required Delivery Date",
      "rfq.form.budgetAmount": "Budget Amount",
      "rfq.form.servicesNeeded": "Services Needed",
      "rfq.form.specialRequirements": "Special Requirements",
      "rfq.form.targetForwarder": "Target Specific Forwarder (Optional)",

      // RFQ Status
      "rfq.status.draft": "Draft",
      "rfq.status.published": "Published",
      "rfq.status.offers_received": "Offers Received",
      "rfq.status.offer_accepted": "Offer Accepted",
      "rfq.status.expired": "Expired",
      "rfq.status.cancelled": "Cancelled",

      // Offers
      "rfq.offers.title": "Offers",
      "rfq.offers.count": "{{count}} offer(s)",
      "rfq.offers.noOffers": "No offers yet",
      "rfq.offers.compare": "Compare Offers",
      "rfq.offers.makeOffer": "Make an Offer",
      "rfq.offers.viewOffer": "View Offer",
      "rfq.offers.accept": "Accept Offer",
      "rfq.offers.reject": "Reject Offer",
      "rfq.offers.withdraw": "Withdraw Offer",
      "rfq.offers.myOffers": "My Offers",

      // Offer Form
      "rfq.offer.pricing": "Pricing Details",
      "rfq.offer.basePrice": "Base Price",
      "rfq.offer.insurancePrice": "Insurance",
      "rfq.offer.customsClearance": "Customs Clearance",
      "rfq.offer.doorToDoor": "Door-to-Door",
      "rfq.offer.packaging": "Packaging",
      "rfq.offer.storage": "Storage",
      "rfq.offer.otherFees": "Other Fees",
      "rfq.offer.totalPrice": "Total Price",
      "rfq.offer.transitDays": "Estimated Transit Days",
      "rfq.offer.departureDate": "Departure Date",
      "rfq.offer.arrivalDate": "Arrival Date",
      "rfq.offer.servicesIncluded": "Services Included",
      "rfq.offer.servicesOptional": "Optional Services",
      "rfq.offer.terms": "Terms & Conditions",
      "rfq.offer.validityDays": "Offer Validity (days)",
      "rfq.offer.messageToClient": "Message to Client",

      // Offer Status
      "rfq.offer.status.pending": "Pending",
      "rfq.offer.status.accepted": "Accepted",
      "rfq.offer.status.rejected": "Rejected",
      "rfq.offer.status.withdrawn": "Withdrawn",
      "rfq.offer.status.expired": "Expired",

      // Messages
      "rfq.messages.created": "RFQ created successfully",
      "rfq.messages.updated": "RFQ updated successfully",
      "rfq.messages.published": "RFQ published successfully",
      "rfq.messages.cancelled": "RFQ cancelled",
      "rfq.messages.deleted": "RFQ deleted",
      "rfq.messages.offerCreated": "Offer submitted successfully",
      "rfq.messages.offerAccepted": "Offer accepted",
      "rfq.messages.offerRejected": "Offer rejected",
      "rfq.messages.confirmAccept":
        "Are you sure you want to accept this offer? All other offers will be rejected.",
      "rfq.messages.confirmReject":
        "Are you sure you want to reject this offer?",
      "rfq.messages.confirmCancel": "Are you sure you want to cancel this RFQ?",

      // Documents
      "documents.title": "Document Center",
      "documents.subtitle": "Manage all your files, invoices, and contracts.",
      "documents.upload": "Upload Document",
      "documents.uploading": "Uploading...",
      "documents.searchPlaceholder": "Search for a document...",
      "documents.filter.all": "All",
      "documents.filter.invoice": "Invoice",
      "documents.filter.contract": "Contract",
      "documents.filter.kyc": "KYC",
      "documents.filter.customs": "Customs",
      "documents.filter.other": "Other",
      "documents.empty.title": "No documents",
      "documents.empty.subtitle": "Start by uploading your first file.",
      "documents.actions.download": "Download",
      "documents.actions.delete": "Delete",
      "documents.messages.uploadSuccess": "Document uploaded successfully",
      "documents.messages.uploadError": "Error uploading document",
      "documents.messages.deleteConfirm":
        "Are you sure you want to delete this document?",
      "documents.messages.deleteSuccess": "Document deleted",
      "documents.messages.deleteError": "Error deleting document",
      "documents.messages.loadError": "Error loading documents",
      "documents.messages.downloadError": "Error downloading document",

      // Coupons
      "coupons.code": "Promo Code",
      "coupons.apply": "Apply",
      "coupons.invalid": "Invalid Code",
      "coupons.expired": "Expired Code",
      "coupons.limitReached": "Usage limit reached",
      "auth.invalidPhone": "Invalid phone number",
      "auth.invalidCredentials": "Invalid credentials",
      "auth.forgotPasswordTitle": "Forgot Password?",
      "auth.forgotPasswordDesc": "Enter your email to receive a reset link.",
      "auth.resetSentSuccess": "Reset email sent! Check your inbox.",
      "auth.resetSentError": "Error sending email.",
      "auth.sending": "Sending...",
      "auth.sendLink": "Send Link",
      "auth.orContinueWith": "Or continue with",
      "auth.phone": "Phone",
      "auth.phoneNumber": "Phone Number",
      "coupons.success": "Coupon applied",
      "coupons.remove": "Remove Coupon",
      "coupons.discount": "Discount applied",

      // SEO
      "seo.defaultTitle": "NextMove Cargo | The Bridge Between China & Africa",
      "seo.defaultDescription": "The most secure logistics platform for imports from China to Africa. Customs clearance, door-to-door delivery, and secure payments.",
      "seo.keywords": "logistics, china, africa, shipping, air freight, sea freight, customs, escrow",
    },
  },
  fr: {
    translation: {
      // Navigation
      calculator: "Calculateur",
      login: "Connexion",
      getStarted: "Commencer",
      signOut: "Déconnexion",
      dashboard: "Tableau de bord",

      // Hero Section
      "hero.title": "Connecter la Chine et l'Afrique",
      "hero.subtitle":
        "La plateforme logistique la plus sûre et fiable. Nous gérons l'expédition, les douanes et les paiements pour que vous puissiez vous concentrer sur votre croissance.",
      "hero.cta1": "Obtenir un Devis Instantané",
      "hero.cta2": "Commencer à Expédier",
      "hero.badge1": "Paiement Sécurisé",
      "hero.badge2": "Livraison en 72h",
      "hero.badge3": "50+ Villes Couvertes",

      // Stats
      "stats.shipments": "Expéditions Livrées",
      "stats.value": "Valeur Protégée",
      "stats.forwarders": "Transitaires Vérifiés",
      "stats.success": "Taux de Réussite",

      // Features
      "features.title": "Pourquoi Nous Choisir",
      "features.subtitle": "La Logistique Réinventée pour le Commerce Moderne",
      "features.description":
        "Nous combinons la technologie avec une expertise terrain pour résoudre les plus grands défis du commerce transfrontalier.",
      "features.escrow.title": "Paiements Sécurisés par Séquestre",
      "features.escrow.desc":
        "Ne vous inquiétez plus jamais de la fraude. Vos fonds sont conservés en toute sécurité et libérés uniquement lorsque vous confirmez la livraison.",
      "features.multimodal.title": "Solutions Multimodales",
      "features.multimodal.desc":
        "Que vous ayez besoin de rapidité (Fret Aérien) ou d'économie (Fret Maritime), nous comparons instantanément les tarifs des meilleurs transitaires.",
      "features.tracking.title": "Suivi de Bout en Bout",
      "features.tracking.desc":
        "Visibilité en temps réel de l'entrepôt du fournisseur en Chine jusqu'à votre porte en Afrique. Sachez exactement où se trouve votre cargaison 24h/24 et 7j/7.",

      // How It Works
      "howItWorks.title": "Comment Ça Marche",
      "howItWorks.subtitle":
        "Expédier avec NextMove Cargo est aussi simple que 1-2-3-4",
      "howItWorks.step1.title": "Obtenir un Devis",
      "howItWorks.step1.desc":
        "Entrez les détails de votre cargaison et obtenez instantanément des tarifs compétitifs.",
      "howItWorks.step2.title": "Réserver et Payer",
      "howItWorks.step2.desc":
        "Sélectionnez la meilleure offre et payez en toute sécurité via Séquestre.",
      "howItWorks.step3.title": "Suivre la Cargaison",
      "howItWorks.step3.desc":
        "Suivez votre expédition en temps réel avec notre tableau de bord.",
      "howItWorks.step4.title": "Confirmer et Libérer",
      "howItWorks.step4.desc":
        "Inspectez vos marchandises à l'arrivée et libérez les fonds.",

      // Testimonials
      "testimonials.title": "Approuvé par les Entreprises à Travers l'Afrique",
      "testimonials.1.text":
        "NextMove Cargo a changé mon entreprise. J'avais l'habitude de m'inquiéter que mes marchandises soient perdues ou volées. Maintenant je dors tranquille sachant que mon argent est en sécurité jusqu'à ce que je voie mes colis.",
      "testimonials.1.name": "Amadou Diallo",
      "testimonials.1.role": "Importateur, Sénégal",
      "testimonials.2.text":
        "Les tarifs sont imbattables. J'ai économisé 20% sur ma dernière expédition par rapport à mon ancien agent. De plus, le suivi est vraiment précis !",
      "testimonials.2.name": "Sarah Okafor",
      "testimonials.2.role": "Détaillant, Nigeria",
      "testimonials.3.text":
        "En tant que fournisseur, je préfère les clients qui utilisent NextMove. Cela crée instantanément la confiance et le processus de paiement est transparent des deux côtés.",
      "testimonials.3.name": "Wei Chen",
      "testimonials.3.role": "Fournisseur, Guangzhou",

      // CTA
      "cta.title": "Prêt à optimiser votre logistique ?",
      "cta.subtitle":
        "Rejoignez des milliers d'entreprises qui expédient plus intelligemment aujourd'hui.",
      "cta.button": "Créer un Compte Gratuit",

      // Footer
      "footer.tagline":
        "Le pont de confiance pour le commerce Chine-Afrique. Sécurisé, rapide et fiable.",
      "footer.platform": "Plateforme",
      "footer.getQuote": "Obtenir un Devis",
      "footer.company": "Entreprise",
      "footer.about": "À Propos",
      "footer.contact": "Contact",
      "footer.privacy": "Politique de Confidentialité",
      "footer.rights": "Tous droits réservés",

      // Calculator
      "calculator.title": "Calculateur de Devis Instantané",
      "calculator.pageTitle": "Obtenez Votre Devis Instantané",
      "calculator.subtitle":
        "Obtenez les meilleurs tarifs pour votre expédition instantanément.",
      "calculator.pageSubtitle":
        "Comparez les tarifs des transitaires vérifiés et réservez votre expédition en quelques minutes.",
      "calculator.origin": "Origine",
      "calculator.destination": "Destination",
      "calculator.transportMode": "Mode de Transport",
      "calculator.serviceType": "Type de Service",
      "calculator.cargoDetails": "Détails de la Cargaison",
      "calculator.calculate": "Calculer le Coût d'Expédition",
      "calculator.calculating": "Calcul en cours...",
      "calculator.availableQuotes": "Devis Disponibles",
      "calculator.fillForm": "Remplissez le formulaire pour obtenir un devis",
      "calculator.noRates":
        "Aucun tarif trouvé pour ces critères. Essayez d'ajuster votre recherche.",
      "calculator.noQuotesFound":
        "Aucun devis trouvé. Veuillez vérifier vos critères.",
      "calculator.measure": "Mesure",
      "calculator.tariff": "Tarif",
      "calculator.duration": "Durée",
      "calculator.conditions": "Conditions",
      "calculator.pricing": "Tarification",
      "calculator.volumeCBM": "Volume (CBM)",
      "calculator.weightKG": "Poids (kg)",
      "calculator.cbmNote": "1 CBM = 1m x 1m x 1m",
      "calculator.days": "jours",
      "calculator.securePayment": "Paiement Sécurisé",
      "calculator.totalCost": "Coût total estimé",
      "calculator.estimatedCost": "Coût Estimé",
      "calculator.bookNow": "Réserver Maintenant",

      // Marketplace
      "marketplace.title": "Marketplace",
      "marketplace.heroTitle": "Opportunités en Direct",
      "marketplace.heroSubtitle":
        "Trouvez des offres de groupage ou répondez aux demandes d'expédition.",
      "marketplace.tabs.all": "Tout voir",
      "marketplace.tabs.groupage": "Offres Groupage",
      "marketplace.tabs.expedition": "Offres Expédition",
      "marketplace.officialRate": "Tarif officiel",
      "marketplace.offerGroupage": "Offre Groupage",
      "marketplace.offerExpedition": "Offre Expédition",
      "marketplace.departure": "Départ",
      "marketplace.arrival": "Arrivée",
      "marketplace.availability": "Disponibilité",
      "marketplace.bookNow": "Réserver maintenant",
      "marketplace.requestQuote": "Demander Cotation",
      "marketplace.viewAll": "Voir toutes les opportunités",

      // Dashboard Sidebar
      "dashboard.menu.main": "Menu Principal",
      "dashboard.menu.dashboard": "Tableau de bord",
      "dashboard.menu.operations": "Opérations",
      "dashboard.menu.myRequests": "Mes Demandes RFQ",
      "dashboard.menu.groupage": "Groupage",
      "dashboard.menu.myShipments": "Mes Expéditions",
      "dashboard.menu.calculator": "Calculateur",
      "dashboard.menu.finances": "Finances",
      "dashboard.menu.payments": "Paiements",
      "dashboard.menu.communication": "Communication",
      "dashboard.menu.messages": "Messages",
      "dashboard.menu.support": "Support",
      "dashboard.menu.settings": "Paramètres",
      "dashboard.menu.availableRfq": "RFQ Disponibles",
      "dashboard.menu.myOffers": "Mes Offres",
      "dashboard.menu.shipments": "Expéditions",
      "dashboard.menu.pod": "POD",
      "dashboard.menu.management": "Gestion",
      "dashboard.menu.personnel": "Personnel",
      "dashboard.menu.myClients": "Mes Clients",
      "dashboard.menu.fundCalls": "Appels de Fonds",
      "dashboard.menu.coupons": "Coupons",
      "dashboard.menu.rfqAndOffers": "RFQ & Offres",
      "dashboard.menu.administration": "Administration",
      "dashboard.menu.users": "Utilisateurs",
      "dashboard.menu.forwarders": "Transitaires",
      "dashboard.menu.personnelAndRoles": "Personnel & Rôles",
      "dashboard.menu.subscriptions": "Abonnements",
      "dashboard.menu.feesAndServices": "Frais & Services",
      "dashboard.menu.configuration": "Configuration",
      "dashboard.menu.features": "Fonctionnalités",
      "dashboard.menu.paymentGateway": "Passerelle Paiement",
      "dashboard.menu.branding": "Personnalisation & Pages",
      "dashboard.menu.referenceData": "Données de Référence",
      "dashboard.menu.destinations": "Destinations",
      "dashboard.menu.packageTypes": "Types de Colis",
      "dashboard.menu.deliveries": "Livraisons",
      "dashboard.menu.podHistory": "Historique POD",
      "dashboard.menu.myPayments": "Mes Paiements",
      "dashboard.menu.documents": "Documents",
      "dashboard.menu.becomePartner": "Devenir Partenaire",
      "dashboard.upgrade.title": "Devenez Transitaire Partenaire",
      "dashboard.upgrade.description":
        "Développez votre activité en accédant aux demandes de cotation et en gérant vos propres expéditions.",
      "dashboard.upgrade.button": "Passer Pro maintenant",

      // Transport Modes
      "calculator.sea.label": "Fret Maritime",
      "calculator.sea.measurement": "Volume en CBM (mètres cubes)",
      "calculator.sea.pricing": "Prix calculé par CBM",
      "calculator.sea.duration": "25-35 jours",
      "calculator.sea.conditions":
        "Idéal pour gros volumes, solution économique",
      "calculator.sea.advantages.economical": "Économique",
      "calculator.sea.advantages.largeVolumes": "Gros volumes",
      "calculator.sea.advantages.ecological": "Écologique",

      "calculator.air.label": "Fret Aérien",
      "calculator.air.measurement": "Poids en kilogrammes (kg)",
      "calculator.air.pricing": "Prix calculé par kg",
      "calculator.air.duration": "3-7 jours",
      "calculator.air.conditions":
        "Rapide, idéal pour urgences et petits volumes",
      "calculator.air.advantages.fast": "Rapide",
      "calculator.air.advantages.secure": "Sécurisé",
      "calculator.air.advantages.urgent": "Urgences",

      // Service Types
      "calculator.standard.label": "Standard (Économique)",
      "calculator.standard.description": "Service standard avec délai normal",
      "calculator.standard.pricing": "Tarif réduit",
      "calculator.standard.features.consolidation": "Consolidation possible",
      "calculator.standard.features.bestValue": "Meilleur rapport qualité/prix",
      "calculator.standard.features.normalDelay": "Délai normal",
      "calculator.standard.transitNote":
        "Temps de transit standard selon le mode choisi",

      "calculator.express.label": "Express (Le Plus Rapide)",
      "calculator.express.description":
        "Service prioritaire avec délai accéléré",
      "calculator.express.pricing": "Tarif premium (+30-50%)",
      "calculator.express.features.maxPriority": "Priorité maximale",
      "calculator.express.features.directTransit": "Transit direct",
      "calculator.express.features.fastCustoms": "Dédouanement accéléré",
      "calculator.express.transitNote":
        "Réduction du temps de transit jusqu'à 40%",

      // Destinations
      "calculator.destinations.senegal": "Sénégal (Dakar)",
      "calculator.destinations.ivoryCoast": "Côte d'Ivoire (Abidjan)",
      "calculator.destinations.mali": "Mali (Bamako)",
      "calculator.origins.china": "Chine (Tous les Ports)",

      // Forwarder Selection
      "calculator.calculationMode": "Mode de Calcul",
      "calculator.platformRates": "Tarifs de la Plateforme",
      "calculator.platformRatesDesc": "Tarifs standards garantis par NextMove",
      "calculator.compareForwarders": "Comparer Transitaires",
      "calculator.compareForwardersDesc":
        "Comparer les offres de tous les partenaires",
      "calculator.specificForwarder": "Transitaire Spécifique",
      "calculator.specificForwarderDesc": "Choisir un partenaire spécifique",
      "calculator.selectForwarder": "Sélectionner un transitaire",
      "calculator.noRatesForwarder":
        "Aucun tarif disponible pour ce transitaire avec ces critères.",
      "calculator.sort.price": "Prix",
      "calculator.sort.speed": "Rapidité",
      "calculator.sort.rating": "Note",

      // Dimensions and Units
      "calculator.measurementUnit": "Unité de Mesure",
      "calculator.dimensions": "Dimensions",
      "calculator.length": "Longueur",
      "calculator.width": "Largeur",
      "calculator.height": "Hauteur",
      "calculator.volumeCalculated": "Volume calculé",
      "calculator.units.meters": "Mètres",
      "calculator.units.centimeters": "Centimètres",
      "calculator.units.inches": "Pouces",

      // UI Labels
      "calculator.selected": "Sélectionné",
      "calculator.features": "Caractéristiques",

      // Auth
      "auth.welcomeBack": "Bon retour",
      "auth.signInSubtitle": "Connectez-vous à votre compte pour continuer",
      "auth.createAccount": "Créer un Compte",
      "auth.signUpSubtitle":
        "Rejoignez des milliers d'entreprises qui expédient intelligemment",
      "auth.email": "Adresse Email",
      "auth.password": "Mot de passe",
      "auth.forgotPassword": "Mot de passe oublié ?",
      "auth.signIn": "Se Connecter",
      "auth.signUp": "S'inscrire",
      "auth.noAccount": "Pas encore de compte ?",
      "auth.hasAccount": "Déjà un compte ?",
      "auth.roleSelection": "Sélectionnez votre rôle",
      "auth.roles.client": "Client",
      "auth.roles.forwarder": "Transitaire",
      "auth.roles.supplier": "Fournisseur",
      "auth.roles.driver": "Chauffeur",
      "auth.signingIn": "Connexion...",
      "auth.signingUp": "Création du compte...",
      "auth.testimonial":
        "NextMove a complètement transformé notre gestion logistique. C'est le partenaire que nous attendions.",

      // RFQ (Demande de Devis)
      "rfq.title": "Demande de Devis",
      "rfq.create": "Créer une Demande",
      "rfq.myRequests": "Mes Demandes",
      "rfq.availableRequests": "Demandes Disponibles",
      "rfq.detail": "Détails de la Demande",
      "rfq.edit": "Modifier",
      "rfq.delete": "Supprimer",
      "rfq.publish": "Publier",
      "rfq.cancel": "Annuler",
      "rfq.saveDraft": "Enregistrer comme Brouillon",

      // RFQ Form
      "rfq.form.route": "Informations de Route",
      "rfq.form.cargo": "Détails de la Marchandise",
      "rfq.form.dates": "Dates & Délais",
      "rfq.form.budget": "Budget & Services",
      "rfq.form.review": "Révision & Publication",
      "rfq.form.originPort": "Port d'Origine",
      "rfq.form.destinationPort": "Port de Destination",
      "rfq.form.cargoType": "Type de Marchandise",
      "rfq.form.cargoDescription": "Description de la Marchandise",
      "rfq.form.preferredDepartureDate": "Date de Départ Souhaitée",
      "rfq.form.requiredDeliveryDate": "Date de Livraison Requise",
      "rfq.form.budgetAmount": "Montant du Budget",
      "rfq.form.servicesNeeded": "Services Nécessaires",
      "rfq.form.specialRequirements": "Exigences Spéciales",
      "rfq.form.targetForwarder":
        "Cibler un Transitaire Spécifique (Optionnel)",

      // RFQ Status
      "rfq.status.draft": "Brouillon",
      "rfq.status.published": "Publié",
      "rfq.status.offers_received": "Offres Reçues",
      "rfq.status.offer_accepted": "Offre Acceptée",
      "rfq.status.expired": "Expiré",
      "rfq.status.cancelled": "Annulé",

      // Offers
      "rfq.offers.title": "Offres",
      "rfq.offers.count": "{{count}} offre(s)",
      "rfq.offers.noOffers": "Aucune offre pour le moment",
      "rfq.offers.compare": "Comparer les Offres",
      "rfq.offers.makeOffer": "Faire une Offre",
      "rfq.offers.viewOffer": "Voir l'Offre",
      "rfq.offers.accept": "Accepter l'Offre",
      "rfq.offers.reject": "Rejeter l'Offre",
      "rfq.offers.withdraw": "Retirer l'Offre",
      "rfq.offers.myOffers": "Mes Offres",

      // Offer Form
      "rfq.offer.pricing": "Détails de Tarification",
      "rfq.offer.basePrice": "Prix de Base",
      "rfq.offer.insurancePrice": "Assurance",
      "rfq.offer.customsClearance": "Dédouanement",
      "rfq.offer.doorToDoor": "Porte-à-Porte",
      "rfq.offer.packaging": "Emballage",
      "rfq.offer.storage": "Stockage",
      "rfq.offer.otherFees": "Autres Frais",
      "rfq.offer.totalPrice": "Prix Total",
      "rfq.offer.transitDays": "Délai de Transit Estimé (jours)",
      "rfq.offer.departureDate": "Date de Départ",
      "rfq.offer.arrivalDate": "Date d'Arrivée",
      "rfq.offer.servicesIncluded": "Services Inclus",
      "rfq.offer.servicesOptional": "Services Optionnels",
      "rfq.offer.terms": "Conditions Générales",
      "rfq.offer.validityDays": "Validité de l'Offre (jours)",
      "rfq.offer.messageToClient": "Message au Client",

      // Offer Status
      "rfq.offer.status.pending": "En Attente",
      "rfq.offer.status.accepted": "Acceptée",
      "rfq.offer.status.rejected": "Rejetée",
      "rfq.offer.status.withdrawn": "Retirée",
      "rfq.offer.status.expired": "Expirée",

      // Messages
      "rfq.messages.created": "Demande créée avec succès",
      "rfq.messages.updated": "Demande mise à jour",
      "rfq.messages.published": "Demande publiée avec succès",
      "rfq.messages.cancelled": "Demande annulée",
      "rfq.messages.deleted": "Demande supprimée",
      "rfq.messages.offerCreated": "Offre soumise avec succès",
      "rfq.messages.offerAccepted": "Offre acceptée",
      "rfq.messages.offerRejected": "Offre rejetée",
      "rfq.messages.confirmAccept":
        "Êtes-vous sûr de vouloir accepter cette offre ? Toutes les autres offres seront rejetées.",
      "rfq.messages.confirmReject":
        "Êtes-vous sûr de vouloir rejeter cette offre ?",
      "rfq.messages.confirmCancel":
        "Êtes-vous sûr de vouloir annuler cette demande ?",

      // Documents
      "documents.title": "Centre de Documents",
      "documents.subtitle": "Gérez tous vos fichiers, factures et contrats.",
      "documents.upload": "Importer un document",
      "documents.uploading": "Envoi...",
      "documents.searchPlaceholder": "Rechercher un document...",
      "documents.filter.all": "Tous",
      "documents.filter.invoice": "Facture",
      "documents.filter.contract": "Contrat",
      "documents.filter.kyc": "KYC",
      "documents.filter.customs": "Douane",
      "documents.filter.other": "Autre",
      "documents.empty.title": "Aucun document",
      "documents.empty.subtitle":
        "Commencez par importer votre premier fichier.",
      "documents.actions.download": "Télécharger",
      "documents.actions.delete": "Supprimer",
      "documents.messages.uploadSuccess": "Document téléchargé avec succès",
      "documents.messages.uploadError": "Erreur lors du téléchargement",
      "documents.messages.deleteConfirm":
        "Êtes-vous sûr de vouloir supprimer ce document ?",
      "documents.messages.deleteSuccess": "Document supprimé",
      "documents.messages.deleteError": "Erreur lors de la suppression",
      "documents.messages.loadError": "Erreur lors du chargement des documents",
      "documents.messages.downloadError": "Erreur lors du téléchargement",

      // Coupons
      "coupons.code": "Code Promo",
      "coupons.apply": "Appliquer",
      "coupons.invalid": "Code invalide",
      "coupons.expired": "Code expiré",
      "coupons.limitReached": "Limite d'utilisation atteinte",
      "auth.invalidPhone": "Numéro de téléphone invalide",
      "auth.invalidCredentials": "Identifiants incorrects",
      "auth.forgotPasswordTitle": "Mot de passe oublié ?",
      "auth.forgotPasswordDesc": "Entrez votre email pour recevoir un lien de réinitialisation.",
      "auth.resetSentSuccess": "Email de réinitialisation envoyé ! Vérifiez votre boîte mail.",
      "auth.resetSentError": "Erreur lors de l'envoi de l'email.",
      "auth.sending": "Envoi en cours...",
      "auth.sendLink": "Envoyer le lien",
      "auth.orContinueWith": "Ou continuer avec",
      "auth.phone": "Téléphone",
      "auth.phoneNumber": "Numéro de téléphone",
      "coupons.success": "Code promo appliqué",
      "coupons.remove": "Retirer le code",
      "coupons.discount": "Réduction appliquée",

      // SEO
      "seo.defaultTitle": "NextMove Cargo | Le Pont Entre la Chine et l'Afrique",
      "seo.defaultDescription": "La plateforme logistique la plus sûre pour importer de Chine en Afrique. Dédouanement, livraison porte-à-porte et paiements sécurisés.",
      "seo.keywords": "logistique, chine, afrique, transport, fret aérien, fret maritime, douane, séquestre",
    },
  },
  es: {
    translation: {
      // Navigation
      calculator: "Calculadora",
      login: "Iniciar Sesión",
      getStarted: "Comenzar",
      signOut: "Cerrar Sesión",
      dashboard: "Panel",

      // Hero Section
      "hero.title": "Conectando China y África",
      "hero.subtitle":
        "La plataforma logística más segura y confiable. Manejamos el envío, aduanas y pagos para que puedas enfocarte en hacer crecer tu negocio.",
      "hero.cta1": "Obtener Cotización Instantánea",
      "hero.cta2": "Comenzar a Enviar",
      "hero.badge1": "Pago Protegido",
      "hero.badge2": "Entrega en 72h",
      "hero.badge3": "50+ Ciudades Cubiertas",

      // Stats
      "stats.shipments": "Envíos Entregados",
      "stats.value": "Valor Protegido",
      "stats.forwarders": "Transitarios Verificados",
      "stats.success": "Tasa de Éxito",

      // Features
      "features.title": "Por Qué Elegirnos",
      "features.subtitle": "Logística Reimaginada para el Comercio Moderno",
      "features.description":
        "Combinamos tecnología con experiencia sobre el terreno para resolver los mayores desafíos del comercio transfronterizo.",
      "features.escrow.title": "Pagos Seguros en Depósito",
      "features.escrow.desc":
        "Nunca más te preocupes por fraudes. Tus fondos se mantienen seguros y solo se liberan cuando confirmas la entrega.",
      "features.multimodal.title": "Soluciones Multimodales",
      "features.multimodal.desc":
        "Ya sea que necesites velocidad (Flete Aéreo) o eficiencia de costos (Flete Marítimo), comparamos instantáneamente tarifas de los mejores transitarios.",
      "features.tracking.title": "Seguimiento de Extremo a Extremo",
      "features.tracking.desc":
        "Visibilidad en tiempo real desde el almacén del proveedor en China hasta tu puerta en África. Sabe exactamente dónde está tu carga 24/7.",

      // How It Works
      "howItWorks.title": "Cómo Funciona",
      "howItWorks.subtitle":
        "Enviar con NextMove Cargo es tan fácil como 1-2-3-4",
      "howItWorks.step1.title": "Obtener Cotización",
      "howItWorks.step1.desc":
        "Ingresa los detalles de tu carga y obtén tarifas competitivas al instante.",
      "howItWorks.step2.title": "Reservar y Pagar",
      "howItWorks.step2.desc":
        "Selecciona la mejor oferta y paga de forma segura vía Depósito.",
      "howItWorks.step3.title": "Rastrear Carga",
      "howItWorks.step3.desc":
        "Sigue tu envío en tiempo real con nuestro panel de seguimiento.",
      "howItWorks.step4.title": "Confirmar y Liberar",
      "howItWorks.step4.desc":
        "Inspecciona tus productos al llegar y libera los fondos.",

      // Testimonials
      "testimonials.title": "Confiado por Empresas en Toda África",
      "testimonials.1.text":
        "NextMove Cargo cambió mi negocio. Solía preocuparme de que mis productos se perdieran o robaran. Ahora duermo tranquilo sabiendo que mi dinero está seguro hasta que vea mis cajas.",
      "testimonials.1.name": "Amadou Diallo",
      "testimonials.1.role": "Importador, Senegal",
      "testimonials.2.text":
        "Las tarifas son inmejorables. Ahorré un 20% en mi último envío comparado con mi antiguo agente. ¡Además, el seguimiento es realmente preciso!",
      "testimonials.2.name": "Sarah Okafor",
      "testimonials.2.role": "Minorista, Nigeria",
      "testimonials.3.text":
        "Como proveedor, prefiero clientes que usan NextMove. Genera confianza instantáneamente y el proceso de pago es transparente para ambas partes.",
      "testimonials.3.name": "Wei Chen",
      "testimonials.3.role": "Proveedor, Guangzhou",

      // CTA
      "cta.title": "¿Listo para optimizar tu logística?",
      "cta.subtitle":
        "Únete a miles de empresas que envían de manera más inteligente hoy.",
      "cta.button": "Crear Cuenta Gratuita",

      // Footer
      "footer.tagline":
        "El puente confiable para el comercio China-África. Seguro, rápido y confiable.",
      "footer.platform": "Plataforma",
      "footer.getQuote": "Obtener Cotización",
      "footer.company": "Empresa",
      "footer.about": "Acerca de",
      "footer.contact": "Contacto",
      "footer.privacy": "Política de Privacidad",
      "footer.rights": "Todos los derechos reservados",

      // Calculator
      "calculator.title": "Calculadora de Cotización Instantánea",
      "calculator.pageTitle": "Obtenga Su Cotización Instantánea",
      "calculator.subtitle":
        "Obtenga las mejores tarifas para su envío al instante.",
      "calculator.pageSubtitle":
        "Compare tarifas de transitarios verificados y reserve su envío en minutos.",
      "calculator.origin": "Origen",
      "calculator.destination": "Destino",
      "calculator.transportMode": "Modo de Transporte",
      "calculator.serviceType": "Tipo de Servicio",
      "calculator.cargoDetails": "Detalles de la Carga",
      "calculator.calculate": "Calcular Costo de Envío",
      "calculator.calculating": "Calculando...",
      "calculator.availableQuotes": "Cotizaciones Disponibles",
      "calculator.fillForm":
        "Complete el formulario para obtener una cotización",
      "calculator.noRates":
        "No se encontraron tarifas para estos criterios. Intente ajustar su búsqueda.",
      "calculator.noQuotesFound":
        "No se encontraron cotizaciones. Por favor verifique sus criterios.",
      "calculator.measure": "Medida",
      "calculator.tariff": "Tarifa",
      "calculator.duration": "Duración",
      "calculator.conditions": "Condiciones",
      "calculator.pricing": "Precios",
      "calculator.volumeCBM": "Volumen (CBM)",
      "calculator.weightKG": "Peso (kg)",
      "calculator.cbmNote": "1 CBM = 1m x 1m x 1m",
      "calculator.days": "días",
      "calculator.securePayment": "Pago Seguro",
      "calculator.totalCost": "Costo total estimado",
      "calculator.estimatedCost": "Costo Estimado",
      "calculator.bookNow": "Reservar Ahora",

      // Marketplace
      "marketplace.title": "Marketplace",
      "marketplace.heroTitle": "Oportunidades en Vivo",
      "marketplace.heroSubtitle":
        "Encuentre ofertas de grupaje o responda a solicitudes de envío.",
      "marketplace.tabs.all": "Ver Todo",
      "marketplace.tabs.groupage": "Ofertas de Grupaje",
      "marketplace.tabs.expedition": "Ofertas de Expedición",
      "marketplace.officialRate": "Tarifa Oficial",
      "marketplace.offerGroupage": "Oferta de Grupaje",
      "marketplace.offerExpedition": "Oferta de Expedición",
      "marketplace.departure": "Salida",
      "marketplace.arrival": "Llegada",
      "marketplace.availability": "Disponibilidad",
      "marketplace.bookNow": "Reservar Ahora",
      "marketplace.requestQuote": "Solicitar Cotización",
      "marketplace.viewAll": "Ver todas las oportunidades",

      // Dashboard Sidebar
      "dashboard.menu.main": "Menú Principal",
      "dashboard.menu.dashboard": "Panel",
      "dashboard.menu.operations": "Operaciones",
      "dashboard.menu.myRequests": "Mis Solicitudes RFQ",
      "dashboard.menu.groupage": "Grupaje",
      "dashboard.menu.myShipments": "Mis Envíos",
      "dashboard.menu.calculator": "Calculadora",
      "dashboard.menu.finances": "Finanzas",
      "dashboard.menu.payments": "Pagos",
      "dashboard.menu.communication": "Comunicación",
      "dashboard.menu.messages": "Mensajes",
      "dashboard.menu.support": "Soporte",
      "dashboard.menu.settings": "Configuración",
      "dashboard.menu.availableRfq": "RFQ Disponibles",
      "dashboard.menu.myOffers": "Mis Ofertas",
      "dashboard.menu.shipments": "Envíos",
      "dashboard.menu.pod": "POD",
      "dashboard.menu.management": "Gestión",
      "dashboard.menu.personnel": "Personal",
      "dashboard.menu.myClients": "Mis Clientes",
      "dashboard.menu.fundCalls": "Llamadas de Fondos",
      "dashboard.menu.coupons": "Cupones",
      "dashboard.menu.rfqAndOffers": "RFQ y Ofertas",
      "dashboard.menu.administration": "Administración",
      "dashboard.menu.users": "Usuarios",
      "dashboard.menu.forwarders": "Transitarios",
      "dashboard.menu.personnelAndRoles": "Personal y Roles",
      "dashboard.menu.subscriptions": "Suscripciones",
      "dashboard.menu.feesAndServices": "Tarifas y Servicios",
      "dashboard.menu.configuration": "Configuración",
      "dashboard.menu.features": "Funcionalidades",
      "dashboard.menu.paymentGateway": "Pasarela de Pago",
      "dashboard.menu.branding": "Personalización y Páginas",
      "dashboard.menu.referenceData": "Datos de Referencia",
      "dashboard.menu.destinations": "Destinos",
      "dashboard.menu.packageTypes": "Tipos de Paquetes",
      "dashboard.menu.deliveries": "Entregas",
      "dashboard.menu.podHistory": "Historial POD",
      "dashboard.menu.myPayments": "Mis Pagos",
      "dashboard.menu.documents": "Documentos",
      "dashboard.menu.becomePartner": "Convertirse en Socio",
      "dashboard.upgrade.title": "Conviértase en Socio Transitario",
      "dashboard.upgrade.description":
        "Haga crecer su negocio accediendo a solicitudes de cotización y gestionando sus propios envíos.",
      "dashboard.upgrade.button": "Actualizar Ahora",

      // Transport Modes
      "calculator.sea.label": "Flete Marítimo",
      "calculator.sea.measurement": "Volumen en CBM (metros cúbicos)",
      "calculator.sea.pricing": "Precio calculado por CBM",
      "calculator.sea.duration": "25-35 días",
      "calculator.sea.conditions":
        "Ideal para grandes volúmenes, solución económica",
      "calculator.sea.advantages.economical": "Económico",
      "calculator.sea.advantages.largeVolumes": "Grandes volúmenes",
      "calculator.sea.advantages.ecological": "Ecológico",

      "calculator.air.label": "Flete Aéreo",
      "calculator.air.measurement": "Peso en kilogramos (kg)",
      "calculator.air.pricing": "Precio calculado por kg",
      "calculator.air.duration": "3-7 días",
      "calculator.air.conditions":
        "Rápido, ideal para urgencias y pequeños volúmenes",
      "calculator.air.advantages.fast": "Rápido",
      "calculator.air.advantages.secure": "Seguro",
      "calculator.air.advantages.urgent": "Urgente",

      // Service Types
      "calculator.standard.label": "Estándar (Económico)",
      "calculator.standard.description":
        "Servicio estándar con tiempo de entrega normal",
      "calculator.standard.pricing": "Tarifa reducida",
      "calculator.standard.features.consolidation": "Consolidación posible",
      "calculator.standard.features.bestValue": "Mejor relación calidad-precio",
      "calculator.standard.features.normalDelay": "Tiempo de entrega normal",
      "calculator.standard.transitNote":
        "Tiempo de tránsito estándar según el modo elegido",

      "calculator.express.label": "Express (El Más Rápido)",
      "calculator.express.description":
        "Servicio prioritario con entrega acelerada",
      "calculator.express.pricing": "Tarifa premium (+30-50%)",
      "calculator.express.features.maxPriority": "Máxima prioridad",
      "calculator.express.features.directTransit": "Tránsito directo",
      "calculator.express.features.fastCustoms":
        "Despacho de aduanas acelerado",
      "calculator.express.transitNote":
        "Tiempo de tránsito reducido hasta un 40%",

      // Destinations
      "calculator.destinations.senegal": "Senegal (Dakar)",
      "calculator.destinations.ivoryCoast": "Costa de Marfil (Abidjan)",
      "calculator.destinations.mali": "Malí (Bamako)",
      "calculator.origins.china": "China (Todos los Puertos)",

      // Forwarder Selection
      "calculator.calculationMode": "Modo de Cálculo",
      "calculator.platformRates": "Tarifas de Plataforma",
      "calculator.platformRatesDesc":
        "Tarifas estándar garantizadas por NextMove",
      "calculator.compareForwarders": "Comparar Transitarios",
      "calculator.compareForwardersDesc":
        "Comparar ofertas de todos los socios",
      "calculator.specificForwarder": "Transitario Específico",
      "calculator.specificForwarderDesc": "Elegir un socio específico",
      "calculator.selectForwarder": "Seleccionar un transitario",
      "calculator.noRatesForwarder":
        "No hay tarifas disponibles para este transitario con estos criterios.",
      "calculator.sort.price": "Precio",
      "calculator.sort.speed": "Velocidad",
      "calculator.sort.rating": "Valoración",

      // Dimensions and Units
      "calculator.measurementUnit": "Unidad de Medida",
      "calculator.dimensions": "Dimensiones",
      "calculator.length": "Longitud",
      "calculator.width": "Ancho",
      "calculator.height": "Altura",
      "calculator.volumeCalculated": "Volumen calculado",
      "calculator.units.meters": "Metros",
      "calculator.units.centimeters": "Centímetros",
      "calculator.units.inches": "Pulgadas",

      // UI Labels
      "calculator.selected": "Seleccionado",
      "calculator.features": "Características",

      // Auth
      "auth.welcomeBack": "Bienvenido de nuevo",
      "auth.signInSubtitle": "Inicia sesión en tu cuenta para continuar",
      "auth.createAccount": "Crear Cuenta",
      "auth.signUpSubtitle":
        "Únete a miles de empresas que envían de manera inteligente",
      "auth.email": "Correo Electrónico",
      "auth.password": "Contraseña",
      "auth.forgotPassword": "¿Olvidaste tu contraseña?",
      "auth.signIn": "Iniciar Sesión",
      "auth.signUp": "Registrarse",
      "auth.noAccount": "¿No tienes una cuenta?",
      "auth.hasAccount": "¿Ya tienes una cuenta?",
      "auth.roleSelection": "Selecciona tu rol",
      "auth.roles.client": "Cliente",
      "auth.roles.forwarder": "Transitario",
      "auth.roles.supplier": "Proveedor",
      "auth.roles.driver": "Conductor",
      "auth.signingIn": "Iniciando sesión...",
      "auth.signingUp": "Creando cuenta...",
      "auth.testimonial":
        "NextMove ha transformado completamente cómo manejamos nuestra logística. Es el socio que estábamos esperando.",
    },
  },
  zh: {
    translation: {
      // Navigation
      calculator: "计算器",
      login: "登录",
      getStarted: "开始使用",
      signOut: "退出",
      dashboard: "仪表板",

      // Hero Section
      "hero.title": "连接中国与非洲",
      "hero.subtitle":
        "最安全可靠的物流平台。我们处理运输、海关和付款，让您专注于业务增长。",
      "hero.cta1": "获取即时报价",
      "hero.cta2": "立即开始运输",
      "hero.badge1": "托管保护",
      "hero.badge2": "72小时送达",
      "hero.badge3": "覆盖50+城市",

      // Stats
      "stats.shipments": "已交付货运",
      "stats.value": "货物价值保护",
      "stats.forwarders": "认证货代",
      "stats.success": "成功率",

      // Features
      "features.title": "为什么选择我们",
      "features.subtitle": "为现代贸易重新定义物流",
      "features.description":
        "我们将技术与实地专业知识相结合，解决跨境贸易中的最大挑战。",
      "features.escrow.title": "安全托管支付",
      "features.escrow.desc":
        "再也不用担心欺诈。您的资金安全保管在我们的托管金库中，只有在您确认收货后才会释放给货代。",
      "features.multimodal.title": "多式联运解决方案",
      "features.multimodal.desc":
        "无论您需要速度（空运）还是成本效益（海运），我们都会即时比较顶级货代的费率。",
      "features.tracking.title": "端到端追踪",
      "features.tracking.desc":
        "从中国供应商仓库到非洲您的门口，实时可见。全天候准确了解您的货物位置。",

      // How It Works
      "howItWorks.title": "如何运作",
      "howItWorks.subtitle": "使用 NextMove Cargo 运输就像 1-2-3-4 一样简单",
      "howItWorks.step1.title": "获取报价",
      "howItWorks.step1.desc": "输入您的货物详情，立即获得有竞争力的费率。",
      "howItWorks.step2.title": "预订并付款",
      "howItWorks.step2.desc": "选择最佳报价，通过托管安全付款。",
      "howItWorks.step3.title": "追踪货物",
      "howItWorks.step3.desc": "通过我们的追踪仪表板实时跟踪您的货运。",
      "howItWorks.step4.title": "确认并释放",
      "howItWorks.step4.desc": "到货后检查您的货物并释放资金。",

      // Testimonials
      "testimonials.title": "受到非洲各地企业的信赖",
      "testimonials.1.text":
        "NextMove Cargo 改变了我的生意。我过去常常担心货物丢失或被盗。现在我可以安心睡觉，因为我知道我的钱在我看到货物之前是安全的。",
      "testimonials.1.name": "Amadou Diallo",
      "testimonials.1.role": "进口商，塞内加尔",
      "testimonials.2.text":
        "价格无与伦比。与我以前的代理相比，我在上次运输中节省了20%。而且，追踪确实准确！",
      "testimonials.2.name": "Sarah Okafor",
      "testimonials.2.role": "零售商，尼日利亚",
      "testimonials.3.text":
        "作为供应商，我更喜欢使用 NextMove 的客户。它立即建立信任，付款流程对双方都是透明的。",
      "testimonials.3.name": "Wei Chen",
      "testimonials.3.role": "供应商，广州",

      // CTA
      "cta.title": "准备好优化您的物流了吗？",
      "cta.subtitle": "今天就加入数千家更智能运输的企业。",
      "cta.button": "创建免费账户",

      // Footer
      "footer.tagline": "中非贸易的可信桥梁。安全、快速、可靠。",
      "footer.platform": "平台",
      "footer.getQuote": "获取报价",
      "footer.company": "公司",
      "footer.about": "关于我们",
      "footer.contact": "联系方式",
      "footer.privacy": "隐私政策",
      "footer.rights": "版权所有",

      // Calculator
      "calculator.title": "即时报价计算器",
      "calculator.pageTitle": "获取您的即时报价",
      "calculator.subtitle": "立即获取最优惠的运输价格。",
      "calculator.pageSubtitle":
        "比较认证货代的费率，并在几分钟内预订您的货运。",
      "calculator.origin": "起运地",
      "calculator.destination": "目的地",
      "calculator.transportMode": "运输方式",
      "calculator.serviceType": "服务类型",
      "calculator.cargoDetails": "货物详情",
      "calculator.calculate": "计算运输成本",
      "calculator.calculating": "计算中...",
      "calculator.availableQuotes": "可用报价",
      "calculator.fillForm": "填写表格以获取报价",
      "calculator.noRates": "未找到符合这些条件的费率。请尝试调整您的搜索。",
      "calculator.measure": "测量",
      "calculator.tariff": "费率",
      "calculator.duration": "时长",
      "calculator.conditions": "条件",
      "calculator.pricing": "定价",
      "calculator.volumeCBM": "体积 (CBM)",
      "calculator.weightKG": "重量 (kg)",
      "calculator.cbmNote": "1 CBM = 1m x 1m x 1m",
      "calculator.days": "天",
      "calculator.securePayment": "安全支付",
      "calculator.totalCost": "预计总成本",
      "calculator.estimatedCost": "预计费用",
      "calculator.bookNow": "立即预订",

      // Transport Modes
      "calculator.sea.label": "海运",
      "calculator.sea.measurement": "体积（立方米CBM）",
      "calculator.sea.pricing": "按CBM计价",
      "calculator.sea.duration": "25-35天",
      "calculator.sea.conditions": "适合大批量货物，经济实惠",
      "calculator.sea.advantages.economical": "经济",
      "calculator.sea.advantages.largeVolumes": "大批量",
      "calculator.sea.advantages.ecological": "环保",

      "calculator.air.label": "空运",
      "calculator.air.measurement": "重量（千克kg）",
      "calculator.air.pricing": "按kg计价",
      "calculator.air.duration": "3-7天",
      "calculator.air.conditions": "快速，适合紧急和小批量货物",
      "calculator.air.advantages.fast": "快速",
      "calculator.air.advantages.secure": "安全",
      "calculator.air.advantages.urgent": "紧急",

      // Service Types
      "calculator.standard.label": "标准（经济）",
      "calculator.standard.description": "标准服务，正常交货时间",
      "calculator.standard.pricing": "优惠价格",
      "calculator.standard.features.consolidation": "可拼箱",
      "calculator.standard.features.bestValue": "性价比最高",
      "calculator.standard.features.normalDelay": "正常交货时间",
      "calculator.standard.transitNote": "根据所选方式的标准运输时间",

      "calculator.express.label": "快递（最快）",
      "calculator.express.description": "优先服务，加速交货",
      "calculator.express.pricing": "高级价格 (+30-50%)",
      "calculator.express.features.maxPriority": "最高优先级",
      "calculator.express.features.directTransit": "直接运输",
      "calculator.express.features.fastCustoms": "加速清关",
      "calculator.express.transitNote": "运输时间缩短高达40%",

      // Destinations
      "calculator.destinations.senegal": "塞内加尔（达喀尔）",
      "calculator.destinations.ivoryCoast": "科特迪瓦（阿比让）",
      "calculator.destinations.mali": "马里（巴马科）",
      "calculator.origins.china": "中国（所有港口）",

      // Forwarder Selection
      "calculator.calculationMode": "计算模式",
      "calculator.platformRates": "平台费率",
      "calculator.platformRatesDesc": "NextMove 保证的标准费率",
      "calculator.compareForwarders": "比较货代",
      "calculator.compareForwardersDesc": "比较所有合作伙伴的报价",
      "calculator.specificForwarder": "特定货代",
      "calculator.specificForwarderDesc": "选择特定合作伙伴",
      "calculator.selectForwarder": "选择货代",
      "calculator.noRatesForwarder": "该货代没有符合这些条件的费率。",
      "calculator.sort.price": "价格",
      "calculator.sort.speed": "速度",
      "calculator.sort.rating": "评分",

      // Dimensions and Units
      "calculator.measurementUnit": "测量单位",
      "calculator.dimensions": "尺寸",
      "calculator.length": "长度",
      "calculator.width": "宽度",
      "calculator.height": "高度",
      "calculator.volumeCalculated": "计算体积",
      "calculator.units.meters": "米",
      "calculator.units.centimeters": "厘米",
      "calculator.units.inches": "英寸",

      // UI Labels
      "calculator.selected": "已选择",
      "calculator.features": "特点",

      // Auth
      "auth.welcomeBack": "欢迎回来",
      "auth.signInSubtitle": "登录您的帐户以继续",
      "auth.createAccount": "创建帐户",
      "auth.signUpSubtitle": "加入数千家智能运输的企业",
      "auth.email": "电子邮件地址",
      "auth.password": "密码",
      "auth.forgotPassword": "忘记密码？",
      "auth.signIn": "登录",
      "auth.signUp": "注册",
      "auth.noAccount": "还没有帐户？",
      "auth.hasAccount": "已有帐户？",
      "auth.roleSelection": "选择您的角色",
      "auth.roles.client": "客户（进口商/出口商）",
      "auth.roles.forwarder": "货运代理",
      "auth.roles.supplier": "供应商",
      "auth.roles.driver": "司机",
      "auth.signingIn": "登录中...",
      "auth.signingUp": "创建帐户中...",
      "auth.testimonial":
        "NextMove 彻底改变了我们处理物流的方式。这是我们一直在等待的合作伙伴。",
    },
  },
  ar: {
    translation: {
      // Navigation
      calculator: "حاسبة الأسعار",
      login: "تسجيل الدخول",
      getStarted: "ابدأ الآن",
      signOut: "خروج",
      dashboard: "لوحة التحكم",

      // Hero Section
      "hero.title": "جسر التجارة بين الصين وأفريقيا",
      "hero.subtitle": "المنصة اللوجستية الأكثر أماناً وموثوقية. نحن نتولى الشحن والتخليص والدفع لتتمكن من التركيز على تنمية أعمالك.",
      "hero.cta1": "احصل على تسعير فوري",
      "hero.cta2": "ابدأ الشحن الآن",
      "hero.badge1": "دفع آمن",
      "hero.badge2": "توصيل خلال 72 ساعة",
      "hero.badge3": "تغطية أكثر من 50 مدينة",

      // Stats
      "stats.shipments": "شحنات تم توصيلها",
      "stats.value": "قيمة البضائع المحمية",
      "stats.forwarders": "وكلاء شحن معتمدون",
      "stats.success": "نسبة النجاح",

      // Features
      "features.title": "لماذا تختارنا",
      "features.subtitle": "اللوجستيات بمفهوم حديث للتجارة",
      "features.description": "نجمع بين التكنولوجيا والخبرة الميدانية لحل أكبر تحديات التجارة عبر الحدود.",

      // Auth
      "auth.welcomeBack": "مرحباً بعودتك",
      "auth.signInSubtitle": "سجل الدخول للمتابعة",
      "auth.createAccount": "إنشاء حساب",
      "auth.email": "البريد الإلكتروني",
      "auth.password": "كلمة المرور",
      "auth.signIn": "دخول",
      "auth.signUp": "تسجيل",
      "auth.noAccount": "ليس لديك حساب؟",
      "auth.invalidPhone": "رقم الهاتف غير صحيح",
      "auth.invalidCredentials": "بيانات الدخول غير صحيحة",
      "auth.forgotPasswordTitle": "نسيت كلمة المرور؟",
      "auth.forgotPasswordDesc": "أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين.",
      "auth.resetSentSuccess": "تم إرسال رابط إعادة التعيين! تحقق من بريدك.",
      "auth.resetSentError": "خطأ في إرسال البريد الإلكتروني.",
      "auth.sending": "جاري الإرسال...",
      "auth.sendLink": "إرسال الرابط",
      "auth.orContinueWith": "أو المتابعة باستخدام",
      "auth.phone": "الهاتف",
      "auth.phoneNumber": "رقم الهاتف",
      "auth.hasAccount": "لديك حساب بالفعل؟",
      "auth.roleSelection": "اختار دورك",
      "auth.roles.client": "عميل (مستورد/مصدر)",
      "auth.roles.forwarder": "وكيل شحن",
      "auth.roles.supplier": "مورد",
      "auth.roles.driver": "سائق",

      // SEO
      "seo.defaultTitle": "NextMove Cargo | جسر التجارة بين الصين وأفريقيا",
      "seo.defaultDescription": "المنصة اللوجستية الأكثر أماناً للاستيراد من الصين إلى أفريقيا. تخليص جمركي، توصيل من الباب للباب، ودفع آمن.",
      "seo.keywords": "لوجستيات, الصين, أفريقيا, شحن, شحن جوي, شحن بحري, جمارك, ضمان",
    },
  },
};

// Detect user locale and initialize i18n
detectUserLocale().then((localeConfig) => {
  i18n.use(initReactI18next).init({
    resources,
    lng: localeConfig.language,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
  });

  // Set initial direction
  document.dir = localeConfig.language === 'ar' ? 'rtl' : 'ltr';
});

// Listen for language changes to update direction
i18n.on('languageChanged', (lng) => {
  document.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

export default i18n;
