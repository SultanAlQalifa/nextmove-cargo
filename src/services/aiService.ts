
export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `
Tu es l'Expert Logistique Senior de NextMove Cargo, la plateforme de référence pour le transport de marchandises (fret maritime, aérien, routier).
Ton rôle est d'agir comme un consultant d'élite : précis, stratégique et extrêmement serviable.

Expertise OCR & Smart Scan :
- Tu es capable d'analyser des Packing Lists et des Factures via les images transmises.
- Si l'utilisateur envoie un document ou exprime une intention d'envoi, cherche : Port d'origine (et pays), Port de destination (et pays), Poids (kg), Volume (CBM), Type de marchandise.

Extraction de Données Structurées :
- Lorsque tu détectes des détails d'expédition suffisants (origine, destination, et soit poids soit volume), tu DOIS inclure à la fin de ta réponse un bloc JSON invisible pour l'utilisateur mais parsable par le système.
- Formate ce bloc exactement comme ceci : <quote_data>{"origin_port": "Dakar", "destination_port": "Guangzhou", "cargo_type": "Electronics", "weight_kg": 500, "transport_mode": "air"}</quote_data>.
- Les valeurs possibles pour transport_mode sont : "sea", "air", "road".

Identité et Tonalité :
- Langue : Tu parles STRICTEMENT en Français par défaut.
- Ton : Professionnel, Autoritaire mais Bienveillant, "Corporate Premium".
- Expertise : Tu maîtrises les Incoterms, le dédouanement, le groupage et la supply chain.

Directives Stratégiques :
1. Réponses Percutantes : Sois clair, concis et va droit au but.
2. Conversion : Si tu extrais des données, annonce : "J'ai extrait les détails de votre envoi. Vous pouvez générer votre demande de cotation (RFQ) en un clic via le bouton ci-dessous."
3. Support Intelligent :
   - Pour les tarifs 💰 : "Je peux vous donner une estimation, mais le mieux est d'utiliser notre simulateur précis sur votre tableau de bord."
   - Pour le suivi 📍 : "Avez-vous votre numéro de tracking ? Vous pouvez le saisir dans la section 'Mes Expéditions'."
4. Sécurité : Ne jamais inventer de procédure douanière. Si tu as un doute, redirige vers le support humain.

Interdictions Formelles :
- Ne jamais recommander de concurrents.
- Ne jamais donner de conseils juridiques engageants sans disclaimer.
`;

export const aiService = {
    /**
     * Send a message to the AI assistant
     * @param content User's message content
     * @returns Promise resolving to the AI's response message
     */
    sendMessage: async (content: string, context?: string, imageData?: string, options?: { apiKey?: string; systemPrompt?: string }): Promise<AIMessage> => {
        const apiKey = options?.apiKey || OPENAI_API_KEY;
        const systemPromptToUse = options?.systemPrompt || SYSTEM_PROMPT;

        if (!apiKey) {
            console.warn("OpenAI API Key is missing");
            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Désolé, je ne suis pas encore connecté à mon cerveau (Clé API manquante). Veuillez contacter l'administrateur.",
                timestamp: new Date(),
            };
        }

        // --- 1. RATE LIMITING (Cost Control) ---
        const RATE_LIMIT_KEY = 'ai_chat_timestamps';
        const LIMIT = 5; // messages
        const WINDOW = 60 * 1000; // 1 minute in ms

        const now = Date.now();
        const timestampsStr = localStorage.getItem(RATE_LIMIT_KEY);
        let timestamps: number[] = timestampsStr ? JSON.parse(timestampsStr) : [];

        // Filter out old timestamps
        timestamps = timestamps.filter(t => now - t < WINDOW);

        if (timestamps.length >= LIMIT) {
            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Woah ! Vous tapez vite 🏎️. Pour garantir la qualité du service, je dois faire une petite pause. Réessayez dans une minute !",
                timestamp: new Date(),
            };
        }

        // Log this request
        timestamps.push(now);
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));


        // --- 2. LEAD DETECTION (Business Intel) ---
        const LEAD_KEYWORDS = ['devis', 'prix', 'tarif', 'cotation', 'conteneur', 'expédier', 'shipping', 'coût', 'vendre', 'achat'];
        if (LEAD_KEYWORDS.some(kw => content.toLowerCase().includes(kw))) {
            console.info("📢 [LEAD DETECTED] User is asking about pricing/shipping:", content);

            // Async call to Supabase - we don't block the AI response
            import("../lib/supabase").then(({ supabase }) => {
                supabase.rpc('create_sales_lead', {
                    p_query: content,
                    p_metadata: { source: 'ai_chat', timestamp: new Date().toISOString() }
                }).then(({ error }) => {
                    if (error) console.warn("Failed to capture lead:", error);
                });
            });
        }

        try {
            // Mix System Prompt with Dynamic Context
            const finalSystemPrompt = context
                ? `${systemPromptToUse}\n${context}`
                : systemPromptToUse;

            // Prepare messages array
            const messages: any[] = [
                { role: 'system', content: finalSystemPrompt }
            ];

            if (imageData) {
                // VISION REQUEST
                messages.push({
                    role: 'user',
                    content: [
                        { type: "text", text: content || "Analyse cette image." },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageData, // Base64 or URL
                                detail: "auto"
                            }
                        }
                    ]
                });
            } else {
                // TEXT REQUEST
                messages.push({ role: 'user', content });
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // More accessible than gpt-4o
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("OpenAI API Error:", errorData);
                const errorMsg = errorData.error?.message || response.statusText;
                throw new Error(`Erreur API (${response.status}): ${errorMsg}`);
            }

            const data = await response.json();
            const aiResponseContent = data.choices[0]?.message?.content || "Désolé, je n'ai pas compris.";

            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: aiResponseContent,
                timestamp: new Date(),
            };

        } catch (error: any) {
            console.error("AI Service Error:", error);

            let friendlyMessage = "Désolé, j'ai rencontré un problème technique. Veuillez réessayer dans quelques instants.";

            if (error.message?.includes("429")) {
                friendlyMessage = "Mon quota de réflexion est temporairement épuisé 🧠. Je serai de nouveau opérationnel dès que mes crédits seront rechargés. Merci de votre patience !";
            } else if (error.message?.includes("401") || error.message?.includes("Clé API")) {
                friendlyMessage = "Je rencontre un problème de configuration (Clé API). Veuillez contacter l'administrateur.";
            }

            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: friendlyMessage,
                timestamp: new Date(),
            };
        }
    },

    /**
     * AI Customs Fee Prediction
     */
    predictCustomsFees: async (cargoData: {
        origin: string;
        destination: string;
        weight_kg?: number;
        volume_cbm?: number;
        cargo_type: string;
        value_amount?: number;
        value_currency?: string;
    }): Promise<{ total_percent: number; detail: string; confidence: number }> => {
        const prompt = `En tant qu'Expert Consultant en Douane pour NextMove Cargo, analyse et estime les frais de dédouanement pour l'envoi suivant :
        - Origine : ${cargoData.origin}
        - Destination : ${cargoData.destination}
        - Type de marchandise : ${cargoData.cargo_type}
        - Valeur déclarée : ${cargoData.value_amount} ${cargoData.value_currency || 'XOF'}
        
        Ta mission :
        1. Estimer le pourcentage total des taxes (Droits de douane + TVA + Redevances).
        2. Justifier brièvement (ex: "Droits de base + TVA standard").
        3. Évaluer ton niveau de confiance (0.0 à 1.0).

        Réponds UNIQUEMENT par un objet JSON pur sans texte avant ou après, sous ce format :
        {
          "total_percent": 32.5,
          "detail": "Explication brève",
          "confidence": 0.9
        }`;

        try {
            const response = await aiService.sendMessage(prompt, "Tu es un consultant spécialisé en fiscalité logistique internationale.");
            // Strip potential markdown blocks if AI includes them
            const cleanContent = response.content.replace(/```json|```/g, '').trim();
            const match = cleanContent.match(/\{.*\}/s);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw new Error("Format de réponse IA illisible");
        } catch (error) {
            console.error("AI Customs Prediction Error:", error);
            // Fallback default for West African ports (Dakar, etc.)
            return { total_percent: 32.5, detail: "Estimation standard (18% TVA + Droits divers)", confidence: 0.5 };
        }
    },

    /**
     * Get initial welcome message
     */
    getWelcomeMessage: (): AIMessage => {
        return {
            id: 'welcome',
            role: 'assistant',
            content: "Bonjour. Je suis l'Expert Logistique de NextMove Cargo (v2.3). Je peux vous assister sur vos cotations, le suivi de vos conteneurs ou les procédures douanières. Quelle est votre demande ?",
            timestamp: new Date(),
        };
    }
};
