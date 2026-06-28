import { parseAnalysis } from "./lib/parseAnalysis";
import {
  isRateLimited,
  isValidApiKey,
  isValidImagePayload,
  setCorsHeaders,
} from "./lib/security";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type AnalyzeRequest = {
  image: string;
  language?: "en" | "fr";
};

const GEMINI_MODEL = "gemini-2.5-flash";

function buildPrompt(language: "en" | "fr") {
  if (language === "fr") {
    return `Analyse cette photo de repas et estime les valeurs nutritionnelles pour une portion standard visible.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{"name":"nom du plat en français","calories":0,"protein":0,"carbs":0,"fat":0}
Utilise des nombres entiers pour toutes les valeurs.`;
  }

  return `Analyze this meal photo and estimate nutritional values for a standard visible portion.
Respond ONLY with valid JSON using this exact structure:
{"name":"meal name in English","calories":0,"protein":0,"carbs":0,"fat":0}
Use whole numbers for all values.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.MACROZONE_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  if (!isValidApiKey(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const body = req.body as AnalyzeRequest;
  if (!body?.image) {
    return res.status(400).json({ error: "Missing image data" });
  }

  if (!isValidImagePayload(body.image)) {
    return res.status(413).json({ error: "Image too large" });
  }

  const { limited, remaining } = await isRateLimited(req);
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
              parts: [
                { text: buildPrompt(language) },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: body.image.replace(/^data:image\/\w+;base64,/, ""),
                  },
                },
              ],
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
      console.error("Gemini API error:", errorText);

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

    const analysis = parseAnalysis(text);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Analyze meal error:", error);
    return res.status(500).json({ error: "Failed to analyze meal" });
  }
}