import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Tv, 
  Compass, 
  BarChart3, 
  Zap, 
  User, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  BookOpen, 
  Hash, 
  TrendingUp, 
  Globe2, 
  ShieldAlert,
  Loader2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
  Calendar
} from "lucide-react";
import { Team, PredictionResult, NewsArticle, MatchFixture, LiveGame, LiveTeamAPI, LiveGroup, LiveStadium } from "./types";

function getFlagUrl(emoji: string) {
  if (!emoji) return '';
  const code = Array.from(emoji)
    .map(c => c.codePointAt(0))
    .map(c => (c && c >= 127397) ? String.fromCharCode(c - 127397).toLowerCase() : '')
    .join('');
  if (code.length === 2) {
    return `https://flagcdn.com/w40/${code}.png`;
  }
  // Fallbacks if not a 2 character code or standard flag emoji
  if (emoji === '🏴󠁧󠁢󠁥󠁮󠁧󠁿') return 'https://flagcdn.com/w40/gb-eng.png';
  if (emoji === '🏴󠁧󠁢󠁷󠁬󠁳󠁿') return 'https://flagcdn.com/w40/gb-wls.png';
  if (emoji === '🏴󠁧󠁢󠁳󠁣󠁴󠁿') return 'https://flagcdn.com/w40/gb-sct.png';
  return '';
}

function getFlagEmojiOrText(emoji: string) {
  if (emoji === '🏴󠁧󠁢󠁳󠁣󠁴󠁿') return 'SCO';
  if (emoji === '🏴󠁧󠁢󠁥󠁮󠁧󠁿') return 'ENG';
  if (emoji === '🏴󠁧󠁢󠁷󠁬󠁳󠁿') return 'WAL';
  return emoji;
}

const FlagImage = ({ emoji, className = "" }: { emoji?: string, className?: string }) => {
  if (!emoji) return <span className={className}>⚽</span>;
  const url = getFlagUrl(emoji);
  if (!url) return <span className={className}>{emoji}</span>;
  return <img src={url} alt="flag" className={`inline-block object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)] ${className}`} style={{ aspectRatio: '4/3' }} />;
};

function resolveKnockoutTeamName(teamName: string | undefined, label: string | undefined, gamesList: LiveGame[]): string {
  if (teamName && teamName !== "undefined" && teamName !== "TBD") {
    return teamName;
  }
  if (!label) return "TBD";

  const matchMatch = label.match(/Winner Match\s+(\d+)/i);
  if (matchMatch) {
    const prevMatchId = parseInt(matchMatch[1]);
    const prevGame = gamesList.find(g => g.id === String(prevMatchId));
    if (prevGame) {
      const h = prevGame.home_team_name_en;
      const a = prevGame.away_team_name_en;
      if (h && a && h !== "undefined" && a !== "undefined" && h !== "TBD" && a !== "TBD") {
        return `${h} / ${a}`;
      }
      const hLabel = prevGame.home_team_label || `Match ${prevGame.id} Winner`;
      const aLabel = prevGame.away_team_label || `Match ${prevGame.id} Winner`;
      return `${hLabel} / ${aLabel}`;
    }
  }
  return label;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"hub" | "center" | "stands" | "insights">("hub");

  // Data States
  const [teams, setTeams] = useState<Team[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);

  // Live API States
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [liveTeams, setLiveTeams] = useState<LiveTeamAPI[]>([]);
  const [liveGroups, setLiveGroups] = useState<LiveGroup[]>([]);
  const [liveStadiums, setLiveStadiums] = useState<LiveStadium[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);

  // Loading & Error States
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Search & Filter state for Match Hub
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConfederation, setSelectedConfederation] = useState<string>("ALL");
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<Team | null>(null);

  // Match Center State
  const [teamASelected, setTeamASelected] = useState<string>("Argentina");
  const [teamBSelected, setTeamBSelected] = useState<string>("France");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [simulationPrompt, setSimulationPrompt] = useState<string>("");

  // Standings state
  const [selectedGroup, setSelectedGroup] = useState<string>("A");
  const [showResults, setShowResults] = useState<boolean>(false);

  // Fetch initial data on mount
  useEffect(() => {
    fetchTeams();
    fetchLiveData();
  }, []);

  // Auto-refresh live data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveData();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch news when insights tab is activated
  useEffect(() => {
    if (activeTab === "insights" && news.length === 0) {
      fetchNews();
    }
  }, [activeTab]);

  // Update page title and description dynamically for SEO
  useEffect(() => {
    const titleMap = {
      hub: "Match Hub — FIFA World Cup 2026 AI Match Intelligence & Analytics",
      center: "Predictor Center — Run AI Match Simulation | FORIX",
      stands: "Group Standings & Rankings — FIFA World Cup 2026 | FORIX",
      insights: "AI Insights & Tactical Briefings — FIFA World Cup 2026 | FORIX",
    };
    const descMap = {
      hub: "Explore ELO ratings, key team statistics, and find qualified nations participating in the FIFA World Cup 2026.",
      center: "Simulate and forecast matchups between qualified nations using advanced Gemini AI tactical models.",
      stands: "View the latest standings, groups, and rankings for the FIFA World Cup 2026 generated from historical ELO indices.",
      insights: "Read high-quality football journalism, pre-tournament news, and deep tactical briefings generated by AI.",
    };

    document.title = titleMap[activeTab];

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", descMap[activeTab]);
    }

    // Also update dynamic Open Graph and Twitter tags for social SEO
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", titleMap[activeTab]);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", descMap[activeTab]);

    const twTitle = document.querySelector('meta[property="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", titleMap[activeTab]);

    const twDesc = document.querySelector('meta[property="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", descMap[activeTab]);
  }, [activeTab]);



  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      setErrorText(null);
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error(`Failed to fetch database.csv (Status: ${response.status})`);
      }
      const data = await response.json();
      setTeams(data);
      if (data.length >= 2) {
        setTeamASelected(data[0].team_name);
        setTeamBSelected(data[1].team_name);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText("Failed to load team database. Please verify the server is running.");
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchLiveData = async () => {
    try {
      setLoadingLive(true);
      const [gamesRes, groupsRes, teamsRes, stadiumsRes] = await Promise.all([
        fetch("/api/live/games"),
        fetch("/api/live/groups"),
        fetch("/api/live/teams"),
        fetch("/api/live/stadiums"),
      ]);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        const games: LiveGame[] = gamesData.games || [];
        setLiveGames(games);
        // Convert live games → MatchFixture shape for fixture cards
        const stadData = stadiumsRes.ok ? (await stadiumsRes.json()).stadiums || [] : [];
        setLiveStadiums(stadData);
        const stadMap: Record<string, LiveStadium> = {};
        stadData.forEach((s: LiveStadium) => { stadMap[s.id] = s; });
        const mapped: MatchFixture[] = games
          .map((g: LiveGame) => {
            const stad = stadMap[g.stadium_id];
            const isFinished = g.finished === "TRUE";
            const isLive = g.time_elapsed !== "notstarted" && g.time_elapsed !== "finished" && !isFinished;
            return {
              id: g.id,
              group: g.group,
              teamA: resolveKnockoutTeamName(g.home_team_name_en, g.home_team_label, games),
              teamB: resolveKnockoutTeamName(g.away_team_name_en, g.away_team_label, games),
              date: g.local_date.split(" ")[0],
              time: g.local_date.split(" ")[1] || "",
              stadium: stad ? `${stad.name_en}, ${stad.city_en}` : "",
              played: isFinished,
              score: isFinished || isLive ? `${g.home_score} - ${g.away_score}` : undefined,
            };
          });
        setFixtures(mapped);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setLiveGroups(groupsData.groups || []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setLiveTeams(teamsData.teams || []);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Live data fetch failed:", err);
    } finally {
      setLoadingLive(false);
    }
  };

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const response = await fetch("/api/news");
      if (!response.ok) {
        throw new Error("Failed to load insights feed");
      }
      const data = await response.json();
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNews(false);
    }
  };

  const triggerPrediction = async (overrideA?: string, overrideB?: string) => {
    // Normalize live API names → DB names so state, dropdowns, and metrics all match
    const NAME_ALIASES: Record<string, string> = {
      "united states": "USA",
      "czech republic": "Czechia",
      "democratic republic of the congo": "DR Congo",
      "dr congo": "DR Congo",
      "curaçao": "Curacao",
      "türkiye": "Turkey",
      "cabo verde": "Cape Verde",
      "korea republic": "South Korea",
      "ivory coast": "Ivory Coast",
      "cote d'ivoire": "Ivory Coast",
    };
    const norm = (n: string) => NAME_ALIASES[n.toLowerCase()] || n;

    const teamA = norm((overrideA && typeof overrideA === "string") ? overrideA : teamASelected);
    const teamB = norm((overrideB && typeof overrideB === "string") ? overrideB : teamBSelected);

    const isTbdPlaceholder = (name: string): boolean => {
      if (!name || name === "TBD" || name === "undefined") return true;
      const lower = name.toLowerCase();
      return lower.includes("winner") || lower.includes("runner-up") || lower.includes("match ") || lower.includes("group ") || lower.includes("/") || lower.includes("or");
    };

    if (isTbdPlaceholder(teamA) || isTbdPlaceholder(teamB)) {
      alert("This knockout matchup is not yet determined. Please select two qualified teams from the dropdowns to run your custom prediction simulation.");
      setPrediction(null);
      setLoadingPrediction(false);
      return;
    }

    if (teamA === teamB) {
      alert("Please select two different national teams for prediction.");
      return;
    }

    // Always sync state to the normalized (DB-canonical) name
    // so the dropdown highlights correctly AND metrics panel finds the team
    setTeamASelected(teamA);
    setTeamBSelected(teamB);

    try {
      setLoadingPrediction(true);
      setPrediction(null);

      const quotes = [
        "Analyzing historical Elo differentials...",
        "Evaluating offensive/defensive goal averages...",
        "Querying localized deep neural models...",
        "Processing confederation strength index...",
        "Simulating key tactical star player duels..."
      ];
      let quoteIdx = 0;
      setSimulationPrompt(quotes[0]);
      const quoteInterval = setInterval(() => {
        quoteIdx = (quoteIdx + 1) % quotes.length;
        setSimulationPrompt(quotes[quoteIdx]);
      }, 900);

      const response = await fetch("/api/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB })
      });

      clearInterval(quoteInterval);

      if (!response.ok) {
        throw new Error(`Server returned error status (${response.status})`);
      }

      const result: PredictionResult = await response.json();
      setPrediction(result);
    } catch (err: any) {
      console.error(err);
      setErrorText("The predictor encountered an issue. Using local metric algorithms for fallback prediction.");
      simulateLocalFallback(teamA, teamB);
    } finally {
      setLoadingPrediction(false);
    }
  };


  const simulateLocalFallback = (forceA?: string, forceB?: string) => {
    // Name alias map (mirrors triggerPrediction)
    const NAME_ALIASES: Record<string, string> = {
      "united states": "USA",
      "czech republic": "Czechia",
      "democratic republic of the congo": "DR Congo",
      "dr congo": "DR Congo",
      "curaçao": "Curacao",
      "türkiye": "Turkey",
      "cabo verde": "Cape Verde",
      "korea republic": "South Korea",
      "ivory coast": "Ivory Coast",
      "cote d'ivoire": "Ivory Coast",
    };
    const norm = (n?: string) => {
      if (!n) return "";
      return NAME_ALIASES[n.toLowerCase()] || n;
    };

    const nameA = norm((forceA && typeof forceA === "string") ? forceA : teamASelected);
    const nameB = norm((forceB && typeof forceB === "string") ? forceB : teamBSelected);
    const tA = teams.find(t => t.team_name.toLowerCase() === nameA.toLowerCase());
    const tB = teams.find(t => t.team_name.toLowerCase() === nameB.toLowerCase());
    if (!tA || !tB) return;

    const eloA = tA.elo_rating;
    const eloB = tB.elo_rating;

    // log(xG) = 0.1790 + 0.1845 * (EloDiff / 100)
    const intercept = 0.1790;
    const eloCoef = 0.1845;
    const xgA = Math.exp(intercept + eloCoef * (eloA - eloB) / 100);
    const xgB = Math.exp(intercept + eloCoef * (eloB - eloA) / 100);

    const poissonSample = (lam: number): number => {
      if (lam <= 0) return 0;
      const target = Math.exp(-lam);
      let k = 0;
      let p = 1.0;
      while (true) {
        k++;
        p *= Math.random();
        if (p <= target) break;
      }
      return k - 1;
    };

    const trials = 10000;
    let winA = 0;
    let winB = 0;
    let draw = 0;
    const scoreFreq: Record<string, Record<string, number>> = { a: {}, draw: {}, b: {} };

    for (let i = 0; i < trials; i++) {
      const ga = poissonSample(xgA);
      const gb = poissonSample(xgB);
      const key = `${ga}-${gb}`;
      if (ga > gb) {
        winA++;
        scoreFreq.a[key] = (scoreFreq.a[key] || 0) + 1;
      } else if (ga < gb) {
        winB++;
        scoreFreq.b[key] = (scoreFreq.b[key] || 0) + 1;
      } else {
        draw++;
        scoreFreq.draw[key] = (scoreFreq.draw[key] || 0) + 1;
      }
    }

    // Most likely outcome
    let outcome: 'a' | 'draw' | 'b' = 'draw';
    let maxCount = draw;
    if (winA > maxCount) {
      outcome = 'a';
      maxCount = winA;
    }
    if (winB > maxCount) {
      outcome = 'b';
      maxCount = winB;
    }

    const bucket = scoreFreq[outcome];
    let predictedScore = "1 - 1";
    let maxScoreCount = 0;
    for (const key in bucket) {
      if (bucket[key] > maxScoreCount) {
        maxScoreCount = bucket[key];
        predictedScore = key.replace("-", " - ");
      }
    }

    const tA_prob = Math.round((winA / trials) * 100);
    const tB_prob = Math.round((winB / trials) * 100);
    const d_prob = 100 - tA_prob - tB_prob;

    setPrediction({
      teamA_win_prob: tA_prob,
      teamB_win_prob: tB_prob,
      draw_prob: d_prob,
      predicted_score: predictedScore,
      analysis: `Computed technical breakdown between ${tA.team_name} and ${tB.team_name}. The high-altitude defensive records indicate a tactical match with heavy midfield struggle. ${tA.key_player} is expected to lead the offensive build-ups.`,
      key_battle: `Clash of styles: ${tA.team_name}'s attacking transition versus ${tB.team_name}'s standard low-block defense led by ${tB.key_player}.`,
      tactical_tip: `Under 2.5 goals is strongly backed based on the collective standard defensive lines (Simulated Fallback Insight).`
    });
  };

  // Compute stats for Standings tab
  const getGroupTeamsSorted = (groupLetter: string) => {
    const groupTeams = teams.filter(t => t.group.toUpperCase() === groupLetter.toUpperCase());
    // Sort logically: ELO rating (primary indicator of quality) + Goals Index
    return [...groupTeams].sort((a, b) => b.elo_rating - a.elo_rating);
  };

  // Filter teams for Hub list
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          team.key_player.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConfed = selectedConfederation === "ALL" || team.confederation === selectedConfederation;
    return matchesSearch && matchesConfed;
  });

  return (
    <div className="min-h-screen bg-bg-sleek text-brand-dark flex flex-col antialiased">
      {/* BRAND HEADER */}
      <header className="bg-white border-b border-border-sleek sticky top-0 z-50 shadow-header" id="forix-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto md:h-16 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="logo flex items-center text-2xl font-extrabold tracking-tight text-accent" id="logo-icon">
            ⚽ FORIX<span className="font-light text-sm text-subtle ml-2 tracking-wide uppercase">WC 2026 ANALYTICS</span>
          </div>

          {/* NAVIGATION TAB CONTROLS */}
          <nav className="flex items-center gap-6" id="main-navigation" role="tablist" aria-label="Main Navigation Tabs">
            <button
              onClick={() => setActiveTab("hub")}
              role="tab"
              aria-selected={activeTab === "hub"}
              aria-controls="screen-match-hub"
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "hub" ? "active" : ""
              }`}
              id="tab-match-hub"
            >
              Match Hub
            </button>
            <button
              onClick={() => setActiveTab("center")}
              role="tab"
              aria-selected={activeTab === "center"}
              aria-controls="screen-match-center"
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "center" ? "active" : ""
              }`}
              id="tab-match-center"
            >
              Match Center
            </button>
            <button
              onClick={() => setActiveTab("stands")}
              role="tab"
              aria-selected={activeTab === "stands"}
              aria-controls="screen-group-standings"
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "stands" ? "active" : ""
              }`}
              id="tab-standings"
            >
              Standings
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              role="tab"
              aria-selected={activeTab === "insights"}
              aria-controls="screen-insights"
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "insights" ? "active" : ""
              }`}
              id="tab-insights"
            >
              AI Insights
            </button>
          </nav>

          {/* Live data indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-subtle font-semibold" id="system-status">
            {loadingLive ? (
              <><Loader2 className="w-3 h-3 animate-spin text-accent" /> <span className="text-accent">Syncing...</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span className="text-emerald-600 font-bold">Live</span>
              {lastUpdated && <span className="text-subtle font-normal">· {lastUpdated.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
              <button onClick={fetchLiveData} title="Refresh" className="ml-1 hover:text-accent transition-colors cursor-pointer">
                <RefreshCw className="w-3 h-3" />
              </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* DYNAMIC CONTENT AREA */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Global Error Banner */}
        {errorText && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg flex items-start gap-3" id="error-banner">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-bold text-orange-850 text-sm">System Warning</h4>
              <p className="text-xs text-orange-800">{errorText}</p>
            </div>
            <button 
              onClick={() => setErrorText(null)} 
              className="text-orange-500 hover:text-orange-800 text-xs font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* LOADING DATABASE BANNER */}
        {loadingTeams && (
          <div className="sleek-card py-20 flex flex-col items-center justify-center" id="global-loading">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
            <h3 className="text-lg font-bold text-display">Assembling FORIX Engines</h3>
            <p className="text-xs text-subtle mt-1">Reading database.csv silently from localized indices...</p>
          </div>
        )}

        {/* SCREEN 1: MATCH HUB */}
        {!loadingTeams && activeTab === "hub" && (
          <div className="space-y-6" id="screen-match-hub">
            
            {/* HERO INTRODUCTION */}
            <div className="bg-hero-gradient text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6" id="hero-marketing">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-2xl font-extrabold tracking-tight text-display text-white" id="hero-title">
                  FIFA 2026 World Cup Analytical Console
                </h1>
                <p className="text-sm text-white/85 leading-relaxed font-normal" id="hero-p text">
                  Welcome to FORIX, the premier analytics dashboard for the upcoming 48-team 2026 World Cup. Explore Elo rankings, key player metric parameters, recent team form, and unleash customized predictive models in the Match Center to create deep tactical match forecasts.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-xs font-semibold text-white/90 bg-white/10 border border-white/5 px-3 py-1 rounded-full">48 Participant Teams</span>
                  <span className="text-xs font-semibold text-white bg-black/20 px-3 py-1 rounded-full">FORIX v4 AI Predictions</span>
                  <span className="text-xs font-semibold text-white/90 bg-white/10 border border-white/5 px-3 py-1 rounded-full">12 Groups A to L</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab("center")}
                className="bg-white hover:bg-white/90 text-accent px-5 py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                id="btn-simulate-now-hero"
              >
                Go to Predictor Center
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Hub layout: Left sidebar for search and filtering, right for lists */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left filter pane */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Search and Confederation filters */}
                <div className="sleek-card p-4 space-y-4" id="filters-container">
                  <h3 className="font-bold text-sm text-brand-dark tracking-tight flex items-center gap-2">
                    <Search className="w-4 h-4 text-subtle" />
                    Query Database
                  </h3>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search country or key player..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-sm bg-bg-sleek border border-border-sleek rounded-lg px-3 py-2 pl-9 outline-none focus:border-accent transition-all duration-150"
                      id="search-input-box"
                    />
                    <Search className="w-4 h-4 text-subtle absolute left-3 top-3" />
                  </div>

                  {/* Confederation Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-subtle">Confederation Filter</label>
                    <div className="flex flex-wrap gap-1.5" id="confederation-selectors">
                      {["ALL", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"].map(confed => (
                        <button
                          key={confed}
                          onClick={() => setSelectedConfederation(confed)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                            selectedConfederation === confed
                              ? "bg-accent text-white shadow-sm"
                              : "bg-bg-sleek hover:bg-gray-200 text-subtle"
                          }`}
                          id={`filter-confed-${confed}`}
                        >
                          {confed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team detail preview card */}
                <div className="sleek-card p-4" id="detail-preview-container">
                  <h3 className="font-bold text-sm text-brand-dark tracking-tight mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    Squad Inspector
                  </h3>
                  
                  {selectedTeamDetail ? (
                    <div className="space-y-4" id="selected-team-detail-card">
                      <div className="flex items-center gap-3">
                        <FlagImage emoji={selectedTeamDetail.flag_emoji} className="w-[1.25em] h-[0.9em] text-4xl mr-1" />
                        <div>
                          <h4 className="font-bold text-lg text-display text-brand-dark" id="detail-team-name">{selectedTeamDetail.team_name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-subtle">
                            <span className="bg-bg-sleek px-2 py-0.5 rounded font-semibold">{selectedTeamDetail.confederation}</span>
                            <span>•</span>
                            <span>Group {selectedTeamDetail.group}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid inside Squad Inspector */}
                      <div className="grid grid-cols-2 gap-3 bg-bg-sleek p-3 rounded-lg text-xs" id="detail-stats-grid">
                        <div className="space-y-1">
                          <p className="text-subtle font-medium">Elo Rating</p>
                          <p className="font-display font-bold text-sm text-brand-dark">{selectedTeamDetail.elo_rating}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-subtle font-medium">Recent Form</p>
                          <div className="flex items-center gap-1">
                            {selectedTeamDetail.recent_form.split(",").map((result, idx) => (
                              <span 
                                key={idx} 
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                                  result === "W" ? "bg-emerald-500" : result === "D" ? "bg-yellow-500" : "bg-red-500"
                                }`}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-subtle font-medium">Avg Goals Scored</p>
                          <p className="font-bold text-brand-dark">{selectedTeamDetail.avg_goals_scored.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-subtle font-medium">Avg Goals Conceded</p>
                          <p className="font-bold text-brand-dark">{selectedTeamDetail.avg_goals_conceded.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="border-t border-border-sleek pt-3 text-xs space-y-1" id="detail-key-player-grid">
                        <p className="text-subtle font-semibold uppercase tracking-wider text-[10px]">Star Catalyst</p>
                        <p className="font-bold text-brand-dark text-sm">{selectedTeamDetail.key_player}</p>
                        <p className="text-subtle bg-[#EFF3FF] p-1.5 rounded font-semibold">{selectedTeamDetail.key_player_stat}</p>
                      </div>

                      {/* Head-to-Head shortcut button */}
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setTeamASelected(selectedTeamDetail.team_name);
                            setActiveTab("center");
                          }}
                          className="flex-1 bg-[#EFF3FF] text-accent hover:bg-[#EFF3FF]/80 text-center text-xs font-bold py-2 rounded-lg transition-all cursor-pointer"
                          id="btn-shortcut-teama"
                        >
                          Select Team A
                        </button>
                        <button
                          onClick={() => {
                            setTeamBSelected(selectedTeamDetail.team_name);
                            setActiveTab("center");
                          }}
                          className="flex-1 bg-bg-sleek text-subtle hover:bg-gray-200 text-center text-xs font-bold py-2 rounded-lg transition-all cursor-pointer"
                          id="btn-shortcut-teamb"
                        >
                          Select Team B
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10" id="no-team-selected-detail">
                      <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Select any of the 48 qualified countries from the list to reveal squad metrics.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Right list pane - list of 48 teams */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 48 Teams List */}
                <div className="sleek-card p-5" id="teams-database-list-container">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm tracking-tight text-brand-dark" id="list-heading">
                      Qualified Nations ({filteredTeams.length} displayed)
                    </h3>
                    <p className="text-xs text-subtle">Click to reveal credentials</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2" id="teams-grid-container">
                    {filteredTeams.map((team, idx) => (
                      <div
                        key={team.team_name}
                        onClick={() => setSelectedTeamDetail(team)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-accent hover:shadow-sleek transition-all duration-200 ${
                          selectedTeamDetail?.team_name === team.team_name 
                            ? "border-accent bg-[#EFF3FF]/30" 
                            : "border-border-sleek bg-white"
                        }`}
                        id={`team-card-${team.team_name}`}
                      >
                        <div className="flex items-center gap-3">
                          <FlagImage emoji={team.flag_emoji} className="w-[1.2em] h-[0.9em] text-2xl mr-1" />
                          <div>
                            <p className="font-bold text-sm text-brand-dark">{team.team_name}</p>
                            <span className="text-[10px] text-subtle font-semibold bg-bg-sleek px-1.5 py-0.5 rounded">Group {team.group} • {team.confederation}</span>
                          </div>
                        </div>

                        {/* Quick stats indicators */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-[10px] text-subtle font-medium">Elo Rating</p>
                            <p className="font-display font-bold text-xs text-brand-dark">{team.elo_rating}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-subtle" />
                        </div>
                      </div>
                    ))}

                    {filteredTeams.length === 0 && (
                      <div className="col-span-2 text-center py-10" id="no-search-results">
                        <ShieldAlert className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                        <h4 className="font-bold text-sm text-brand-dark">No Qualified Team matches search filter</h4>
                        <p className="text-xs text-subtle mt-1">Please try modifying search coordinates or clear confederation constraints.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Fixture Schedule Block */}
                <div className="sleek-card p-5" id="fixtures-schedule-container">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-rose-500" />
                      <h3 className="font-bold text-sm tracking-tight text-brand-dark" id="schedule-heading">
                        FIFA 2026 — Live Match Schedule
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold text-emerald-600">LIVE DATA</span>
                    </div>
                  </div>

                  {loadingLive && fixtures.length === 0 ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-subtle text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" /> Loading live matches...
                    </div>
                  ) : (() => {
                    // Helper to render a fixture card
                    const renderCard = (fixture: MatchFixture) => {
                      const liveGame = liveGames.find(g => g.id === fixture.id);
                      const liveTeamA = liveTeams.find(t => t.name_en === fixture.teamA);
                      const liveTeamB = liveTeams.find(t => t.name_en === fixture.teamB);
                      const tA = teams.find(t => t.team_name === fixture.teamA);
                      const tB = teams.find(t => t.team_name === fixture.teamB);
                      const isFinished = liveGame?.finished === "TRUE";
                      const isLive = liveGame && liveGame.time_elapsed !== "notstarted" && liveGame.time_elapsed !== "finished" && !isFinished;
                      const flagA = liveTeamA?.flag;
                      const flagB = liveTeamB?.flag;
                      return (
                        <div
                          key={fixture.id}
                          className={`bg-bg-sleek p-3 rounded-lg border text-xs space-y-2.5 transition-all font-medium ${
                            isLive ? "border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]" :
                            isFinished ? "border-gray-200 opacity-80" : "border-border-sleek hover:border-gray-300"
                          }`}
                          id={`fixture-card-${fixture.id}`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold">
                            <span className="font-bold bg-white border border-border-sleek px-1.5 py-0.5 rounded text-subtle">{fixture.group.length === 1 ? `Group ${fixture.group}` : fixture.group}</span>
                            <div className="flex items-center gap-1.5">
                              {isLive && <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>LIVE {liveGame?.time_elapsed}</span>}
                              {isFinished && <span className="bg-gray-700 text-white px-2 py-0.5 rounded font-bold text-[9px] tracking-widest">FULL TIME</span>}
                              {!isLive && !isFinished && <span className="flex items-center gap-1 text-subtle"><Clock className="w-3 h-3" />{fixture.time}</span>}
                              <span className="flex items-center gap-1 text-subtle"><Calendar className="w-3 h-3 text-accent" />{fixture.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-around font-bold py-2 bg-white rounded border border-border-sleek text-brand-dark">
                            <div className="flex items-center gap-1.5">
                              {flagA ? <img src={flagA} alt={fixture.teamA} className="h-4 shadow-sm rounded-[2px]" /> : <FlagImage emoji={tA?.flag_emoji} className="w-[1.25em] h-[0.9em]" />}
                              <span className="text-[11px]">{fixture.teamA}</span>
                            </div>
                            {(isFinished || isLive) && fixture.score ? (
                              <span className={`text-sm font-extrabold px-2 py-0.5 rounded ${
                                isLive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                              }`}>{fixture.score}</span>
                            ) : (
                              <span className="text-subtle text-[10px] font-bold">VS</span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px]">{fixture.teamB}</span>
                              {flagB ? <img src={flagB} alt={fixture.teamB} className="h-4 shadow-sm rounded-[2px]" /> : <FlagImage emoji={tB?.flag_emoji} className="w-[1.25em] h-[0.9em]" />}
                            </div>
                          </div>
                          {isFinished && liveGame && liveGame.home_scorers && liveGame.home_scorers !== "null" && (
                            <div className="text-[10px] font-semibold px-1 flex justify-between">
                              <span className="text-emerald-700">{liveGame.home_scorers.replace(/[{}"]|null/g, "")}</span>
                              <span className="text-rose-600">{liveGame.away_scorers !== "null" ? liveGame.away_scorers.replace(/[{}"]|null/g, "") : ""}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-subtle flex items-center gap-1 font-semibold truncate max-w-[55%]"><MapPin className="w-3 h-3 text-accent shrink-0" />{fixture.stadium.split(",")[0]}</span>
                            {!isFinished && (
                              <button
                                onClick={() => { setActiveTab("center"); triggerPrediction(fixture.teamA, fixture.teamB); }}
                                className="bg-accent text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer hover:bg-accent/90 transition-colors shrink-0"
                                id={`fixture-btn-predict-${fixture.id}`}
                              >Predict</button>
                            )}
                          </div>
                        </div>
                      );
                    };

                    // Helper to parse fixture date and time into comparison timestamp
                    const getFixtureTimestamp = (f: MatchFixture) => {
                      const [m, d, y] = f.date.split("/").map(Number);
                      const [hr, min] = f.time.split(":").map(Number);
                      return new Date(y, m - 1, d, hr || 0, min || 0).getTime();
                    };

                     const upcomingFixtures = fixtures
                       .filter(f => {
                         const g = liveGames.find(lg => lg.id === f.id);
                         return !g || g.finished !== "TRUE";
                       })
                       .sort((a, b) => {
                         // 1. Prioritize active LIVE matches at the absolute top of the list
                         const gA = liveGames.find(lg => lg.id === a.id);
                         const gB = liveGames.find(lg => lg.id === b.id);
                         const isLiveA = gA && gA.time_elapsed !== "notstarted" && gA.time_elapsed !== "finished" && gA.finished !== "TRUE";
                         const isLiveB = gB && gB.time_elapsed !== "notstarted" && gB.time_elapsed !== "finished" && gB.finished !== "TRUE";
                         if (isLiveA && !isLiveB) return -1;
                         if (isLiveB && !isLiveA) return 1;
 
                         // 2. Sort chronologically by date and time (nearest match first)
                         return getFixtureTimestamp(a) - getFixtureTimestamp(b);
                       });
 
                     const finishedFixtures = fixtures
                       .filter(f => {
                         const g = liveGames.find(lg => lg.id === f.id);
                         return g && g.finished === "TRUE";
                       })
                       .sort((a, b) => {
                         // Sort reverse-chronologically for results (most recently concluded first)
                         return getFixtureTimestamp(b) - getFixtureTimestamp(a);
                       });

                    return (
                      <div className="space-y-5">
                        {/* ── UPCOMING MATCHES ── */}
                        {upcomingFixtures.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>Upcoming Matches ({upcomingFixtures.length})
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="fixtures-list-container">
                              {upcomingFixtures.map(renderCard)}
                            </div>
                          </div>
                        )}

                        {/* ── RESULTS ── collapsible */}
                        {finishedFixtures.length > 0 && (
                          <div>
                            <button
                              onClick={() => setShowResults(v => !v)}
                              className="w-full flex items-center justify-between text-[10px] font-bold text-subtle uppercase tracking-widest py-2.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                              id="toggle-results-btn"
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                Results — {finishedFixtures.length} match{finishedFixtures.length !== 1 ? "es" : ""} completed
                              </span>
                              <span className={`transition-transform duration-200 ${showResults ? "rotate-180" : ""}`}>▼</span>
                            </button>
                            {showResults && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3" id="results-list-container">
                                {finishedFixtures.map(renderCard)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>

            {/* FAQ ACCORDION SECTION (GEO - Generative Engine Optimization & Factual Citation Anchor) */}
            <section className="sleek-card p-6 space-y-4" id="forix-faq-section" aria-labelledby="faq-section-title">
              <h2 className="text-lg font-bold tracking-tight text-display text-brand-dark flex items-center gap-2" id="faq-section-title">
                <BookOpen className="w-5 h-5 text-accent" />
                Frequently Answered Analytical Enquiries (FORIX FAQ)
              </h2>
              <p className="text-xs text-subtle leading-relaxed">
                Review verified sports intelligence parameters, ELO computation protocols, and simulation coordinates used by search algorithms and generative models to extract FORIX match reports.
              </p>

              <div className="space-y-3" id="faq-accordion-group">
                <details className="group border border-border-sleek rounded-lg p-3 bg-bg-sleek/50 transition-all hover:bg-bg-sleek" id="faq-item-1">
                  <summary className="font-bold text-xs text-brand-dark cursor-pointer list-none flex justify-between items-center outline-none">
                    <span>How are the FORIX World Cup Elo ratings calculated?</span>
                    <span className="text-subtle transition-transform group-open:rotate-180 text-[10px]">▼</span>
                  </summary>
                  <p className="text-xs text-subtle mt-2 leading-relaxed font-medium">
                    FORIX Elo ratings are formulated dynamically from historical international fixtures. The rating vectors adjust for opponent team strength, home field parameters, confederation coefficients, and goal indexes. Higher rating coordinates denote superior historical performance indicators.
                  </p>
                </details>

                <details className="group border border-border-sleek rounded-lg p-3 bg-bg-sleek/50 transition-all hover:bg-bg-sleek" id="faq-item-2">
                  <summary className="font-bold text-xs text-brand-dark cursor-pointer list-none flex justify-between items-center outline-none">
                    <span>How does the FORIX AI Predictor simulate match scorelines?</span>
                    <span className="text-subtle transition-transform group-open:rotate-180 text-[10px]">▼</span>
                  </summary>
                  <p className="text-xs text-subtle mt-2 leading-relaxed font-medium">
                    The AI simulator analyzes team statistics including average goals scored per match, average goals conceded per match, key star player metric stats, and Elo differentials. It computes Win-Draw-Loss probabilities and derives a deterministic, probability-aligned predicted scoreline.
                  </p>
                </details>

                <details className="group border border-border-sleek rounded-lg p-3 bg-bg-sleek/50 transition-all hover:bg-bg-sleek" id="faq-item-3">
                  <summary className="font-bold text-xs text-brand-dark cursor-pointer list-none flex justify-between items-center outline-none">
                    <span>Are live scores and group standings updated in real time?</span>
                    <span className="text-subtle transition-transform group-open:rotate-180 text-[10px]">▼</span>
                  </summary>
                  <p className="text-xs text-subtle mt-2 leading-relaxed font-medium">
                    Yes. Tournament match fixtures, actual scores, and group tables are retrieved via live API streams at 60-second refresh intervals. Live and finished match badges update automatically, and standings correctly calculate matches played (MP), goal differences (GD), and points (PTS).
                  </p>
                </details>
              </div>
            </section>

          </div>
        )}

        {/* SCREEN 2: MATCH CENTER (AI Predictions) */}
        {!loadingTeams && activeTab === "center" && (
          <div className="space-y-6" id="screen-match-center">
            
            {/* INSTRUCTOR CARD */}
            <div className="sleek-card p-6" id="center-intro">
              <h1 className="text-xl font-bold tracking-tight text-display text-brand-dark flex items-center gap-2" id="prediction-title">
                <Sparkles className="w-5 h-5 text-amber-500" />
                FORIX AI Predictive Analyst
              </h1>
              <p className="text-sm text-subtle mt-1 leading-relaxed" id="predictor-instruction">
                Choose any two qualified nations. The neural network compares their relative ELO ratings, offensive output index, historical defensive concessions, and confederation distribution to formulate a full tactical match simulation.
              </p>
            </div>

            {/* SELECTION GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Selector & Head to Head comparator values */}
              <div className="sleek-card p-5 space-y-6" id="h2h-comparator-container">
                <h3 className="font-bold text-xs tracking-wider text-subtle uppercase pb-2 border-b border-border-sleek">
                  Matchup Selection Panel (Direct database comparison)
                </h3>

                {/* Dropdowns */}
                <div className="grid grid-cols-2 gap-4" id="selection-selectors">
                  
                  {/* Selector A */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-dark flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                      Home Side (Team A)
                    </label>
                    <select
                      value={teamASelected}
                      onChange={(e) => {
                        setTeamASelected(e.target.value);
                        setPrediction(null);
                      }}
                      className="w-full text-sm bg-bg-sleek border border-border-sleek rounded-lg px-3 py-2 outline-none focus:border-accent font-semibold text-brand-dark transition-colors cursor-pointer"
                      id="team-a-dropdown"
                    >
                      {teams.map(t => (
                        <option key={t.team_name} value={t.team_name}>{getFlagEmojiOrText(t.flag_emoji)} {t.team_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selector B */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-dark flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      Away Side (Team B)
                    </label>
                    <select
                      value={teamBSelected}
                      onChange={(e) => {
                        setTeamBSelected(e.target.value);
                        setPrediction(null);
                      }}
                      className="w-full text-sm bg-bg-sleek border border-border-sleek rounded-lg px-3 py-2 outline-none focus:border-accent font-semibold text-brand-dark transition-colors cursor-pointer"
                      id="team-b-dropdown"
                    >
                      {teams.map(t => (
                        <option key={t.team_name} value={t.team_name}>{getFlagEmojiOrText(t.flag_emoji)} {t.team_name}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Head-to-head metric table */}
                {(() => {
                  const tA = teams.find(t => t.team_name === teamASelected);
                  const tB = teams.find(t => t.team_name === teamBSelected);
                  if (!tA || !tB) return null;

                  return (
                    <div className="space-y-4" id="direct-metric-table">
                      <div className="bg-bg-sleek p-4 rounded-xl space-y-4 border border-border-sleek">
                        <h4 className="text-[10px] font-bold text-subtle uppercase tracking-wider text-center">Metric Comparatives</h4>
                        
                        {/* Elo Comparatives */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark">
                            <span>{tA.team_name} ({tA.elo_rating})</span>
                            <span className="text-subtle text-[11px] font-normal">Elo rating differential</span>
                            <span>{tB.team_name} ({tB.elo_rating})</span>
                          </div>
                          {/* Comparative visual bar */}
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${(tA.elo_rating / (tA.elo_rating + tB.elo_rating)) * 100}%` }}
                              className="bg-accent h-full"
                            ></div>
                            <div 
                              style={{ width: `${(tB.elo_rating / (tA.elo_rating + tB.elo_rating)) * 100}%` }}
                              className="bg-rose-600 h-full"
                            ></div>
                          </div>
                        </div>

                        {/* Scored Comparison */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark">
                            <span>{tA.avg_goals_scored.toFixed(2)}/g</span>
                            <span className="text-subtle text-[11px] font-normal">Avg Goals Scored</span>
                            <span>{tB.avg_goals_scored.toFixed(2)}/g</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${(tA.avg_goals_scored / (tA.avg_goals_scored + tB.avg_goals_scored)) * 100}%` }}
                              className="bg-accent h-full"
                            ></div>
                            <div 
                              style={{ width: `${(tB.avg_goals_scored / (tA.avg_goals_scored + tB.avg_goals_scored)) * 100}%` }}
                              className="bg-rose-600 h-full"
                            ></div>
                          </div>
                        </div>

                        {/* Conceded Comparison */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark">
                            <span>{tA.avg_goals_conceded.toFixed(2)}/g</span>
                            <span className="text-subtle text-[11px] font-normal">Avg Goals Conceded</span>
                            <span>{tB.avg_goals_conceded.toFixed(2)}/g</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${(tA.avg_goals_conceded / (tA.avg_goals_conceded + tB.avg_goals_conceded)) * 100}%` }}
                              className="bg-accent h-full"
                            ></div>
                            <div 
                              style={{ width: `${(tB.avg_goals_conceded / (tA.avg_goals_conceded + tB.avg_goals_conceded)) * 100}%` }}
                              className="bg-rose-600 h-full"
                            ></div>
                          </div>
                        </div>

                      </div>

                      {/* STAR PLAYERS PRE-MATCH COMPARISONS */}
                      <div className="grid grid-cols-2 gap-4 text-xs" id="combatants-cards-container">
                        <div className="p-3 border border-border-sleek rounded-lg space-y-1 bg-[#EFF3FF]/30">
                          <p className="text-[10px] text-accent font-extrabold uppercase tracking-wider">Home Specialist Catalyst</p>
                          <p className="font-bold text-brand-dark">{tA.key_player}</p>
                          <p className="text-subtle font-medium text-[11px]">{tA.key_player_stat}</p>
                        </div>
                        <div className="p-3 border border-border-sleek rounded-lg space-y-1 bg-rose-50/20">
                          <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider">Away Specialist Catalyst</p>
                          <p className="font-bold text-brand-dark">{tB.key_player}</p>
                          <p className="text-subtle font-medium text-[11px]">{tB.key_player_stat}</p>
                        </div>
                      </div>

                      {/* Simulator trigger button */}
                      <button
                        onClick={() => triggerPrediction()}
                        disabled={loadingPrediction}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-extrabold tracking-wide py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer h-12"
                        id="btn-trigger-ai-prediction"
                      >
                        {loadingPrediction ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                            <span>{simulationPrompt}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                            <span>Run AI Match Prediction</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}

              </div>

              {/* Right panel: Prediction Results Display */}
              <div className="sleek-card p-5 flex flex-col justify-center" id="forecast-output-container">
                
                {loadingPrediction && (
                  <div className="text-center py-20 space-y-4" id="prediction-loading-view">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
                    <h4 className="text-lg font-bold text-display text-brand-dark">Formulating Forecast Matrices</h4>
                    <p className="text-xs text-subtle max-w-[280px] mx-auto">Evaluating neural permutations and squad stats from the CSV database...</p>
                  </div>
                )}

                {!loadingPrediction && !prediction && (
                  <div className="text-center py-20" id="empty-prediction-view">
                    <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-display text-subtle">Ready for Match Kickoff</h3>
                    <p className="text-xs text-subtle max-w-sm mx-auto mt-1">Select your team parameters on the left and dispatch the forecast simulation command. Real ELO and goal indexes will guide the neural network output.</p>
                  </div>
                )}

                {!loadingPrediction && prediction && (
                  <div className="space-y-6" id="prediction-result-display-card">
                    
                    {/* Header outcome title */}
                    <div className="bg-hero-gradient text-white rounded-xl py-6 px-4 text-center relative overflow-hidden mb-4 shadow-md" id="prediction-hero-match">
                      <h2 className="sr-only">{teamASelected} vs {teamBSelected} AI Match Prediction</h2>
                      <div className="absolute top-2 right-3 text-[10px] font-bold tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full uppercase text-white/90">
                        {prediction.tactical_tip?.includes("Real-time") ? prediction.tactical_tip : "AI Prediction Outcome"}
                      </div>
                      
                      {/* Score display */}
                      <div className="flex items-center justify-around mt-4">
                        <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                          <FlagImage emoji={teams.find(t=>t.team_name === teamASelected)?.flag_emoji} className="w-[1.2em] h-[0.9em] text-4xl" />
                          <span className="font-extrabold text-[#FFFFFF] text-sm tracking-wide uppercase truncate max-w-[100px]">{teamASelected}</span>
                        </div>
                        <div className="font-black text-4xl tracking-widest bg-black/20 px-5 py-2.5 rounded-lg border border-white/10" id="predicted-score-bubble">
                          {prediction.predicted_score}
                        </div>
                        <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                          <FlagImage emoji={teams.find(t=>t.team_name === teamBSelected)?.flag_emoji} className="w-[1.2em] h-[0.9em] text-4xl" />
                          <span className="font-extrabold text-[#FFFFFF] text-sm tracking-wide uppercase truncate max-w-[100px]">{teamBSelected}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/70 mt-4 font-semibold uppercase tracking-wider">
                        {prediction.tactical_tip?.includes("Real-time") ? "Official Match Scoreline (Real Results)" : "Final Predicted Score (Full Match)"}
                      </p>
                    </div>

                    {/* Probability Gauge Bar */}
                    <div className="space-y-2" id="probability-gauge">
                      <p className="text-xs font-bold text-subtle uppercase tracking-tight text-center">Win Probability Coordinates</p>
                      
                      <div className="h-5 rounded-lg overflow-hidden flex text-[10px] font-bold text-white text-center">
                        <div 
                          style={{ width: `${prediction.teamA_win_prob}%` }} 
                          className="bg-accent flex items-center justify-center"
                          id="prob-teama"
                        >
                          {prediction.teamA_win_prob}%
                        </div>
                        <div 
                          style={{ width: `${prediction.draw_prob}%` }} 
                          className="bg-subtle flex items-center justify-center opacity-85"
                          id="prob-draw"
                        >
                          Draw ({prediction.draw_prob}%)
                        </div>
                        <div 
                          style={{ width: `${prediction.teamB_win_prob}%` }} 
                          className="bg-rose-600 flex items-center justify-center"
                          id="prob-teamb"
                        >
                          {prediction.teamB_win_prob}%
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold text-subtle px-1 pt-1">
                        <span className="text-accent">{teamASelected} Win</span>
                        <span>Tie Chance</span>
                        <span className="text-rose-600">{teamBSelected} Win</span>
                      </div>
                    </div>

                    {/* Technical Analysis Output */}
                    <div className="space-y-4 text-xs" id="technical-analysis-blocks">
                      <div className="bg-bg-sleek p-3.5 rounded-lg border-l-4 border-accent space-y-1">
                        <h4 className="font-bold text-brand-dark uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          Generative Tactical Report
                        </h4>
                        <p className="text-subtle leading-relaxed font-medium" id="analysis-text-paragraph">{prediction.analysis}</p>
                      </div>

                      <div className="bg-bg-sleek p-3.5 rounded-lg border-l-4 border-rose-500 space-y-1">
                        <h4 className="font-bold text-brand-dark uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                          Star Battle Ground
                        </h4>
                        <p className="text-subtle leading-relaxed font-medium" id="key-battle-paragraph">{prediction.key_battle}</p>
                      </div>

                      <div className="bg-orange-50/50 p-3.5 rounded-lg border border-orange-200/50 space-y-1">
                        <h4 className="font-bold text-amber-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Pro Insight & Strategic Angle
                        </h4>
                        <p className="text-amber-950 font-semibold" id="tactical-tip-paragraph">{prediction.tactical_tip}</p>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* SCREEN 3: GROUP STANDINGS */}
        {!loadingTeams && activeTab === "stands" && (
          <div className="space-y-6" id="screen-group-standings">

            <div className="sleek-card p-6 flex flex-col md:flex-row items-center justify-between gap-4" id="standings-intro">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-display text-brand-dark flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  FIFA 2026 World Cup — Live Group Standings
                </h1>
                <p className="text-sm text-subtle mt-1 leading-relaxed">
                  Real-time standings from the official tournament. Updated automatically every 60 seconds.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-emerald-600">Live Data</span>
                <button onClick={fetchLiveData} className="flex items-center gap-1 text-subtle hover:text-accent transition-colors cursor-pointer ml-2 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Selector bar for Groups A-L */}
            <div className="sleek-card p-3.5 flex flex-wrap gap-1.5 justify-around" id="group-tabs-selector">
              {["A","B","C","D","E","F","G","H","I","J","K","L"].map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedGroup(letter)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedGroup === letter ? "bg-accent text-white shadow-sm" : "bg-bg-sleek text-subtle hover:bg-gray-200"
                  }`}
                  id={`tab-select-group-${letter}`}
                >Group {letter}</button>
              ))}
            </div>

            {/* Standing and Leaderboards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Live Group Table */}
              <div className="lg:col-span-7 sleek-card p-5 space-y-4" id="group-standings-table-container">
                <h3 className="font-bold text-sm text-brand-dark flex items-center justify-between">
                  <span>GROUP {selectedGroup} TABLE</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Live
                  </span>
                </h3>

                {(() => {
                  const liveGroup = liveGroups.find(g => g.name === selectedGroup);
                  const groupTeamsSorted = liveGroup
                    ? [...liveGroup.teams].sort((a, b) => {
                        const pts = parseInt(b.pts) - parseInt(a.pts);
                        if (pts !== 0) return pts;
                        const gd = parseInt(b.gd) - parseInt(a.gd);
                        if (gd !== 0) return gd;
                        return parseInt(b.gf) - parseInt(a.gf);
                      })
                    : [];

                  return (
                    <div className="overflow-x-auto" id="table-scroll-container">
                      <table className="w-full text-xs text-left" id="group-standings-table">
                        <thead>
                          <tr className="border-b border-border-sleek text-subtle uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 pr-2">#</th>
                            <th className="py-2.5">Nation</th>
                            <th className="py-2.5 text-center">MP</th>
                            <th className="py-2.5 text-center">W</th>
                            <th className="py-2.5 text-center">D</th>
                            <th className="py-2.5 text-center">L</th>
                            <th className="py-2.5 text-center">GF</th>
                            <th className="py-2.5 text-center">GA</th>
                            <th className="py-2.5 text-center">GD</th>
                            <th className="py-2.5 text-center font-extrabold text-accent">PTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupTeamsSorted.map((entry, idx) => {
                            const liveTeamInfo = liveTeams.find(t => t.id === entry.team_id);
                            const fallbackTeam = teams.find(t => t.team_name === liveTeamInfo?.name_en);
                            const name = liveTeamInfo?.name_en || `Team ${entry.team_id}`;
                            const flag = liveTeamInfo?.flag;
                            const isQualifying = idx < 2;
                            return (
                              <tr
                                key={entry.team_id}
                                className={`border-b border-bg-sleek last:border-0 transition-all font-medium text-brand-dark ${
                                  isQualifying ? "bg-emerald-50/40" : "hover:bg-bg-sleek/50"
                                }`}
                                id={`row-standing-${entry.team_id}`}
                              >
                                <td className="py-3 font-bold pr-2">
                                  <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                                    isQualifying ? "bg-emerald-500 text-white" : "bg-bg-sleek text-subtle"
                                  }`}>{idx + 1}</span>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    {flag ? <img src={flag} alt={name} className="h-4 rounded-[2px] shadow-sm" /> : <FlagImage emoji={fallbackTeam?.flag_emoji} className="w-[1.25em] h-[0.9em]" />}
                                    <span className="font-bold">{name}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-center text-subtle">{entry.mp}</td>
                                <td className="py-3 text-center text-emerald-600 font-bold">{entry.w}</td>
                                <td className="py-3 text-center text-yellow-600 font-bold">{entry.d}</td>
                                <td className="py-3 text-center text-red-500 font-bold">{entry.l}</td>
                                <td className="py-3 text-center">{entry.gf}</td>
                                <td className="py-3 text-center">{entry.ga}</td>
                                <td className="py-3 text-center">{entry.gd}</td>
                                <td className="py-3 text-center">
                                  <span className="font-extrabold text-accent bg-[#EFF3FF] px-2 py-0.5 rounded">{entry.pts}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="bg-emerald-50 p-3 rounded-lg text-xs text-emerald-700 leading-relaxed font-semibold border border-emerald-100 flex items-center gap-2" id="group-qualification-p-tag">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  Top 2 teams qualify automatically. 8 best third-placed teams also advance to Round of 32.
                </div>
              </div>

              {/* Right Column: Elo & Goals leaders charts */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Elo leaderboards */}
                <div className="sleek-card p-5 space-y-4" id="elo-leaderboards">
                  <h3 className="font-bold text-sm tracking-tight text-brand-dark flex items-center gap-1.5 uppercase text-subtle text-[10px]">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Top 5 World Cup Elo Leaders (Fifa 2026 participants)
                  </h3>

                  <div className="space-y-3" id="elo-leader-list">
                    {[...teams].sort((a,b)=>b.elo_rating - a.elo_rating).slice(0,5).map((team, idx) => (
                      <div 
                        key={team.team_name}
                        onClick={() => {
                          setSelectedTeamDetail(team);
                          setActiveTab("hub");
                        }}
                        className="flex items-center justify-between p-2 hover:bg-bg-sleek hover:border-accent hover:shadow-sleek rounded-lg cursor-pointer transition-all border border-border-sleek bg-white"
                        id={`elo-leader-row-${team.team_name}`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="font-bold text-subtle w-4">#{idx+1}</span>
                          <FlagImage emoji={team.flag_emoji} className="w-[1.25em] h-[0.9em]" />
                          <span className="text-brand-dark">{team.team_name}</span>
                        </div>
                        <span className="font-display font-bold text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded">
                          {team.elo_rating} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals leaders chart */}
                <div className="sleek-card p-5 space-y-4" id="goals-leaders">
                  <h3 className="font-bold text-sm tracking-tight text-brand-dark flex items-center gap-1.5 uppercase text-subtle text-[10px]">
                    <Globe2 className="w-4 h-4 text-accent" />
                    Top 5 offensive scoring engines (avg goals)
                  </h3>

                  <div className="space-y-3" id="goals-leaders-list">
                    {[...teams].sort((a,b)=>b.avg_goals_scored - a.avg_goals_scored).slice(0,5).map((team, idx) => (
                      <div 
                        key={team.team_name}
                        onClick={() => {
                          setSelectedTeamDetail(team);
                          setActiveTab("hub");
                        }}
                        className="flex items-center justify-between p-2 hover:bg-bg-sleek hover:border-accent hover:shadow-sleek rounded-lg cursor-pointer transition-all border border-border-sleek bg-white"
                        id={`goals-leader-row-${team.team_name}`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="font-bold text-subtle w-4">#{idx+1}</span>
                          <FlagImage emoji={team.flag_emoji} className="w-[1.25em] h-[0.9em]" />
                          <span className="text-brand-dark">{team.team_name}</span>
                        </div>
                        <span className="font-display font-medium text-xs bg-[#EFF3FF] text-accent px-2 py-0.5 rounded">
                          {team.avg_goals_scored.toFixed(2)} goals/g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* SCREEN 4: INSIGHTS & WORLD CUP ANALYSIS FEED */}
        {!loadingTeams && activeTab === "insights" && (
          <div className="space-y-6" id="screen-insights">
            
            <div className="sleek-card p-6" id="insights-introduction">
              <h1 className="text-xl font-bold tracking-tight text-display text-brand-dark flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                World Cup Analytical Analysis Hub
              </h1>
              <p className="text-sm text-subtle mt-1 leading-relaxed">
                Unlock daily analytics digests, tactical projections, and group reviews fabricated live through localized FORIX AI analytical models. Keep up to date with deep technical breakdowns of qualified heavyweight contenders.
              </p>
            </div>

            {loadingNews ? (
              <div className="sleek-card py-20 text-center" id="loading-news-card">
                <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
                <h4 className="font-bold text-brand-dark">Interrogating Analytical Feed</h4>
                <p className="text-xs text-subtle mt-1">Generating World Cup briefings dynamically via the FORIX Sports AI Engine.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="news-grid-container">
                {news.map(article => (
                  <article 
                    key={article.id}
                    className="sleek-card p-5 flex flex-col justify-between hover:border-accent hover:shadow-sleek transition-all space-y-4 bg-white"
                    id={`news-card-${article.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={`px-2.5 py-1 rounded-full uppercase text-[9px] font-bold ${
                          article.category === "Tactics" 
                            ? "bg-rose-50 text-rose-700" 
                            : article.category === "Insight" 
                            ? "bg-[#EFF3FF] text-accent font-bold" 
                            : "bg-blue-50 text-blue-750"
                        }`}>
                          {article.category}
                        </span>
                        <div className="flex items-center gap-3 text-subtle">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-accent" />{article.readTime}</span>
                          <span>•</span>
                          <span>{article.date}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-brand-dark hover:text-accent transition" id={`news-title-${article.id}`}>
                        {article.title}
                      </h3>
                      <p className="text-xs text-subtle font-medium leading-relaxed bg-bg-sleek p-2.5 rounded-lg border-l-2 border-accent">
                        {article.summary}
                      </p>
                      
                      <div className="text-xs text-brand-dark/90 space-y-2 leading-relaxed pt-2">
                        {/* Render long form content cleanly */}
                        <p>{article.content}</p>
                      </div>
                    </div>

                    {/* Tags footer */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border-sleek" id={`news-tags-${article.id}`}>
                      {article.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-bg-sleek text-subtle text-[10px] font-bold px-2 py-0.5 rounded-full"
                        >
                          #{tag.toLowerCase()}
                        </span>
                      ))}
                    </div>

                  </article>
                ))}

                {news.length === 0 && (
                  <div className="col-span-2 text-center py-10 bg-white rounded-xl border border-border-sleek" id="no-news-found">
                    <ShieldAlert className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-brand-dark">No analysis stories found</h4>
                    <p className="text-xs text-subtle mt-1">Please make sure database.csv is properly loaded to enable predictive content generator feeds.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-border-sleek py-6 mt-12 text-center text-xs text-subtle" id="forix-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2 font-medium">
          <p>© 2026 FORIX Sports Analytics Inc. All statistics read and tracked directly from root database catalogs.</p>
          <div className="flex justify-center items-center gap-4 text-accent font-bold">
            <a href="#" className="hover:underline">Terms of Intelligence</a>
            <span>•</span>
            <a href="#" className="hover:underline">FIFA 2026 API Regulations</a>
            <span>•</span>
            <a href="#" className="hover:underline">Secrets Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
