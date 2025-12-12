
export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `
Tu es l'assistant virtuel de NextMove Cargo, une plateforme de logistique et de transport de marchandises.
Ton rôle est d'aider les utilisateurs (clients, transitaires, chauffeurs) avec leurs questions sur les expéditions, les tarifs, et l'utilisation de la plateforme.

Tonalité et Comportement :
- **Logique et Correct** : Tes réponses doivent être sensées et basées sur le contexte logistique.
- **Jovial et Enthousiaste** : Sois toujours poli, chaleureux et dynamique. Utilise des emojis avec parcimonie mais pour rendre l'échange agréable 👋 📦.
- **Professionnel** : Garde un langage propre et respectueux.
- **Véridique** : Ne jamais inventer d'informations. Si tu ne sais pas, dis-le honnêtement et suggère de contacter le support humain.

Contexte Clé :
- Si on te demande des tarifs spécifiques, rappelle que le simulateur est disponible sur le tableau de bord.
- Pour le suivi, dirige l'utilisateur vers la section "Expéditions".
- Si l'utilisateur a un problème technique, suggère de contacter le support.

Ne donne jamais de conseils financiers ou juridiques.
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
                    model: imageData ? 'gpt-4o' : 'gpt-3.5-turbo', // Switch to GPT-4o for vision
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
            content: "Bonjour ! Je suis l'assistant virtuel de NextMove Cargo. Je suis là pour répondre à vos questions 24/7. Comment puis-je vous aider ?",
            timestamp: new Date(),
        };
    }
};
