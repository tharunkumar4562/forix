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
import { Team, PredictionResult, NewsArticle, MatchFixture } from "./types";
import { WORLD_CUP_FIXTURES } from "./fixtures";

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

const FlagImage = ({ emoji, className = "" }: { emoji?: string, className?: string }) => {
  if (!emoji) return <span className={className}>⚽</span>;
  const url = getFlagUrl(emoji);
  if (!url) return <span className={className}>{emoji}</span>;
  return <img src={url} alt="flag" className={`inline-block object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)] ${className}`} style={{ aspectRatio: '4/3' }} />;
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"hub" | "center" | "stands" | "insights">("hub");

  // Data States
  const [teams, setTeams] = useState<Team[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [fixtures, setFixtures] = useState<MatchFixture[]>(WORLD_CUP_FIXTURES);
  
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

  // Fetch initial database items on mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch news when insights tab is activated
  useEffect(() => {
    if (activeTab === "insights" && news.length === 0) {
      fetchNews();
    }
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
      
      // Seed default dropdowns if database exists
      if (data.length >= 2) {
        setTeamASelected(data[0].team_name);
        setTeamBSelected(data[1].team_name);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText("Failed to correctly load World Cup 2026 database.csv. Please verify the file exists.");
    } finally {
      setLoadingTeams(false);
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

  const triggerPrediction = async () => {
    if (teamASelected === teamBSelected) {
      alert("Please select two different national teams for prediction.");
      return;
    }
    
    try {
      setLoadingPrediction(true);
      setPrediction(null);
      
      // Dynamic loading quotes list
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
        body: JSON.stringify({ teamA: teamASelected, teamB: teamBSelected })
      });

      clearInterval(quoteInterval);

      if (!response.ok) {
        throw new Error(`Server returned error status (${response.status})`);
      }

      const result: PredictionResult = await response.json();
      setPrediction(result);
    } catch (err: any) {
      console.error(err);
      setErrorText("The neural predictor encountered an issue. Using local metric algorithms for fallback prediction.");
      // Rule-based fallback calculation
      simulateLocalFallback();
    } finally {
      setLoadingPrediction(false);
    }
  };

  const simulateLocalFallback = () => {
    const tA = teams.find(t => t.team_name === teamASelected);
    const tB = teams.find(t => t.team_name === teamBSelected);
    if (!tA || !tB) return;

    const eloDiff = tA.elo_rating - tB.elo_rating;
    const goalsDiff = (tA.avg_goals_scored - tA.avg_goals_conceded) - (tB.avg_goals_scored - tB.avg_goals_conceded);
    
    let baseA = 35 + (eloDiff / 15) + (goalsDiff * 10);
    let baseB = 35 - (eloDiff / 15) - (goalsDiff * 10);
    let draw = 30;

    if (baseA < 15) { baseA = 15; baseB = 55; }
    if (baseB < 15) { baseB = 15; baseA = 55; }
    
    const total = baseA + baseB + draw;
    const tA_prob = Math.round((baseA / total) * 100);
    const tB_prob = Math.round((baseB / total) * 100);
    const d_prob = 100 - tA_prob - tB_prob;

    const scoreA = Math.max(0, Math.round(tA.avg_goals_scored + (eloDiff > 200 ? 1 : 0) - 0.2));
    const scoreB = Math.max(0, Math.round(tA.avg_goals_conceded + 0.2));

    setPrediction({
      teamA_win_prob: tA_prob,
      teamB_win_prob: tB_prob,
      draw_prob: d_prob,
      predicted_score: `${scoreA} - ${scoreB}`,
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
          <nav className="flex items-center gap-6" id="main-navigation">
            <button
              onClick={() => setActiveTab("hub")}
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "hub" ? "active" : ""
              }`}
              id="tab-match-hub"
            >
              Match Hub
            </button>
            <button
              onClick={() => setActiveTab("center")}
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "center" ? "active" : ""
              }`}
              id="tab-match-center"
            >
              Match Center
            </button>
            <button
              onClick={() => setActiveTab("stands")}
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "stands" ? "active" : ""
              }`}
              id="tab-standings"
            >
              Standings
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`nav-item-sleek px-3 py-2 cursor-pointer ${
                activeTab === "insights" ? "active" : ""
              }`}
              id="tab-insights"
            >
              AI Insights
            </button>
          </nav>

          {/* System status display */}
          <div className="hidden md:block text-xs text-subtle font-semibold" id="system-status">
            System Status: <span className="text-[#10B981] font-bold">Live Data</span>
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
                <h2 className="text-2xl font-extrabold tracking-tight text-display text-white" id="hero-title">
                  FIFA 2026 World Cup Analytical Console
                </h2>
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

                {/* Fixture Schedule Block */}
                <div className="sleek-card p-5" id="fixtures-schedule-container">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-rose-500" />
                      <h3 className="font-bold text-sm tracking-tight text-brand-dark" id="schedule-heading">
                        FIFA 2026 World Cup Heavyweight Group Showdowns
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Exhibition Schedule</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="fixtures-list-container">
                    {fixtures.map((fixture) => {
                      const tA = teams.find(t => t.team_name === fixture.teamA);
                      const tB = teams.find(t => t.team_name === fixture.teamB);
                      return (
                        <div 
                          key={fixture.id}
                          className="bg-bg-sleek p-3 rounded-lg border border-border-sleek text-xs space-y-3 hover:border-gray-300 transition-all font-medium"
                          id={`fixture-card-${fixture.id}`}
                        >
                          {/* Fixture Metadata */}
                          <div className="flex items-center justify-between text-[10px] text-subtle font-semibold">
                            <span className="font-bold bg-white border border-border-sleek px-1.5 py-0.2 rounded">Group {fixture.group}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-accent" /> {fixture.date}</span>
                          </div>

                          {/* Matchup Teams Banner */}
                          <div className="flex items-center justify-around font-bold py-1.5 bg-white rounded border border-border-sleek text-brand-dark">
                            <div className="flex items-center gap-1.5">
                              <FlagImage emoji={tA?.flag_emoji} className="w-[1.25em] h-[0.9em]" />
                              <span>{fixture.teamA}</span>
                            </div>
                            <span className="text-subtle text-[10px]">VS</span>
                            <div className="flex items-center gap-1.5">
                              <span>{fixture.teamB}</span>
                              <FlagImage emoji={tB?.flag_emoji} className="w-[1.25em] h-[0.9em]" />
                            </div>
                          </div>

                          {/* Predict Quick Button */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-subtle flex items-center gap-1 font-semibold"><MapPin className="w-3 h-3 text-accent" /> {fixture.stadium.split(",")[0]}</span>
                            <button
                              onClick={() => {
                                setTeamASelected(fixture.teamA);
                                setTeamBSelected(fixture.teamB);
                                setActiveTab("center");
                                // Auto load predict
                                triggerPrediction();
                              }}
                              className="bg-accent text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer hover:bg-accent/90 transition-colors"
                              id={`fixture-btn-predict-${fixture.id}`}
                            >
                              Predict Match
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* SCREEN 2: MATCH CENTER (AI Predictions) */}
        {!loadingTeams && activeTab === "center" && (
          <div className="space-y-6" id="screen-match-center">
            
            {/* INSTRUCTOR CARD */}
            <div className="sleek-card p-6" id="center-intro">
              <h2 className="text-xl font-bold tracking-tight text-display text-brand-dark flex items-center gap-2" id="prediction-title">
                <Sparkles className="w-5 h-5 text-amber-500" />
                FORIX AI Predictive Analyst
              </h2>
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
                        <option key={t.team_name} value={t.team_name}>{t.flag_emoji} {t.team_name}</option>
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
                        <option key={t.team_name} value={t.team_name}>{t.flag_emoji} {t.team_name}</option>
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
                        onClick={triggerPrediction}
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
                      <div className="absolute top-2 right-3 text-[10px] font-bold tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full uppercase text-white/90">
                        AI Prediction Outcome
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
                      <p className="text-[10px] text-white/70 mt-4 font-semibold uppercase tracking-wider">Final Predicted Score (Full Match)</p>
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
                <h2 className="text-xl font-bold tracking-tight text-display text-brand-dark flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  FIFA 2026 World Cup Group Tables & Leaderboards
                </h2>
                <p className="text-sm text-subtle mt-1 leading-relaxed">
                  Analyze dynamic positions for groups A through L. Standing sorting indexes are mathematically parsed based on ELO quality score and recent form.
                </p>
              </div>
            </div>

            {/* Selector bar for Groups A-L */}
            <div className="sleek-card p-3.5 flex flex-wrap gap-1.5 justify-around" id="group-tabs-selector">
              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedGroup(letter)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedGroup === letter
                      ? "bg-accent text-white shadow-sm"
                      : "bg-bg-sleek text-subtle hover:bg-gray-200"
                  }`}
                  id={`tab-select-group-${letter}`}
                >
                  Group {letter}
                </button>
              ))}
            </div>

            {/* Standing and Leaderboards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Group Table */}
              <div className="lg:col-span-7 sleek-card p-5 space-y-4" id="group-standings-table-container">
                <h3 className="font-bold text-sm text-brand-dark flex items-center justify-between">
                  <span>WORLD CUP GROUP {selectedGroup} STANDINGS</span>
                  <span className="text-[10px] text-accent font-bold bg-[#EFF3FF] px-2 py-0.5 rounded">Dynamic Prediction</span>
                </h3>

                <div className="overflow-x-auto" id="table-scroll-container">
                  <table className="w-full text-xs text-left" id="group-standings-table">
                    <thead>
                      <tr className="border-b border-border-sleek text-subtle uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Pos</th>
                        <th className="py-2.5">Nation</th>
                        <th className="py-2.5 text-center">Elo Rating</th>
                        <th className="py-2.5 text-center">Form</th>
                        <th className="py-2.5 text-center">Avg Scored</th>
                        <th className="py-2.5 text-center">Avg Conceded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getGroupTeamsSorted(selectedGroup).map((team, idx) => (
                        <tr 
                          key={team.team_name} 
                          className="border-b border-bg-sleek last:border-0 hover:bg-bg-sleek/50 transition-all font-medium text-brand-dark"
                          id={`row-standing-${team.team_name}`}
                        >
                          <td className="py-3 font-bold pr-1">{idx + 1}</td>
                          <td className="py-3 flex items-center gap-2">
                            <FlagImage emoji={team.flag_emoji} className="w-[1.25em] h-[0.9em] text-xl mr-0.5" />
                            <span className="font-bold text-brand-dark">{team.team_name}</span>
                          </td>
                          <td className="py-3 text-center">{team.elo_rating}</td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {team.recent_form.split(",").map((result, i) => (
                                <span 
                                  key={i} 
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                                    result === "W" ? "bg-emerald-500" : result === "D" ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                >
                                  {result}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-center font-mono">{team.avg_goals_scored.toFixed(2)}</td>
                          <td className="py-3 text-center font-mono">{team.avg_goals_conceded.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#EFF3FF]/50 p-3 rounded-lg text-xs text-accent leading-relaxed font-semibold border border-[#EFF3FF]/40" id="group-qualification-p-tag">
                  Top 2 positions within each group automatically advance, alongside the top 8 best third-place teams to complete the Round of 32 knockout bracket.
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
              <h2 className="text-xl font-bold tracking-tight text-display text-brand-dark flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                World Cup Analytical Analysis Hub
              </h2>
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
                  <div 
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

                  </div>
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
