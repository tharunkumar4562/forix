import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent and error handling
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize Gemini AI SDK:", err);
  }
}

// -------------------------------------------------------------
// CSV Parsing & Team Data Management
// -------------------------------------------------------------
interface Team {
  team_name: string;
  group: string;
  elo_rating: number;
  recent_form: string;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  key_player: string;
  key_player_stat: string;
  flag_emoji: string;
  confederation: string;
}

let cachedTeams: Team[] = [];

function loadTeamsDatabase(): Team[] {
  if (cachedTeams.length > 0) return cachedTeams;

  try {
    let csvPath = path.resolve(process.cwd(), "database.csv");
    if (!fs.existsSync(csvPath)) {
      csvPath = path.resolve(__dirname, "database.csv");
    }
    if (!fs.existsSync(csvPath)) {
      csvPath = path.resolve(__dirname, "../database.csv");
    }
    if (!fs.existsSync(csvPath)) {
      console.warn("database.csv not found! Returning empty list.");
      return [];
    }

    const csvText = fs.readFileSync(csvPath, "utf-8");
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim());
    const parsed: Team[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Split by comma with double quote handling
      const matches = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const rowObj: any = {};

      headers.forEach((header, index) => {
        let val = matches[index] ? matches[index].trim() : "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        rowObj[header] = val;
      });

      // Parse numerical parameters safely
      parsed.push({
        team_name: rowObj.team_name || "Unknown Team",
        group: rowObj.group || "A",
        elo_rating: parseInt(rowObj.elo_rating || "1500", 10),
        recent_form: rowObj.recent_form || "W,D,L,W,D",
        avg_goals_scored: parseFloat(rowObj.avg_goals_scored || "1.0"),
        avg_goals_conceded: parseFloat(rowObj.avg_goals_conceded || "1.0"),
        key_player: rowObj.key_player || "N/A",
        key_player_stat: rowObj.key_player_stat || "N/A",
        flag_emoji: rowObj.flag_emoji || "⚽",
        confederation: rowObj.confederation || "UEFA",
      });
    }

    cachedTeams = parsed;
    return parsed;
  } catch (error) {
    console.error("Error loading/parsing database.csv:", error);
    return [];
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", api_configured: !!ai });
});

// GET list of all teams (pulled in-memory from database.csv)
app.get("/api/teams", (req, res) => {
  try {
    const teams = loadTeamsDatabase();
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch teams", message: err.message });
  }
});

// POST to generate AI Predictions based on team stats
app.post("/api/prediction", async (req, res) => {
  const { teamA, teamB } = req.body;
  if (!teamA || !teamB) {
    return res.status(400).json({ error: "Missing team parameters. Both teamA and teamB are required." });
  }

  try {
    // Normalize live API team names → database.csv team names
    const NAME_ALIASES: Record<string, string> = {
      "united states": "USA",
      "usa": "USA",
      "czech republic": "Czechia",
      "democratic republic of the congo": "DR Congo",
      "dr congo": "DR Congo",
      "ivory coast": "Ivory Coast",
      "cote d'ivoire": "Ivory Coast",
      "curacao": "Curacao",
      "curaçao": "Curacao",
      "cape verde": "Cape Verde",
      "cabo verde": "Cape Verde",
      "south korea": "South Korea",
      "korea republic": "South Korea",
      "türkiye": "Turkey",
      "turkey": "Turkey",
    };
    const normalizeTeam = (name: string): string => NAME_ALIASES[name.toLowerCase()] || name;

    const normalizedA = normalizeTeam(teamA);
    const normalizedB = normalizeTeam(teamB);

    const allTeams = loadTeamsDatabase();
    const teamAData = allTeams.find(t => t.team_name.toLowerCase() === normalizedA.toLowerCase());
    const teamBData = allTeams.find(t => t.team_name.toLowerCase() === normalizedB.toLowerCase());

    if (!teamAData || !teamBData) {
      console.error(`Teams not found: '${normalizedA}' (from '${teamA}'), '${normalizedB}' (from '${teamB}')`);
      return res.status(404).json({ error: `Teams not found in database: '${normalizedA}', '${normalizedB}'` });
    }

    // Build prediction context
    const context = `
      You are analyzing a football match in the FIFA World Cup 2026.
      Compare these two teams based on their real stats and recent records:
      
      TEAM 1:
      - Name: ${teamAData.team_name} ${teamAData.flag_emoji}
      - Group: ${teamAData.group}
      - Elo Rating: ${teamAData.elo_rating}
      - Confederation: ${teamAData.confederation}
      - Recent Form: ${teamAData.recent_form}
      - Goals Scored per Game: ${teamAData.avg_goals_scored}
      - Goals Conceded per Game: ${teamAData.avg_goals_conceded}
      - Key Star Player: ${teamAData.key_player} (${teamAData.key_player_stat})

      TEAM 2:
      - Name: ${teamBData.team_name} ${teamBData.flag_emoji}
      - Group: ${teamBData.group}
      - Elo Rating: ${teamBData.elo_rating}
      - Confederation: ${teamBData.confederation}
      - Recent Form: ${teamBData.recent_form}
      - Goals Scored per Game: ${teamBData.avg_goals_scored}
      - Goals Conceded per Game: ${teamBData.avg_goals_conceded}
      - Key Star Player: ${teamBData.key_player} (${teamBData.key_player_stat})
    `;

    let predictionResult;

    if (!ai) {
      console.warn("FORIX AI Engine is not available. Falling back to rule-based prediction.");
    } else {
      try {
        // Call AI API with precise structured output format
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `
            Analyze this World Cup match between Team A (${teamAData.team_name}) and Team B (${teamBData.team_name}).
            ${context}
            
            Provide your forecast with probabilities (teamA_win_prob, teamB_win_prob, draw_prob) which must add up to exactly 100.
            Generate a realistic predicted scoreline string, a sharp 3-sentence analysis, a key player clash description, and a strategic insight tip.
          `,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                teamA_win_prob: { type: Type.INTEGER, description: "Win probability for Team A (should sum with draw and Team B to 100)" },
                teamB_win_prob: { type: Type.INTEGER, description: "Win probability for Team B" },
                draw_prob: { type: Type.INTEGER, description: "Draw probability" },
                predicted_score: { type: Type.STRING, description: "Realistic score prediction like 2 - 1, 0 - 0, or 1 - 2" },
                analysis: { type: Type.STRING, description: "A highly expert tactical pre-match analysis (3 sentences max)" },
                key_battle: { type: Type.STRING, description: "Description of the key star-player duel / battlefield coordinate on the pitch" },
                tactical_tip: { type: Type.STRING, description: "Pro strategic insight recommendation" }
              },
              required: ["teamA_win_prob", "teamB_win_prob", "draw_prob", "predicted_score", "analysis", "key_battle", "tactical_tip"]
            }
          }
        });
        predictionResult = JSON.parse(response.text?.trim() || "{}");
      } catch (err: any) {
        console.error("FORIX AI Engine prediction error, falling back");
      }
    }

    if (!predictionResult || Object.keys(predictionResult).length === 0) {
      // Rule-based fallback
      const eloDiff = teamAData.elo_rating - teamBData.elo_rating;
      const goalsDiff = (teamAData.avg_goals_scored - teamAData.avg_goals_conceded) - (teamBData.avg_goals_scored - teamBData.avg_goals_conceded);
      
      let baseA = 35 + (eloDiff / 15) + (goalsDiff * 10);
      let baseB = 35 - (eloDiff / 15) - (goalsDiff * 10);
      let draw = 30;

      // Safeguard boundaries
      if (baseA < 15) { baseA = 15; baseB = 55; }
      if (baseB < 15) { baseB = 15; baseA = 55; }
      
      const total = baseA + baseB + draw;
      const tA_prob = Math.round((baseA / total) * 100);
      const tB_prob = Math.round((baseB / total) * 100);
      const d_prob = 100 - tA_prob - tB_prob;

      const scoreA = Math.max(0, Math.round(((teamAData.avg_goals_scored + teamBData.avg_goals_conceded) / 2) + (eloDiff / 400) + (Math.random() * 1.5 - 0.5)));
      const scoreB = Math.max(0, Math.round(((teamBData.avg_goals_scored + teamAData.avg_goals_conceded) / 2) - (eloDiff / 400) + (Math.random() * 1.5 - 0.5)));

      predictionResult = {
        teamA_win_prob: tA_prob,
        teamB_win_prob: tB_prob,
        draw_prob: d_prob,
        predicted_score: `${scoreA} - ${scoreB}`,
        analysis: `${teamAData.team_name} and ${teamBData.team_name} look set for a spectacular clash. With ${teamAData.team_name}'s ELO of ${teamAData.elo_rating} and ${teamBData.team_name}'s ELO of ${teamBData.elo_rating}, the rating metrics support a highly tactical contest. ${teamAData.key_player} will be the key catalyst for the home team.`,
        key_battle: `Midfield struggle between the high-tempo transitional play of ${teamAData.team_name} and the structured block organization of ${teamBData.team_name}. Watch out for ${teamAData.key_player} versus the tactical lines of ${teamBData.key_player}.`,
        tactical_tip: `With ${teamAData.team_name} averaging ${teamAData.avg_goals_scored} goals and ${teamBData.team_name} conceding ${teamBData.avg_goals_conceded}, anticipating a highly defensive game pattern is strategically sound.`
      };
    }

    res.json(predictionResult);

  } catch (error: any) {
    console.error("Prediction endpoint generic error:", error);
    res.status(500).json({ error: "Failed to process prediction request" });
  }
});

// GET to obtain dynamic tournament insights/news
app.get("/api/news", async (req, res) => {
  try {
    const allTeams = loadTeamsDatabase();
    
    let newsResult;

    if (!ai) {
      console.warn("FORIX AI Engine is not available. Returning simulated World Cup news block.");
    } else {
      const simpleTeamsList = allTeams.slice(0, 15).map(t => `${t.team_name} (ELO: ${t.elo_rating}, Group: ${t.group}, Key Player: ${t.key_player})`).join(", ");

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `
            Generate 3 rich, realistic FIFA World Cup 2026 news articles or pre-tournament analytical briefings based on this data.
            Relevant high ELO teams list: ${simpleTeamsList}.
            Provide the articles in JSON format exactly fitting the schema provided. Make it extremely dramatic, realistic, high professional grade football journalism.
          `,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Catchy analytical header" },
                  category: { type: Type.STRING, description: "Category of article like Insight, Tactics, Preview, or Breaking" },
                  summary: { type: Type.STRING, description: "1-sentence executive hook" },
                  content: { type: Type.STRING, description: "Detailed 3-paragraph news or technical analysis piece" },
                  date: { type: Type.STRING, description: "Formatted date string like June 9, 2026" },
                  readTime: { type: Type.STRING, description: "Estimated duration like '3 min read'" },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "title", "category", "summary", "content", "date", "readTime", "tags"]
              }
            }
          }
        });

        newsResult = JSON.parse(response.text?.trim() || "[]");
      } catch (err: any) {
        console.error("FORIX AI Engine news insights failure, falling back");
      }
    }

    if (!newsResult || newsResult.length === 0) {
      newsResult = [
        {
          id: "news-1",
          title: `Chasing Gold: Argentina to face European Powerhouse France in Group B`,
          category: "Insight",
          summary: "A breakdown of Group B's heavyweight collision as Messi's final tournament begins.",
          content: "Group B takes center stage in the World Cup 2026 draw with Argentina and France set to collide. Argentina boasts an ELO rating of 2080, while Mbappe's France closely pressures them at 2040. Tactics observers are predicting a fast-evolving match with transition plays deciding the outcome.",
          date: "June 9, 2026",
          readTime: "4 min read",
          tags: ["Group B", "重磅", " heavyweight"]
        },
        {
          id: "news-2",
          title: `Rising Giants: Can Spain's Lamine Yamal Dominate Group D?`,
          category: "Tactics",
          summary: "How Spain’s tactical orchestrator is proving crucial in qualification phases.",
          content: "Lamine Yamal's 7 qualifier assists have put European champions Spain (ELO 2010) in an advantageous position. Standing across from them in Group D are van Dijk's solid Netherlands side. This tactical duel will test Spain's central possession play vs the physical counter blocks of the Dutch team.",
          date: "June 9, 2026",
          readTime: "3 min read",
          tags: ["Spain", "Tactical analysis", "Group D"]
        },
        {
          id: "news-3",
          title: `Underdog Spotlight: New Zealand and Canada Prepare for Group A Invasions`,
          category: "Preview",
          summary: "Hosts Canada alongside traditional Oceania champions look to cause major upsets.",
          content: "Group A holds fascinating narratives. Hosting country Canada (ELO 1750) joins forces with New Zealand (ELO 1550). Armed with Chris Wood's qualification goal-records, New Zealand expects to spring surprises on regional giants USA and Mexico in packed, vibrant stadiums.",
          date: "June 8, 2026",
          readTime: "5 min read",
          tags: ["Hosts", "Group A", "Canada", "New Zealand"]
        }
      ];
    }

    res.json(newsResult);

  } catch (err: any) {
    console.error("Generic news endpoint failure:", err);
    res.status(500).json({ error: "Failed to generate dynamic tournament news", message: err.message });
  }
});


// -------------------------------------------------------------
// Live Data Proxy Routes (worldcup26.ir)
// 60-second server-side cache to avoid hammering the source API
// -------------------------------------------------------------

interface CacheEntry { data: any; ts: number; }
const liveCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 60_000; // 60 seconds

async function fetchLive(url: string): Promise<any> {
  const now = Date.now();
  const cached = liveCache[url];
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Upstream ${url} returned ${res.status}`);
  const data = await res.json();
  liveCache[url] = { data, ts: now };
  return data;
}

app.get("/api/live/games", async (_req, res) => {
  try {
    const data = await fetchLive("https://worldcup26.ir/get/games");
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch live games", message: err.message });
  }
});

app.get("/api/live/groups", async (_req, res) => {
  try {
    const data = await fetchLive("https://worldcup26.ir/get/groups");
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch live groups", message: err.message });
  }
});

app.get("/api/live/teams", async (_req, res) => {
  try {
    const data = await fetchLive("https://worldcup26.ir/get/teams");
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch live teams", message: err.message });
  }
});

app.get("/api/live/stadiums", async (_req, res) => {
  try {
    const data = await fetchLive("https://worldcup26.ir/get/stadiums");
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch live stadiums", message: err.message });
  }
});

// -------------------------------------------------------------
// Vite and Static Assets Routing Setup
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with Vite HMR
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    console.log("Vite middleware mounted in Development mode.");
  } else {
    // Production Mode with static files serving
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    console.log("Static file server running in Production mode serving from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FORIX Application Server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
