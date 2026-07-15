import { parseRecipeAnalysis } from "./lib/parseRecipeAnalysis";
import {
  isRateLimited,
  resolveRequestIdentity,
  setCorsHeaders,
} from "./lib/security";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type AnalyzeRecipeRequest = {
  recipe: string;
  mealName?: string;
  language?: "en" | "fr";
};

const GEMINI_MODEL = "gemini-2.5-flash";

function buildPrompt(language: "en" | "fr", recipe: string, mealName?: string) {
  const dish = mealName?.trim() ? ` for "${mealName.trim()}"` : "";

  if (language === "fr") {
    return `À partir de cette recette${dish}, calcule les macros nutritionnelles totales en tenant compte des quantités et proportions des ingrédients.
Normalise la recette avec des quantités claires si nécessaire.
Recette:
${recipe}

Réponds UNIQUEMENT en JSON valide:
{"calories":0,"protein":0,"carbs":0,"fat":0,"recipe":"recette normalisée avec ingrédients, quantités et étapes"}
Utilise des nombres entiers pour les macros.`;
  }

  return `From this recipe${dish}, calculate total nutritional macros based on ingredient quantities and proportions.
Normalize the recipe with clear quantities if needed.
Recipe:
${recipe}

Respond ONLY with valid JSON:
{"calories":0,"protein":0,"carbs":0,"fat":0,"recipe":"normalized recipe with ingredients, quantities and steps"}
Use whole numbers for macros.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identity = await resolveRequestIdentity(req);

  if (!identity) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const body = req.body as AnalyzeRecipeRequest;
  const recipe = body?.recipe?.trim();

  if (!recipe || recipe.length < 10) {
    return res.status(400).json({ error: "Recipe text too short" });
  }

  if (recipe.length > 4000) {
    return res.status(413).json({ error: "Recipe too long" });
  }

  const rateLimitKey =
    identity.source === "user" ? `user:${identity.id}` : `ip:${identity.id}`;
  const { limited, remaining } = await isRateLimited(rateLimitKey);

  if (limited) {
    res.setHeader("X-RateLimit-Remaining", "0");
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  res.setHeader("X-RateLimit-Remaining", String(remaining));

  const language = body.language === "fr" ? "fr" : "en";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildPrompt(language, recipe, body.mealName) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini recipe API error:", errorText);

      if (response.status === 429) {
        return res.status(429).json({ error: "AI quota exceeded" });
      }

      return res.status(502).json({ error: "AI analysis failed" });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(502).json({ error: "Empty AI response" });
    }

    const analysis = parseRecipeAnalysis(text);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Analyze recipe error:", error);
    return res.status(500).json({ error: "Failed to analyze recipe" });
  }
}