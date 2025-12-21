
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

Identité et Tonalité :
- **Langue** : Tu parles STRICTEMENT en Français par défaut.
- **Ton** : Professionnel, Autoritaire mais Bienveillant, "Corporate Premium".
- **Expertise** : Tu maîtrises les Incoterms, le dédouanement, le groupage et la supply chain.

Directives Stratégiques :
1.  **Réponses Percutantes** : Sois clair, concis et va droit au but. Pas de blabla inutile.
2.  **Conversion** : Ton objectif est d'inciter l'utilisateur à demander une cotation ou à s'inscrire.
3.  **Support Intelligent** :
    - Pour les tarifs 💰 : "Je peux vous donner une estimation, mais le mieux est d'utiliser notre simulateur précis sur votre tableau de bord."
    - Pour le suivi 📍 : "Avez-vous votre numéro de tracking ? Vous pouvez le saisir dans la section 'Mes Expéditions'."
4.  **Sécurité** : Ne jamais inventer de procédure douanière. Si tu as un doute, redirige vers le support humain.

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
    sendMessage: async (content: string, context?: string, imageData?: string): Promise<AIMessage> => {
        if (!OPENAI_API_KEY) {
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
        const LEAD_KEYWORDS = ['devis', 'prix', 'tarif', 'cotation', 'conteneur', 'expédier', 'shipping', 'coût'];
        if (LEAD_KEYWORDS.some(kw => content.toLowerCase().includes(kw))) {
            console.info("📢 [LEAD DETECTED] User is asking about pricing/shipping:", content);
            // In a real scenario, we would trigger a DB function here:
            // await supabase.rpc('create_sales_lead', { query: content });
        }

        try {
            // Mix System Prompt with Dynamic Context
            const finalSystemPrompt = context
                ? `${SYSTEM_PROMPT}\n${context}`
                : SYSTEM_PROMPT;

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
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // ALWAYS use GPT-4o for best quality
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500, // Limit response for images
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponseContent = data.choices[0]?.message?.content || "Désolé, je n'ai pas compris.";

            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: aiResponseContent,
                timestamp: new Date(),
            };

        } catch (error) {
            console.error("AI Service Error:", error);
            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Oups ! J'ai eu un petit problème de connexion. Veuillez réessayer plus tard ou contacter le support humain.",
                timestamp: new Date(),
            };
        }
    },

    /**
     * Get initial welcome message
     */
    getWelcomeMessage: (): AIMessage => {
        return {
            id: 'welcome',
            role: 'assistant',
            content: "Bonjour. Je suis l'Expert Logistique de NextMove Cargo. Je peux vous assister sur vos cotations, le suivi de vos conteneurs ou les procédures douanières. Quelle est votre demande ?",
            timestamp: new Date(),
        };
    }
};
