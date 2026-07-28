import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", name: "Theatre Diary API" });
});

// Image Proxy Endpoint to prevent CORS canvas tainting when exporting PNGs
app.get("/api/proxy-image", async (req, res) => {
  try {
    const imageUrl = (req.query.url as string || "").trim();
    if (!imageUrl) {
      res.status(400).send("Missing url parameter");
      return;
    }
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      res.status(response.status).send("Failed to fetch image");
      return;
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).send("Failed to proxy image");
  }
});

// Endpoint: Enrich / Parse Show Info using Gemini
app.post("/api/gemini/enrich", async (req, res) => {
  try {
    const { title, description } = req.body;
    const inputText = (description || title || "").trim();
    if (!inputText) {
      res.status(400).json({ error: "Title or description is required" });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback response if no Gemini API key configured
      res.json({
        title: title || (description ? description.split(' ')[0] : 'Theatrical Production'),
        category: "Musical",
        theatreType: "Broadway",
        synopsis: `A captivating theatrical performance based on "${inputText}".`,
        famousHighlights: ["Overture", "Act I Finale", "Curtain Call"],
        tags: ["Theatre", "Live Performance"],
        city: "New York",
        suggestedPosterPrompt: `Broadway theatre poster for ${inputText}, dramatic stage lighting, vibrant artwork`,
      });
      return;
    }

    const prompt = `Today's date is ${todayStr}. Analyze the following input describing a theatrical show/performance and extract structured production metadata.
Input description/title: "${inputText}"

Extract as many details as possible:
- Official show title
- Category/Genre (MUST be one of: "Musical", "Play", "Opera", "Dance", "Concert", "Other")
- Production/Theatre Type (MUST be one of: "Broadway", "Off-Broadway", "Touring", "Regional", "Community")
- Venue/Theatre name if mentioned
- City name if mentioned (default to New York if unknown Broadway/Off-Broadway show)
- Show date (YYYY-MM-DD) if mentioned or relative (e.g. yesterday relative to ${todayStr})
- Showtime: "Matinee" or "Evening"
- Rating: 1-5 integer rating
- Ticket price: number
- Currency: symbol e.g. "$"
- User notes / personal impressions extracted from description
- Synopsis: 2-3 sentence engaging plot synopsis for this production
- Tags: 3-5 relevant tags (e.g. Broadway, Revival, Musical, Tony Winner)
- Poster search keywords: Specific concise search phrase to find the official show poster using search engines (e.g. "the lunch box musical berkeley REP poster" or "Sound of music tour poster")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Broadway archivist and theatre intelligence assistant. Extract precise, well-structured metadata from user text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Official production title" },
            category: { type: Type.STRING, description: "One of: Musical, Play, Opera, Dance, Concert, Other" },
            theatreType: { type: Type.STRING, description: "One of: Broadway, Off-Broadway, Touring, Regional, Community, Other" },
            venue: { type: Type.STRING, description: "Venue or theatre name" },
            city: { type: Type.STRING, description: "City name" },
            date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
            time: { type: Type.STRING, description: "Matinee or Evening" },
            rating: { type: Type.NUMBER, description: "Rating from 1 to 5" },
            ticketPrice: { type: Type.NUMBER, description: "Ticket price number" },
            currency: { type: Type.STRING, description: "Currency symbol e.g. $" },
            notes: { type: Type.STRING, description: "User review or personal impressions" },
            synopsis: { type: Type.STRING, description: "A 2-3 sentence plot synopsis of the show" },
            posterSearchQuery: { type: Type.STRING, description: "Keywords to search for official poster e.g. 'The Lunch Box musical Berkeley REP poster'" },
            famousHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 notable songs or scenes"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-5 relevant tags"
            },
            suggestedPosterPrompt: {
              type: Type.STRING,
              description: "Poster image generation prompt"
            }
          },
          required: ["title", "category", "synopsis", "tags"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      if (!data.posterSearchQuery && data.title) {
        data.posterSearchQuery = `${data.title} ${data.venue || data.theatreType || ''} poster`.trim();
      }
      res.json(data);
    } else {
      res.json({
        title: title || "New Production",
        category: "Musical",
        synopsis: `An acclaimed production of ${inputText}.`,
        posterSearchQuery: `${title || inputText} poster`,
        tags: ["Theatre", "Broadway"]
      });
    }
  } catch (err: any) {
    console.error("Gemini enrich error:", err);
    res.status(500).json({ error: "Failed to parse production details with AI." });
  }
});

// Endpoint: Brave Image Search Integration for Production Posters
app.get("/api/poster-search", async (req, res) => {
  try {
    const query = (req.query.q as string || "").trim();
    if (!query) {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_SEARCH_KEY || process.env.BRAVE_API_KEY;

    // Primary path: Use Brave Search Image API if subscription key exists
    if (braveApiKey) {
      try {
        const braveUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=12&safesearch=strict`;
        const response = await fetch(braveUrl, {
          headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": braveApiKey
          }
        });
        if (response.ok) {
          const data = await response.json();
          const results = (data.results || []).slice(0, 10).map((item: any) => ({
            title: item.title || query,
            contentUrl: item.properties?.url || item.thumbnail?.src || item.url,
            thumbnailUrl: item.thumbnail?.src || item.properties?.url || item.url,
            hostPageUrl: item.url
          })).filter((item: any) => Boolean(item.contentUrl));

          if (results.length > 0) {
            res.json({ results, source: "brave", query });
            return;
          }
        } else {
          console.warn("Brave API error status:", response.status, await response.text());
        }
      } catch (braveErr) {
        console.error("Brave Image Search API call failed:", braveErr);
      }
    }

    // Secondary fallback: DuckDuckGo / Open Image search if Bing key not present or failed
    try {
      const ddgUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json`;
      const ddgRes = await fetch(ddgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });
      if (ddgRes.ok) {
        const ddgData = await ddgRes.json();
        const results = (ddgData.results || []).slice(0, 10).map((item: any) => ({
          title: item.title,
          contentUrl: item.image,
          thumbnailUrl: item.thumbnail || item.image,
          hostPageUrl: item.url
        }));
        if (results.length > 0) {
          res.json({ results, source: "ddg", query });
          return;
        }
      }
    } catch (fallbackErr) {
      console.error("Fallback search failed:", fallbackErr);
    }

    // Fallback curated imagery if search returns nothing
    const encodedQ = encodeURIComponent(query);
    res.json({
      results: [
        {
          title: `${query} Official Poster`,
          contentUrl: `https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80`,
          thumbnailUrl: `https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=400&q=80`
        },
        {
          title: `${query} Stage Performance`,
          contentUrl: `https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80`,
          thumbnailUrl: `https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=400&q=80`
        },
        {
          title: `${query} Theatre Art`,
          contentUrl: `https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80`,
          thumbnailUrl: `https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=400&q=80`
        }
      ],
      source: "curated",
      query
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to search poster images" });
  }
});

// Endpoint: Refine personal review notes using Gemini
app.post("/api/gemini/refine-notes", async (req, res) => {
  try {
    const { text } = req.body;
    const inputText = (text || "").trim();
    if (!inputText) {
      res.status(400).json({ error: "Text is required to refine" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({ refinedText: inputText });
      return;
    }

    const prompt = `Refine the following personal theatre review notes for smooth sentence flow and fix any typos/grammar errors, while strictly preserving the writer's authentic voice, tone, and original ideas.

Original text:
"${inputText}"

Strict rules:
1. Fix typos, spelling, and grammar mistakes.
2. Smooth out sentence flow naturally.
3. Keep the same meaning, thoughts, and approximate length. Do NOT cut details or shorten significantly.
4. Do NOT use overly complex, pretentious, or fancy words that do not match the original simple writing style. Keep it natural and personal - do not overkill.
5. Output JSON with a single key "refinedText".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a gentle text editor. You polish personal reviews for typos and sentence flow without changing the author's voice or using hard/fancy words.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedText: { type: Type.STRING, description: "The refined personal review notes" }
          },
          required: ["refinedText"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      res.json({ refinedText: data.refinedText || inputText });
    } else {
      res.json({ refinedText: inputText });
    }
  } catch (err: any) {
    console.error("Gemini refine notes error:", err);
    res.status(500).json({ error: "Failed to refine notes with AI." });
  }
});

// Endpoint: AI Critic Insights & Summary
app.post("/api/gemini/insights", async (req, res) => {
  try {
    const { productions } = req.body;
    if (!Array.isArray(productions) || productions.length === 0) {
      res.status(400).json({ error: "Productions array is required" });
      return;
    }

    const ai = getGeminiClient();
    const summaryList = productions.slice(0, 15).map((p: any) =>
      `- "${p.title}" (${p.category}) on ${p.date} at ${p.venue}, Rating: ${p.rating}/5 stars. Notes: ${p.notes || "None"}`
    ).join("\n");

    if (!ai) {
      res.json({
        title: "Your Theatre Season at a Glance",
        summary: `You have logged ${productions.length} productions with an average high appreciation for live stagecraft!`,
        topGenre: "Musicals & Drama",
        personalizedQuote: "Theatre is a mirror, a sharp reflection of humanity.",
        recommendations: ["Hadestown", "Cabaret at the Kit Kat Club", "Merrily We Roll Along"]
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Analyze this theatre diary log and generate an inspiring, polished Theatre Critic Seasonal Report:\n\n${summaryList}`,
      config: {
        systemInstruction: "You are a warm, articulate, world-class Broadway & West End theatre critic analyzing a passionate theatre-goer's journal. Provide a literary review summary, aesthetic reflection, and recommendations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A poetic headline for this theater season (e.g., 'A Season of Grand Harmonies & Intimate Stagecraft')" },
            summary: { type: Type.STRING, description: "A 3-4 sentence warm critique summarizing their viewing themes, rating trends, and theatre passion." },
            topGenre: { type: Type.STRING, description: "Dominant theme or genre identified." },
            personalizedQuote: { type: Type.STRING, description: "An inspiring quote or custom theatrical proverb fit for this user." },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 highly recommended upcoming productions or classic shows they would love based on their logs."
            }
          },
          required: ["title", "summary", "topGenre", "personalizedQuote", "recommendations"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      res.json(data);
    } else {
      res.json({
        title: "Curated Stage Memories",
        summary: `An extraordinary journey through ${productions.length} theatrical experiences.`,
        topGenre: "Stage Productions",
        personalizedQuote: "All the world's a stage.",
        recommendations: ["Sweeney Todd", "Wicked", "Life of Pi"]
      });
    }
  } catch (err: any) {
    console.error("Gemini insights error:", err);
    res.status(500).json({ error: "Failed to generate AI insights." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
