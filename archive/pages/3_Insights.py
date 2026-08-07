import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from utils.api_football import FootballAPI
from utils.gemini_helper import GeminiAI

# Global Layout Initialization
st.set_page_config(page_title="FORIX Hub", layout="wide", initial_sidebar_state="collapsed")

# Instantiating clean data handlers
api = FootballAPI()
ai = GeminiAI()

# ------------------------------------------------------------------------------
# 2. GLOBAL STYLING & CSS RULES (ALIGNED WITH app.py & MULTI-PAGE SYMMETRY)
# ------------------------------------------------------------------------------
style_html = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght=400;500;600;700;800;900&display=swap');

:root {
  --primary: #006B3C;
  --accent: #FFD700;
  --bg: #F8F9FA;
  --card-bg: #FFFFFF;
  --text-primary: #1A1A2E;
  --text-secondary: #555570;
  --border: #E8ECF0;
  --shadow: 0 4px 12px rgba(0,0,0,0.06);
}

html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
  background-color: var(--bg) !important;
  font-family: 'Inter', sans-serif !important;
  color: var(--text-primary) !important;
}

/* Header style override */
.header-banner {
  background-color: #FFFFFF;
  padding: 24px 32px;
  border-bottom: 3px solid var(--primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.header-logo {
  font-size: 32px;
  font-weight: 900;
  color: var(--primary);
  margin: 0;
  letter-spacing: -0.5px;
}
.header-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
  font-weight: 500;
}
.status-pill {
  background-color: #E8F5E9;
  color: var(--primary);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* Form badges */
.pill-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 10px;
  color: #FFFFFF;
  text-transform: uppercase;
  margin-right: 4px;
}
.pill-w { background-color: #2E7D32; }
.pill-d { background-color: #F9A825; }
.pill-l { background-color: #C62828; }

/* Interactive button overrides */
html div.stButton > button {
  background-color: var(--primary) !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  border: none !important;
  padding: 12px 24px !important;
  font-size: 13px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  width: 100% !important;
  text-align: center;
}
html div.stButton > button:hover {
  background-color: #004D2C !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Fallback Warning Card */
.warning-card {
  background: #FFFDE7;
  border: 1px solid #FFF59D;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}
</style>
"""
st.markdown(style_html, unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 3. SIDEBAR NAVIGATION
# ------------------------------------------------------------------------------
st.sidebar.markdown("<h2 style='color:#006B3C; margin:0; font-weight:800;'>⚽ FORIX</h2>", unsafe_allow_html=True)
st.sidebar.markdown("<p style='font-size:12px; color:#555570; margin-bottom:20px; font-weight:600;'>FIFA World Cup 2026 AI Analytical Console</p>", unsafe_allow_html=True)

st.sidebar.page_link("app.py", label="Match Hub", icon="⚽")
st.sidebar.page_link("pages/1_Match_Center.py", label="Match Center", icon="🔮")
st.sidebar.page_link("pages/2_Standings.py", label="Standings", icon="📊")
st.sidebar.page_link("pages/3_Insights.py", label="AI Insights", icon="💡")

st.sidebar.markdown("---")
st.sidebar.markdown("<h4 style='margin:0; font-weight:700;'>About FORIX</h4>", unsafe_allow_html=True)
st.sidebar.markdown("Access tactical briefings, dynamic news drafts, and pro summaries tailored via local database credentials.")
st.sidebar.markdown("---")
st.sidebar.markdown("<p style='font-size:10px; color:#555570; font-weight:500;'>Built with ❤️ for football fans<br>© 2026 FORIX Sports Analytics Inc.</p>", unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 4. DATABASE & KEY MANAGEMENT
# ------------------------------------------------------------------------------
try:
    df_db = pd.read_csv("database.csv")
    df_db['team_name_lower'] = df_db['team_name'].str.lower().str.strip()
except Exception as e:
    df_db = None
    st.error(f"Error loading database.csv: {e}")

# Secure API Keys fetching from secrets with secure dual fallbacks
try:
    gemini_key = st.secrets["api_keys"]["GEMINI_API_KEY"]
except Exception:
    try:
        gemini_key = st.secrets["GEMINI_API_KEY"]
    except Exception:
        gemini_key = None

try:
    football_key = st.secrets["api_keys"]["FOOTBALL_API_KEY"]
except Exception:
    try:
        football_key = st.secrets["FOOTBALL_API_KEY"]
    except Exception:
        football_key = "PASTE_YOUR_RAPIDAPI_KEY_HERE"

# ------------------------------------------------------------------------------
# 5. HEADER PRESENTATION BANNER
# ------------------------------------------------------------------------------
top_banner_html = """
<div class="header-banner">
    <div>
        <h1 class="header-logo">🗞️ FORIX Insights</h1>
        <p class="header-subtitle">Tactical breakdowns, form analysis, and tournament intelligence</p>
    </div>
    <div class="status-pill">
        💡 AI INSIGHTS ENGINE
    </div>
</div>
"""
st.markdown(top_banner_html, unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 6. HELPERS & FETCH ENGINE
# ------------------------------------------------------------------------------
def lookup_team_in_df(team_name, df):
    if df is None or team_name is None:
        return None
    name_clean = str(team_name).lower().strip()
    match = df[df['team_name_lower'] == name_clean]
    if len(match) > 0:
        return match.iloc[0]
    
    # Fuzzy word matching
    parts = name_clean.split()
    first_word = parts[0] if len(parts) > 0 else name_clean
    match_fuzzy = df[df['team_name_lower'].str.contains(first_word, na=False)]
    if len(match_fuzzy) > 0:
        return match_fuzzy.iloc[0]
    return None

def make_form_capsules(form_str):
    if pd.isna(form_str) or not isinstance(form_str, str):
        return "No form data"
    elements = [x.strip().upper() for x in form_str.split(",") if x.strip()]
    capsules = []
    for e in elements:
        cl = "pill-w" if e == "W" else ("pill-d" if e == "D" else "pill-l")
        capsules.append(f"<span class='pill-badge {cl}'>{e}</span>")
    return " ".join(capsules) or "No form data"

@st.cache_data(ttl=300)
def fetch_upcoming_fixtures(api_key=None):
    return api.get_upcoming_fixtures(count=5)

@st.cache_data(ttl=600)
def fetch_completed_fixtures(api_key=None):
    return api.get_completed_fixtures(count=50)

FALLBACK_FIXTURES_UPCOMING = [
    {
        "fixture_id": "f-1",
        "group": "A",
        "home_team": "Mexico",
        "away_team": "South Africa",
        "date": "Jun 11",
        "time": "18:00",
        "venue": "Estadio Azteca, Mexico City"
    },
    {
        "fixture_id": "f-2",
        "group": "A",
        "home_team": "USA",
        "away_team": "Canada",
        "date": "Jun 11",
        "time": "20:00",
        "venue": "MetLife Stadium, NY/NJ"
    },
    {
        "fixture_id": "f-3",
        "group": "B",
        "home_team": "Argentina",
        "away_team": "France",
        "date": "Jun 12",
        "time": "15:00",
        "venue": "Gillette Stadium, Boston"
    },
    {
        "fixture_id": "f-4",
        "group": "C",
        "home_team": "Brazil",
        "away_team": "England",
        "date": "Jun 13",
        "time": "17:00",
        "venue": "SoFi Stadium, Los Angeles"
    },
    {
        "fixture_id": "f-5",
        "group": "D",
        "home_team": "Germany",
        "away_team": "Spain",
        "date": "Jun 14",
        "time": "19:00",
        "venue": "Mercedes-Benz Stadium, Atlanta"
    }
]

# ------------------------------------------------------------------------------
# 7. GENERATIVE ANALYTICAL MODELS (GEMINI OUTLINE)
# ------------------------------------------------------------------------------
def generate_article_with_gemini(home_team, away_team, model):
    return ai.generate_match_preview(home_team, away_team)

def parse_article(text):
    if not text:
        return "TACTICAL BRIEFING", "Analysis details currently compiling."
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return "TACTICAL BRIEFING", "Analysis details currently compiling."
    
    # Headline is first meaningful row
    headline = lines[0]
    
    # Remaining rows are body paragraphs
    body_parts = lines[1:]
    if not body_parts:
        body_parts = [headline]
        headline = "TACTICAL BRIEFING ANALYSIS"
        
    body_text = "\n\n".join(body_parts)
    return headline, body_text

def get_fallback_article(home_team, away_team, database_df):
    tA = lookup_team_in_df(home_team, database_df)
    tB = lookup_team_in_df(away_team, database_df)
    
    home_elo = tA['elo_rating'] if tA is not None else 1810
    away_elo = tB['elo_rating'] if tB is not None else 1740
    home_star = tA['key_player'] if tA is not None else "Key Creative Pivot"
    away_star = tB['key_player'] if tB is not None else "Defensive Anchor"
    home_form = tA['recent_form'] if tA is not None else "W,D,W"
    away_form = tB['recent_form'] if tB is not None else "D,L,W"
    
    headline = f"TACTICAL SHOWDOWN: {home_team.upper()} VS {away_team.upper()} PREVIEWED BY MODEL"
    
    p1 = f"As FIFA World Cup 2026 approaches, the matchup between {home_team} (Elo {home_elo}) and {away_team} (Elo {away_elo}) promises a stellar tactical encounter. {home_team}'s setup will rely heavily on transition sequences catalyzed by {home_star}, pushing their attack forward to exploit half-spaces in the defensive line."
    
    p2 = f"Conversely, {away_team} possesses a highly structured tactical foundation, with recent form highlighting a rigid defensive block ({away_form}) steered by {away_star}. Their structural consistency gives them a competitive edge in midfield duels, ready to absorb high-press pressure."
    
    p3 = f"The primary tactical risk factor hinges on transition fatigue and wide-channel coverage. The model projects a high-tempo chess match where localized Elo rating margins and physical stamina in late-game fatigue scenarios will dictate the overall scoreline."
    
    body = f"{p1}\n\n{p2}\n\n{p3}"
    return headline, body

# Load Gemini instance
gemini_model = None
if gemini_key:
    try:
        genai.configure(api_key=gemini_key)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        gemini_model = None

# Initialize local state cache for AI insights
if "ai_insights_cache" not in st.session_state:
    st.session_state["ai_insights_cache"] = {}

def get_fixture_insight(fixture, db_df, model):
    if "fixture_id" in fixture:
        fixture_id = fixture["fixture_id"]
        home = fixture["home_team"]
        away = fixture["away_team"]
    else:
        fixture_id = f"api-{fixture['fixture']['id']}"
        home = fixture["teams"]["home"]["name"]
        away = fixture["teams"]["away"]["name"]
        
    if fixture_id in st.session_state["ai_insights_cache"]:
        return st.session_state["ai_insights_cache"][fixture_id]
        
    # Generate content
    headline, body = "", ""
    try:
        if model:
            raw_text = generate_article_with_gemini(home, away, model)
            headline, body = parse_article(raw_text)
        else:
            headline, body = get_fallback_article(home, away, db_df)
    except Exception:
        headline, body = get_fallback_article(home, away, db_df)
        
    st.session_state["ai_insights_cache"][fixture_id] = (headline, body)
    return headline, body

def render_insights_feed(upcoming_fixtures, df, model):
    # Pre-populate cache with a single spinner if anything is missing to keep UI optimal
    missing_any = False
    for f in upcoming_fixtures:
        fixture_id = f.get("fixture_id") if "fixture_id" in f else f"api-{f['fixture']['id']}"
        if fixture_id not in st.session_state["ai_insights_cache"]:
            missing_any = True
            break
            
    if missing_any:
        with st.spinner("✍️ FORIX AI is writing insights..."):
            for f in upcoming_fixtures:
                get_fixture_insight(f, df, model)
                
    # Loop and display in beautiful lightweight layout
    for f in upcoming_fixtures:
        if "home_team" in f:
            home = f["home_team"]
            away = f["away_team"]
            group_val = f.get("group", "Stage Group")
            date_val = f.get("date", "June 2026")
            fixture_id = f["fixture_id"]
        else:
            home = f['teams']['home']['name']
            away = f['teams']['away']['name']
            group_val = f['league'].get('round', 'Stage Group').replace('Group ', '')
            raw_date = f['fixture']['date']
            try:
                parsed_dt = datetime.datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                date_val = parsed_dt.strftime("%b %d")
            except Exception:
                date_val = "June 2026"
            fixture_id = f"api-{f['fixture']['id']}"
            
        headline, body = st.session_state["ai_insights_cache"].get(fixture_id, ("TIDAL TRANSITIONS BRIEFING", "Analysis is currently compiling."))
        
        tA = lookup_team_in_df(home, df)
        tB = lookup_team_in_df(away, df)
        flagA = tA.get("flag_emoji", "⚽") if tA is not None else "⚽"
        flagB = tB.get("flag_emoji", "⚽") if tB is not None else "⚽"
        
        card_html = f"""
        <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: var(--shadow); margin-bottom: 12px; max-width: 100%;">
            <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
                📅 [Group {group_val} · {date_val}]
            </div>
            <div style="font-size: 18px; font-weight: 800; color: var(--primary); margin-bottom: 12px; line-height: 1.4; letter-spacing: -0.3px;">
                {headline}
            </div>
            <div style="font-size: 13.5px; color: var(--text-primary); line-height: 1.6; margin-bottom: 16px; font-weight: 400; white-space: pre-wrap;">
                {body}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span>{flagA} {home}</span> 
                <span style="color: var(--text-secondary); font-weight: 500;">vs</span> 
                <span>{away} {flagB}</span>
            </div>
        </div>
        """
        st.markdown(card_html, unsafe_allow_html=True)
        
        if st.button(f"View Full Prediction for {home} vs {away} ➔", key=f"nav_btn_{fixture_id}", use_container_width=True):
            st.session_state["selected_match_id"] = fixture_id
            st.session_state["selected_team_a"] = home
            st.session_state["selected_team_b"] = away
            st.session_state["match_id"] = fixture_id
            st.session_state["home_team"] = home
            st.session_state["away_team"] = away
            st.switch_page("pages/1_Match_Center.py")
            
        st.markdown("<p style='margin-bottom:24px;'></p>", unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 8. TWO-COLUMN PAGE LAYOUT
# ------------------------------------------------------------------------------
col_main, col_sidebar = st.columns([65, 35])

# Fetch data elements
upcoming_list = fetch_upcoming_fixtures(football_key)
if not upcoming_list or len(upcoming_list) == 0:
    upcoming_list = FALLBACK_FIXTURES_UPCOMING[:5]
else:
    upcoming_list = upcoming_list[:5]

completed_list = fetch_completed_fixtures(football_key)

# ==============================================================================
# LEFT COLUMN — AI Article Feed
# ==============================================================================
with col_main:
    # Refresh feed trigger
    row_act_col = st.columns([1, 1])
    with row_act_col[0]:
        st.write("Browse tactical blueprints and simulation feedback written live by AI models.")
    with row_act_col[1]:
        if st.button("🔄 Refresh All Insights", key="btn_refresh_news", use_container_width=True):
            st.session_state["ai_insights_cache"] = {}
            st.success("Successfully cleared insights cache! Rebuilding...")
            st.rerun()
            
    st.markdown("<p style='margin-bottom:12px;'></p>", unsafe_allow_html=True)
    
    render_insights_feed(upcoming_list, df_db, gemini_model)

# ==============================================================================
# RIGHT COLUMN — Sidebar Widgets
# ==============================================================================
with col_sidebar:
    # --------------------------------------------------------------------------
    # Widget 1: Tournament Pulse
    # --------------------------------------------------------------------------
    matches_played = 0
    goals_scored = 0
    upsets_count = 0
    
    if completed_list:
        matches_played = len(completed_list)
        for f in completed_list:
            h_g = f.get('goals', {}).get('home', 0) or 0
            a_g = f.get('goals', {}).get('away', 0) or 0
            goals_scored += (h_g + a_g)
            
            # ELO upset tracking
            h_name = f.get('teams', {}).get('home', {}).get('name', '')
            a_name = f.get('teams', {}).get('away', {}).get('name', '')
            tA = lookup_team_in_df(h_name, df_db)
            tB = lookup_team_in_df(a_name, df_db)
            if tA is not None and tB is not None:
                eloA = int(tA['elo_rating'])
                eloB = int(tB['elo_rating'])
                if eloA > eloB and a_g > h_g:
                    upsets_count += 1
                elif eloB > eloA and h_g > a_g:
                    upsets_count += 1
    else:
        # Fallback completed stats
        matches_played = 14
        goals_scored = 41
        upsets_count = 3
        
    pulse_html = f"""
    <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 24px;">
        <h4 style="margin: 0 0 16px 0; color: var(--primary); font-weight: 850; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Tournament Pulse</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Matches Played</span>
                <span style="font-size: 15px; font-weight: 800; color: var(--primary);">{matches_played} / 104</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Goals Scored</span>
                <span style="font-size: 15px; font-weight: 800; color: var(--primary);">{goals_scored}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Upsets So Far</span>
                <span style="font-size: 15px; font-weight: 800; color: #C62828;">🔥 {upsets_count}</span>
            </div>
        </div>
    </div>
    """
    st.markdown(pulse_html, unsafe_allow_html=True)

    # --------------------------------------------------------------------------
    # Widget 2: Form Table — Top 10 Teams
    # --------------------------------------------------------------------------
    if df_db is not None and not df_db.empty:
        best_teams = df_db.sort_values(by="elo_rating", ascending=False).head(10)
        rows_tbl = ""
        for idx, row in best_teams.iterrows():
            flag = row.get("flag_emoji", "⚽")
            team_name = row["team_name"]
            elo = row["elo_rating"]
            form_str = row["recent_form"]
            form_caps = make_form_capsules(form_str)
            
            rows_tbl += f"""
            <tr style="border-bottom: 1px solid var(--border); background-color: #FFFFFF;">
                <td style="padding: 10px 8px; font-size: 13.5px; text-align: left; font-weight: 700;">{flag} {team_name}</td>
                <td style="padding: 10px 8px; font-size: 13px; font-weight: 800; color: var(--primary); text-align: center;">{elo}</td>
                <td style="padding: 10px 8px; text-align: center;">{form_caps}</td>
            </tr>
            """
        form_table_html = f"""
        <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 24px;">
            <h4 style="margin: 0 0 16px 0; color: var(--primary); font-weight: 850; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">🔥 Form Table — Top 10 Teams</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif;">
                    <thead>
                        <tr style="background-color: var(--bg); border-bottom: 2px solid var(--border); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <th style="padding: 8px; text-align: left; font-weight: 700; color: var(--text-secondary);">Team</th>
                            <th style="padding: 8px; text-align: center; font-weight: 700; color: var(--text-secondary);">Elo</th>
                            <th style="padding: 8px; text-align: center; font-weight: 700; color: var(--text-secondary);">Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows_tbl}
                    </tbody>
                </table>
            </div>
        </div>
        """
        st.markdown(form_table_html, unsafe_allow_html=True)
    else:
        st.info("Form table data currently unavailable.")

    # --------------------------------------------------------------------------
    # Widget 3: Share FORIX
    # --------------------------------------------------------------------------
    app_url = "https://ais-pre-j7ctlnqcnipznrarvftrn4-955582412792.asia-southeast1.run.app"
    
    st.markdown("""
    <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0; color: var(--primary); font-weight: 850; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">📢 Share FORIX</h4>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
            Enjoying FORIX? Share it with fellow football fans and let them explore FIFA World Cup 2026 AI predictions!
        </p>
    </div>
    """, unsafe_allow_html=True)
    st.code(app_url, language="text")
    st.link_button("Share on Twitter/X ➔", f"https://twitter.com/intent/tweet?text=⚽+I'm+using+FORIX+for+FIFA+World+Cup+2026+AI+predictions!+Try+it+free:+{app_url}+%23FIFAWorldCup2026+%23FORIX", use_container_width=True)

    # --------------------------------------------------------------------------
    # Widget 4: Support FORIX
    # --------------------------------------------------------------------------
    st.markdown("""
    <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-top: 24px; margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0; color: var(--primary); font-weight: 850; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">☕ Support FORIX</h4>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
            FORIX is completely free and community-supported. Consider supporting the project to keep the AI analytical server nodes live and optimized!
        </p>
    </div>
    """, unsafe_allow_html=True)
    st.link_button("Buy Us a Coffee ☕", "https://ko-fi.com", use_container_width=True)
