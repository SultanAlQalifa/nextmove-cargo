import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()
        if (!url) {
            return new Response(JSON.stringify({ error: "URL is required" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log(`Analyzing sourcing link: ${url}`);

        // 1. Fetch the URL content
        // Note: Some sites like Alibaba might block direct scraping. 
        // We use a common User-Agent to improve success rate.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText} (${response.status})`)
        }

        const html = await response.text()

        // 2. Simple extraction of meta tags and title to reduce token usage
        const title = html.match(/<title>(.*?)<\/title>/)?.[1] || ""
        const description = html.match(/<meta name="description" content="(.*?)"/)?.[1] || ""

        // Extract text content from body, removing scripts and styles
        const bodySnippet = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .substring(0, 10000) // First 10k chars of text

        // 3. Call OpenAI to parse specs
        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) {
            console.error("Missing OPENAI_API_KEY environment variable");
            throw new Error("Missing OpenAI API Key");
        }

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert en sourcing logistique pour NextMove Cargo. 
            Analyse le contenu texte d'une page produit (Alibaba, AliExpress, Amazon, etc.) et extrais les informations techniques suivantes au format JSON :
            - item_name: Nom du produit (en Français)
            - weight_kg: Poids unitaire estimé en kg (numérique). Si exprimé en g, convertis en kg.
            - volume_cbm: Volume unitaire estimé en m3 (CBM - numérique).
            - unit_price: Prix unitaire ou prix de base (numérique).
            - currency: Devise (ex: USD, EUR, XOF).
            - category: Catégorie de marchandise (ex: Électronique, Textile, Mobilier).
            - shipping_advice: Un conseil très court (10 mots max) sur le mode de transport idéal (Air vs Sea) basé sur le produit.

            Renvoie uniquement un objet JSON valide. Si une valeur est introuvable, utilise null ou 0.`
                    },
                    {
                        role: 'user',
                        content: `URL du produit : ${url}\nTitre: ${title}\nDescription: ${description}\nContenu extrait: ${bodySnippet}`
                    }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            }),
        })

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            console.error("OpenAI API Error:", errorData);
            throw new Error(`OpenAI API Error: ${errorData.error?.message || aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json()
        const result = JSON.parse(aiData.choices[0].message.content)

        console.log("Extraction successful:", result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("Sourcing Analysis Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error during analysis" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
