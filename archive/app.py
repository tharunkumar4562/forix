import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import datetime
from utils.api_football import FootballAPI
from utils.gemini_helper import GeminiAI

# Global Layout Initialization
st.set_page_config(page_title="FORIX Hub", layout="wide", initial_sidebar_state="collapsed")

# Instantiating clean data handlers
api = FootballAPI()
ai = GeminiAI()

# ------------------------------------------------------------------------------
# 2. GLOBAL STYLING & CSS RULES
# ------------------------------------------------------------------------------
# All CSS injected via unsafe_allow_html at top.
style_html = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* Color variables alignment */
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

/* Base Body styles */
html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
  background-color: var(--bg) !important;
  font-family: 'Inter', sans-serif !important;
  color: var(--text-primary) !important;
}

/* Custom styled header banner */
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

/* Horizontal Metric cards style */
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
  text-align: center;
  box-shadow: var(--shadow);
  width: 100%;
}
.metric-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--primary);
}
.metric-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-top: 6px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Match card layout definitions */
.match-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 12px;
  max-width: 100%;
}
.match-card-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}
.match-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.team-side {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.team-side.align-right {
  align-items: flex-end;
  text-align: right;
}
.flag {
  font-size: 36px;
  margin-bottom: 6px;
}
.team-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}
.vs-text {
  font-weight: 900;
  font-size: 18px;
  color: var(--text-secondary);
  padding: 0 20px;
  text-transform: uppercase;
}
.metric {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  font-weight: 500;
}
.form-row {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
  font-weight: 600;
}
.match-card-venue {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}

/* Custom error/warning alert styling */
.warning-card {
  background: #FFFDE7;
  border: 1px solid #FFF59D;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}
.amber-banner {
  background-color: #FFF3E0; 
  border-left: 4px solid #FF9800; 
  padding: 12px 16px; 
  border-radius: 8px; 
  margin-bottom: 20px; 
  font-weight: 600; 
  font-size: 13px; 
  color: #E65100;
}

/* Tab overrides to fit the design */
div[data-baseweb="tab-highlight"] {
  background-color: var(--primary) !important;
}
button[data-baseweb="tab"] {
  font-family: 'Inter', sans-serif !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  color: var(--text-secondary) !important;
}
button[aria-selected="true"] {
  color: var(--primary) !important;
}

/* Live indicators */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.05); }
}
.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #E53935;
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 1.5s infinite;
}
.live-minute {
  color: #E53935;
  font-weight: 800;
  background-color: #FFEBEE;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.live-score {
  font-size: 28px;
  font-weight: 950;
  color: var(--primary);
  margin-top: 4px;
}

/* Custom visual alignment for buttons */
div.stButton > button {
  background-color: var(--primary) !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  border: none !important;
  padding: 12px 24px !important;
  font-size: 13px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
div.stButton > button:hover {
  background-color: #004D2C !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>
"""
st.markdown(style_html, unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 3. API & DATABASE INTEGRATION SETUP
# ------------------------------------------------------------------------------
# Load localized CSV index
try:
    df_db = pd.read_csv("database.csv")
    df_db['team_name_lower'] = df_db['team_name'].str.lower().str.strip()
except Exception as e:
    df_db = None
    st.error(f"FATAL: Local database 'database.csv' could not be loaded. Error: {e}")

# Secure key parsing with dual fallbacks to prevent errors
try:
    football_key = st.secrets["api_keys"]["FOOTBALL_API_KEY"]
except Exception:
    try:
        football_key = st.secrets["FOOTBALL_API_KEY"]
    except Exception:
        football_key = "PASTE_YOUR_RAPIDAPI_KEY_HERE"

# Unified case-insensitive database queries
def lookup_team(team_name):
    if df_db is None or team_name is None:
        return None
    name_clean = str(team_name).lower().strip()
    match = df_db[df_db['team_name_lower'] == name_clean]
    if len(match) > 0:
        return match.iloc[0]
    
    # Simple semantic backup match (e.g. "USA" inside "United States")
    first_word = name_clean.split()[0] if len(name_clean.split()) > 0 else name_clean
    match_fuzzy = df_db[df_db['team_name_lower'].str.contains(first_word, na=False)]
    if len(match_fuzzy) > 0:
        return match_fuzzy.iloc[0]
    return None

def form_to_emojis(form_str):
    if pd.isna(form_str) or not isinstance(form_str, str):
        return "No historical form indexed"
    elements = form_str.split(",")
    emojis = []
    for e in elements:
        val = e.strip().upper()
        if val == "W":
            emojis.append("🟢")
        elif val == "D":
            emojis.append("🟡")
        elif val == "L":
            emojis.append("🔴")
        else:
            emojis.append(val)
    return " ".join(emojis)

# API integration structure
@st.cache_data(ttl=300)
def fetch_fixtures_from_api(status_type, api_key=None):
    if status_type == "live":
        return api.get_live_fixtures()
    elif status_type == "upcoming":
        return api.get_upcoming_fixtures(count=10)
    else:
        return api.get_completed_fixtures(count=10)

# Fallback datasets (June 2026 World Cup match models)
FALLBACK_FIXTURES_LIVE = [
    {
        "fixture_id": "f-live-1",
        "group": "A",
        "home_team": "Mexico",
        "away_team": "South Africa",
        "date": "Jun 11",
        "time": "In Progress",
        "venue": "Estadio Azteca, Mexico City",
        "elapsed": 67,
        "home_goals": 2,
        "away_goals": 1
    }
]

FALLBACK_FIXTURES_UPCOMING = [
    {
        "fixture_id": "f-1",
        "group": "A",
        "home_team": "USA",
        "away_team": "Canada",
        "date": "Jun 11",
        "time": "18:00",
        "venue": "MetLife Stadium, NY/NJ"
    },
    {
        "fixture_id": "f-2",
        "group": "B",
        "home_team": "Argentina",
        "away_team": "France",
        "date": "Jun 12",
        "time": "20:00",
        "venue": "Estadio Azteca, Mexico City"
    },
    {
        "fixture_id": "f-3",
        "group": "C",
        "home_team": "Brazil",
        "away_team": "England",
        "date": "Jun 13",
        "time": "15:00",
        "venue": "SoFi Stadium, Los Angeles"
    }
]

FALLBACK_FIXTURES_COMPLETED = [
    {
        "fixture_id": "f-comp-1",
        "group": "C",
        "home_team": "USA",
        "away_team": "Brazil",
        "date": "Jun 08",
        "time": "FT",
        "venue": "MetLife Stadium",
        "home_goals": 3,
        "away_goals": 1
    }
]

# ------------------------------------------------------------------------------
# 4. COMPONENT PRESENTATION RENDERERS
# ------------------------------------------------------------------------------
def render_match_card(fixture, status_type="upcoming", is_fallback=False):
    # Retrieve structural properties based on source API format or local fallback formats
    if is_fallback:
        fixture_id = fixture.get("fixture_id", "f-unknown")
        group_name = fixture.get("group", "Group Stage")
        home_team = fixture.get("home_team", "Home Segment")
        away_team = fixture.get("away_team", "Away Segment")
        match_date = fixture.get("date", "June 2026")
        match_time = fixture.get("time", "18:00")
        venue = fixture.get("venue", "Tournament Center")
        home_goals = fixture.get("home_goals", 0)
        away_goals = fixture.get("away_goals", 0)
        elapsed = fixture.get("elapsed", 0)
    else:
        # Standard API schema parse mapping
        try:
            fixture_id = f"api-{fixture['fixture']['id']}"
            group_name = fixture['league'].get('round', 'Group Stage').replace('Group ', '')
            home_team = fixture['teams']['home']['name']
            away_team = fixture['teams']['away']['name']
            # Format datetime
            raw_date = fixture['fixture']['date']
            parsed_dt = datetime.datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
            match_date = parsed_dt.strftime("%b %d")
            match_time = parsed_dt.strftime("%H:%M")
            venue = fixture['fixture']['venue'].get('name', 'FIFA World Cup Arena')
            home_goals = fixture['goals'].get('home', 0) or 0
            away_goals = fixture['goals'].get('away', 0) or 0
            elapsed = fixture['fixture']['status'].get('elapsed', 0) or 0
        except Exception:
            # Shield parser error
            st.markdown(f"<div class='warning-card'>⚠️ Internal match formatting parse boundary error for Id {fixture.get('fixture', {}).get('id','NA')}</div>", unsafe_allow_html=True)
            return

    # Lookups
    tA_data = lookup_team(home_team)
    tB_data = lookup_team(away_team)
    
    # If team datasets are missing, render warning card safely
    if tA_data is None or tB_data is None:
        missing_teams = []
        if tA_data is None: missing_teams.append(home_team)
        if tB_data is None: missing_teams.append(away_team)
        
        st.markdown(f"""
        <div class="warning-card">
            <span style="font-weight: 700; color: #D32F2F;">⚠️ Team Metadata Bypassed</span>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary);">
                Matched fixture <strong>{home_team} vs {away_team}</strong> contains profiles missing in database.csv. 
                Full metrics skipped for stability.
            </p>
        </div>
        """, unsafe_allow_html=True)
        return

    # Extract database row indices
    home_elo = tA_data['elo_rating']
    home_flag = tA_data['flag_emoji']
    home_form_emojis = form_to_emojis(tA_data['recent_form'])
    
    away_elo = tB_data['elo_rating']
    away_flag = tB_data['flag_emoji']
    away_form_emojis = form_to_emojis(tB_data['recent_form'])

    # VS details based on match type — kept on single lines to avoid
    # Markdown treating indented lines (4+ spaces) as code blocks
    if status_type == "live":
        vs_block_html = f'<div style="text-align:center;"><div class="live-minute">⏱ {elapsed}\'</div><div class="live-score">{home_goals} - {away_goals}</div><div style="display:flex;align-items:center;justify-content:center;margin-top:6px;"><span class="live-dot"></span><span style="font-size:11px;font-weight:800;color:#E53935;text-transform:uppercase;letter-spacing:0.5px;">Live Now</span></div></div>'
    elif status_type == "completed":
        vs_block_html = f'<div style="text-align:center;"><div style="font-size:26px;font-weight:900;color:var(--text-primary);letter-spacing:1px;">{home_goals} - {away_goals}</div><div style="font-size:10px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;margin-top:2px;">Full Time</div></div>'
    else:
        vs_block_html = '<div class="vs-text">vs</div>'

    # Print HTML main layout — all on compact lines to prevent markdown code-block triggering
    card_html = (
        f'<div class="match-card">'
        f'<div class="match-card-header"><span>🌍 Group {group_name} · FIFA World Cup 2026</span><span>{match_date} · {match_time}</span></div>'
        f'<div class="match-card-content">'
        f'<div class="team-side"><span class="flag">{home_flag}</span><span class="team-name">{home_team}</span><span class="metric">Elo Rating: <strong>{home_elo}</strong></span><span class="form-row">Form: {home_form_emojis}</span></div>'
        f'{vs_block_html}'
        f'<div class="team-side align-right"><span class="flag">{away_flag}</span><span class="team-name">{away_team}</span><span class="metric">Elo Rating: <strong>{away_elo}</strong></span><span class="form-row">Form: {away_form_emojis}</span></div>'
        f'</div>'
        f'<div class="match-card-venue">📍 Stadium Venue: <strong>{venue}</strong></div>'
        f'</div>'
    )
    st.markdown(card_html, unsafe_allow_html=True)
    
    # Interactive Streamlit routing action attached securely beneath card container
    if st.button(f"🔍 Launch Tactical AI Analyst for {home_team} vs {away_team} →", key=f"btn_{fixture_id}", use_container_width=True):
        st.session_state["selected_match_id"] = fixture_id
        st.session_state["selected_team_a"] = home_team
        st.session_state["selected_team_b"] = away_team
        st.switch_page("pages/1_Match_Center.py")

# ------------------------------------------------------------------------------
# 5. APPLICATION LAYOUT HEADER SECTIONS & LOGIC
# ------------------------------------------------------------------------------
# Render HTML styled header
header_html = """
<div class="header-banner">
    <div>
        <h1 class="header-logo">⚽ FORIX</h1>
        <p class="header-subtitle">FIFA World Cup 2026 · AI Match Intelligence</p>
    </div>
    <div class="status-pill">
        🟢 TOURNAMENT LIVE — June 11 to July 19, 2026
    </div>
</div>
"""
st.markdown(header_html, unsafe_allow_html=True)

# Tournament context calculations
fixed_today = datetime.date(2026, 6, 9)
target_final = datetime.date(2026, 7, 19)
days_remaining = (target_final - fixed_today).days
if days_remaining < 0:
    days_remaining = 0

# Tournament metrics summary layout using st.columns([1,1]) nested recursively
col_ratio_A, col_ratio_B = st.columns([1, 1])

with col_ratio_A:
    sub_col1, sub_col2 = st.columns([1, 1])
    with sub_col1:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-value">104</div>
            <div class="metric-label">🏆 Total Matches</div>
        </div>
        """, unsafe_allow_html=True)
    with sub_col2:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-value">48</div>
            <div class="metric-label">⚽ Teams</div>
        </div>
        """, unsafe_allow_html=True)

with col_ratio_B:
    sub_col3, sub_col4 = st.columns([1, 1])
    with sub_col3:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-value">16</div>
            <div class="metric-label">📍 Host Cities</div>
        </div>
        """, unsafe_allow_html=True)
    with sub_col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{days_remaining}</div>
            <div class="metric-label">📅 Days Remaining</div>
        </div>
        """, unsafe_allow_html=True)

st.markdown("<p style='margin-bottom:20px;'></p>", unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 6. MATCH CARD TABS RENDERING
# ------------------------------------------------------------------------------
tab1, tab2, tab3 = st.tabs(["🔴 Live Now", "⏳ Upcoming", "✅ Completed"])

# Live fixtures Tab
with tab1:
    api_fixtures = fetch_fixtures_from_api("live", football_key)
    if not api_fixtures or not isinstance(api_fixtures, list):
        # Beautiful fallback matching design instructions
        st.markdown("""
        <div class="amber-banner">
            ⚠️ Using cached data — live API unavailable
        </div>
        """, unsafe_allow_html=True)
        
        # Render static live fallback
        row_cols = st.columns([1, 1])
        with row_cols[0]:
            render_match_card(FALLBACK_FIXTURES_LIVE[0], status_type="live", is_fallback=True)
    else:
        # Render API response live fixtures using responsive grid loop
        for idx in range(0, len(api_fixtures), 2):
            row_cols = st.columns([1, 1])
            with row_cols[0]:
                render_match_card(api_fixtures[idx], status_type="live", is_fallback=False)
            if idx + 1 < len(api_fixtures):
                with row_cols[1]:
                    render_match_card(api_fixtures[idx+1], status_type="live", is_fallback=False)

# Upcoming fixtures Tab
with tab2:
    api_fixtures = fetch_fixtures_from_api("upcoming", football_key)
    if not api_fixtures or not isinstance(api_fixtures, list):
        st.markdown("""
        <div class="amber-banner">
            ⚠️ Using cached data — live API unavailable
        </div>
        """, unsafe_allow_html=True)
        
        # Render 3 fallback matches
        for idx in range(0, len(FALLBACK_FIXTURES_UPCOMING), 2):
            row_cols = st.columns([1, 1])
            with row_cols[0]:
                render_match_card(FALLBACK_FIXTURES_UPCOMING[idx], status_type="upcoming", is_fallback=True)
            if idx + 1 < len(FALLBACK_FIXTURES_UPCOMING):
                with row_cols[1]:
                    render_match_card(FALLBACK_FIXTURES_UPCOMING[idx+1], status_type="upcoming", is_fallback=True)
    else:
        for idx in range(0, len(api_fixtures), 2):
            row_cols = st.columns([1, 1])
            with row_cols[0]:
                render_match_card(api_fixtures[idx], status_type="upcoming", is_fallback=False)
            if idx + 1 < len(api_fixtures):
                with row_cols[1]:
                    render_match_card(api_fixtures[idx+1], status_type="upcoming", is_fallback=False)

# Completed fixtures Tab
with tab3:
    api_fixtures = fetch_fixtures_from_api("completed", football_key)
    if not api_fixtures or not isinstance(api_fixtures, list):
        st.markdown("""
        <div class="amber-banner">
            ⚠️ Using cached data — live API unavailable
        </div>
        """, unsafe_allow_html=True)
        
        # Render fallback completed matches
        for idx in range(0, len(FALLBACK_FIXTURES_COMPLETED), 2):
            row_cols = st.columns([1, 1])
            with row_cols[0]:
                render_match_card(FALLBACK_FIXTURES_COMPLETED[idx], status_type="completed", is_fallback=True)
            if idx + 1 < len(FALLBACK_FIXTURES_COMPLETED):
                with row_cols[1]:
                    render_match_card(FALLBACK_FIXTURES_COMPLETED[idx+1], status_type="completed", is_fallback=True)
    else:
        for idx in range(0, len(api_fixtures), 2):
            row_cols = st.columns([1, 1])
            with row_cols[0]:
                render_match_card(api_fixtures[idx], status_type="completed", is_fallback=False)
            if idx + 1 < len(api_fixtures):
                with row_cols[1]:
                    render_match_card(api_fixtures[idx+1], status_type="completed", is_fallback=False)

# ------------------------------------------------------------------------------
# 7. COLLAPSED SIDEBAR IMPLEMENTATION
# ------------------------------------------------------------------------------
st.sidebar.markdown("<h2 style='color:#006B3C; margin:0; font-weight:800;'>⚽ FORIX</h2>", unsafe_allow_html=True)
st.sidebar.markdown("<p style='font-size:12px; color:#555570; margin-bottom:20px; font-weight:600;'>FIFA World Cup 2026 AI Analytical Console</p>", unsafe_allow_html=True)

# Sidebar links with icons
st.sidebar.page_link("app.py", label="Match Hub", icon="⚽")
st.sidebar.page_link("pages/1_Match_Center.py", label="Match Center", icon="🔮")
st.sidebar.page_link("pages/2_Standings.py", label="Standings", icon="📊")
st.sidebar.page_link("pages/3_Insights.py", label="AI Insights", icon="💡")

st.sidebar.markdown("---")
st.sidebar.markdown("<h4 style='margin:0; font-weight:700;'>About FORIX</h4>", unsafe_allow_html=True)
st.sidebar.markdown(
    "FORIX uses predictive algorithms and localized team statistical models to formulate direct World Cup match forecasts and standings. "
)
st.sidebar.markdown("---")
st.sidebar.markdown("<p style='font-size:10px; color:#555570; font-weight:500;'>Built with ❤️ for football fans<br>© 2026 FORIX Sports Analytics Inc.</p>", unsafe_allow_html=True)
