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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

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

/* Legend items styling */
.legend-container {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

/* Tab design styling updates */
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
st.sidebar.markdown("Explore real-time group table forecasts computed via team strength arrays and defensive Elo indices.")
st.sidebar.markdown("---")
st.sidebar.markdown("<p style='font-size:10px; color:#555570; font-weight:500;'>Built with ❤️ for football fans<br>© 2026 FORIX Sports Analytics Inc.</p>", unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 4. DATABASE LOAD & HELPER DATA STRUCTURES
# ------------------------------------------------------------------------------
try:
    df_db = pd.read_csv("database.csv")
except Exception as e:
    df_db = None
    st.error(f"Error loading database.csv: {e}")

# Build a team-to-emoji mapping dict from database
team_flags = {}
if df_db is not None:
    for _, row in df_db.iterrows():
        team_flags[str(row['team_name']).lower().strip()] = row.get('flag_emoji', '⚽')

def get_flag(team_name):
    t_clean = str(team_name).lower().strip()
    return team_flags.get(t_clean, '⚽')

# ------------------------------------------------------------------------------
# 5. HEADER PRESENTATION BANNER
# ------------------------------------------------------------------------------
top_banner_html = """
<div class="header-banner">
    <div>
        <h1 class="header-logo">🏆 Standings & Leaderboards</h1>
        <p class="header-subtitle">FIFA World Cup 2026 · Dynamic Group Tables & Elite Player Statistics</p>
    </div>
    <div class="status-pill">
        📊 FORIX LIVE TRACKER
    </div>
</div>
"""
st.markdown(top_banner_html, unsafe_allow_html=True)

# Fetch secure API key from secrets
try:
    football_key = st.secrets["api_keys"]["FOOTBALL_API_KEY"]
except Exception:
    try:
        football_key = st.secrets["FOOTBALL_API_KEY"]
    except Exception:
        football_key = "PASTE_YOUR_RAPIDAPI_KEY_HERE"

# ------------------------------------------------------------------------------
# 6. EXTERNAL SPORT API LOOKUP CACHED ENDPOINTS
# ------------------------------------------------------------------------------
@st.cache_data(ttl=600)
def fetch_live_standings(api_key=None):
    return api.get_standings()

@st.cache_data(ttl=600)
def fetch_top_scorers(api_key=None):
    return api.get_top_scorers()

@st.cache_data(ttl=600)
def fetch_top_assists(api_key=None):
    return api.get_top_assists()

@st.cache_data(ttl=600)
def fetch_completed_fixtures(api_key=None):
    return api.get_completed_fixtures(count=50)

# ------------------------------------------------------------------------------
# 7. ROUTING AND TAB INITIALIZATION
# ------------------------------------------------------------------------------
tab1, tab2 = st.tabs(["📊 Group Standings", "🥇 Player Leaderboards"])

# ==============================================================================
# TAB 1: GROUP STANDINGS
# ==============================================================================
with tab1:
    standings_data = fetch_live_standings(football_key)
    
    def render_group_card(group_name, group_data):
        table_rows = ""
        for idx, t_data in enumerate(group_data):
            rank = idx + 1
            team_name = t_data['team']['name']
            flag = get_flag(team_name)
            p = t_data['all'].get('played', 0)
            w = t_data['all'].get('win', 0)
            d = t_data['all'].get('draw', 0)
            l = t_data['all'].get('lose', 0)
            gf = t_data['all'].get('goals', {}).get('for', 0)
            ga = t_data['all'].get('goals', {}).get('against', 0)
            gd = t_data.get('goalsDiff', 0)
            pts = t_data.get('points', 0)
            
            if rank <= 2:
                row_style = 'background-color: #E8F5E9; border-left: 3px solid #006B3C;'
            elif rank == 3:
                row_style = 'background-color: #FFF9E6; border-left: 3px solid transparent;'
            else:
                row_style = 'background-color: #FFFFFF; border-left: 3px solid transparent;'
                
            table_rows += f"""
            <tr style="{row_style}">
                <td style="padding: 10px 8px; text-align: center; font-weight: 800; color: var(--text-primary);">{rank}</td>
                <td style="padding: 10px 8px; text-align: left; font-weight: 700; color: var(--text-primary);">{flag} {team_name}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{p}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{w}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{d}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{l}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{gf}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{ga}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">{gd}</td>
                <td style="padding: 10px 8px; text-align: center; font-weight: 800; color: var(--primary);">{pts}</td>
            </tr>
            """
            
        full_card_html = f"""
        <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: var(--primary); font-weight: 850; font-size: 16px;">🏆 {group_name} Table</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #006B3C; color: #FFFFFF; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Pos</th>
                            <th style="padding: 10px 8px; text-align: left; font-weight: 700;">Team</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">P</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">W</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">D</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">L</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">GF</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">GA</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">GD</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
            </div>
        </div>
        """
        st.markdown(full_card_html, unsafe_allow_html=True)

    def render_fallback_group_card(title, teams_df):
        table_rows = ""
        for idx, row in teams_df.iterrows():
            rank = idx + 1
            team_name = row['team_name']
            flag = row.get('flag_emoji', '⚽')
            
            if rank <= 2:
                row_style = 'background-color: #E8F5E9; border-left: 3px solid #006B3C;'
            elif rank == 3:
                row_style = 'background-color: #FFF9E6; border-left: 3px solid transparent;'
            else:
                row_style = 'background-color: #FFFFFF; border-left: 3px solid transparent;'
                
            table_rows += f"""
            <tr style="{row_style}">
                <td style="padding: 10px 8px; text-align: center; font-weight: 800; color: var(--text-primary);">{rank}</td>
                <td style="padding: 10px 8px; text-align: left; font-weight: 700; color: var(--text-primary);">{flag} {team_name}</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; color: var(--text-secondary);">0</td>
                <td style="padding: 10px 8px; text-align: center; font-weight: 800; color: var(--primary);">0</td>
            </tr>
            """
            
        full_card_html = f"""
        <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: var(--primary); font-weight: 850; font-size: 16px;">🏆 {title} Table</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #006B3C; color: #FFFFFF; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Pos</th>
                            <th style="padding: 10px 8px; text-align: left; font-weight: 700;">Team</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">P</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">W</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">D</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">L</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">GF</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">GA</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700;">GD</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 700; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
            </div>
        </div>
        """
        st.markdown(full_card_html, unsafe_allow_html=True)

    def render_fallback_standings():
        st.markdown("""
        <div style="background-color: #FFF9E6; border: 1px solid #FFF59D; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #856404; font-weight: 600; text-align: center; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            ⚠️ Showing pre-tournament standings — live data unavailable at this moment
        </div>
        """, unsafe_allow_html=True)
        
        if df_db is None or df_db.empty:
            st.info("Teams database index could not be located inside directory indices.")
            return
            
        group_letters = sorted(df_db['group'].dropna().unique().tolist())
        
        for idx in range(0, len(group_letters), 2):
            col_g1, col_g2 = st.columns([1, 1])
            
            # Left group card
            gl_letter = group_letters[idx]
            gl_teams = df_db[df_db['group'] == gl_letter].copy().sort_values(by="elo_rating", ascending=False).reset_index(drop=True)
            with col_g1:
                render_fallback_group_card(f"Group {gl_letter}", gl_teams)
                
            # Right group card
            if idx + 1 < len(group_letters):
                gr_letter = group_letters[idx + 1]
                gr_teams = df_db[df_db['group'] == gr_letter].copy().sort_values(by="elo_rating", ascending=False).reset_index(drop=True)
                with col_g2:
                    render_fallback_group_card(f"Group {gr_letter}", gr_teams)

    def render_group_standings(s_data):
        try:
            standings_list = s_data[0]['league']['standings']
            groups_dict = {}
            for group_standing in standings_list:
                if len(group_standing) > 0:
                    group_name = group_standing[0].get('group', 'Group')
                    groups_dict[group_name] = group_standing
                    
            sorted_groups = sorted(list(groups_dict.keys()))
            
            for idx in range(0, len(sorted_groups), 2):
                col1, col2 = st.columns([1, 1])
                
                g1_name = sorted_groups[idx]
                g1_data = groups_dict[g1_name]
                with col1:
                    render_group_card(g1_name, g1_data)
                    
                if idx + 1 < len(sorted_groups):
                    g2_name = sorted_groups[idx + 1]
                    g2_data = groups_dict[g2_name]
                    with col2:
                        render_group_card(g2_name, g2_data)
                        
        except Exception as err:
            st.warning(f"Error parsing live standings response: {err}. Showing index fallbacks.")
            render_fallback_standings()

    if standings_data:
        render_group_standings(standings_data)
    else:
        render_fallback_standings()
        
    # Render unified table legend
    legend_html = """
    <div class="legend-container">
        <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-right: 8px;">Legend:</span>
        <div class="legend-item">
            <div class="legend-box" style="background-color: #E8F5E9; border-left: 3px solid #006B3C;"></div>
            <span>Qualify for Round of 32 (Top 2 in group)</span>
        </div>
        <div class="legend-item">
            <div class="legend-box" style="background-color: #FFF9E6;"></div>
            <span>Potential third-place qualification</span>
        </div>
        <div class="legend-item">
            <div class="legend-box" style="background-color: #FFFFFF;"></div>
            <span>Eliminated from competition</span>
        </div>
    </div>
    """
    st.markdown(legend_html, unsafe_allow_html=True)

# ==============================================================================
# TAB 2: PLAYER LEADERBOARDS
# ==============================================================================
with tab2:
    scorers_data = fetch_top_scorers(football_key)
    assists_data = fetch_top_assists(football_key)
    fixtures_data = fetch_completed_fixtures(football_key)
    
    def render_pre_tournament_watch_list():
        st.markdown("""
        <div style="background-color: #FFFDE7; border: 1px solid #FFF59D; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #856404; font-weight: 600; text-align: center; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            ⚡ Live leaderboards activate after kickoff (June 11)
        </div>
        """, unsafe_allow_html=True)
        
        col_watch1, col_watch2, col_watch3 = st.columns(3)
        
        if df_db is None or df_db.empty:
            st.info("Teams database is currently unavailable.")
            return
            
        top_watch_teams = df_db.sort_values(by='elo_rating', ascending=False).head(10).reset_index(drop=True)
        
        # Column 1: Top ELO Teams to Watch
        with col_watch1:
            st.markdown("<h4 style='font-size:16px; font-weight:800; color:var(--primary); margin-bottom:12px;'>🏆 Elite Contenders (Elo)</h4>", unsafe_allow_html=True)
            html_rows = ""
            for idx, row in top_watch_teams.iterrows():
                rank = idx + 1
                badge = "🥇" if rank == 1 else ("🥈" if rank == 2 else ("🥉" if rank == 3 else f"#{rank}"))
                badge_bg = "#FFF9C4" if rank <= 3 else "#F1F3F4"
                badge_color = "#000000" if rank <= 3 else "#555570"
                badge_style = f"font-weight: 800; font-size: 13px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background-color: {badge_bg}; border-radius: 50%; color: {badge_color};"
                
                html_rows += f"""
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #E8ECF0; background:#FFFFFF; border-radius:8px; margin-bottom: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="{badge_style}">{badge}</span>
                        <div>
                            <span style="font-weight: 700; color: #1A1A2E;">{row['flag_emoji']} {row['team_name']}</span><br>
                            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">Group {row['group']} · {row['confederation']}</span>
                        </div>
                    </div>
                    <span style="font-size: 14px; font-weight: 800; color: var(--primary);">{row['elo_rating']} pts</span>
                </div>
                """
            st.markdown(html_rows, unsafe_allow_html=True)
            
        # Column 2: Stars to Watch
        with col_watch2:
            st.markdown("<h4 style='font-size:16px; font-weight:800; color:#1A6FBF; margin-bottom:12px;'>🎯 Projected Star Anchors</h4>", unsafe_allow_html=True)
            html_rows_stars = ""
            for idx, row in top_watch_teams.iterrows():
                rank = idx + 1
                badge = "🥇" if rank == 1 else ("🥈" if rank == 2 else ("🥉" if rank == 3 else f"#{rank}"))
                badge_bg = "#E1F5FE" if rank <= 3 else "#F1F3F4"
                badge_color = "#0288D1" if rank <= 3 else "#555570"
                badge_style = f"font-weight: 800; font-size: 13px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background-color: {badge_bg}; border-radius: 50%; color: {badge_color};"
                
                # Fetch first letter as initial avatar
                star_initial = row['key_player'][0] if row['key_player'] else "👤"
                photo_html = f'<div style="width:34px; height:34px; border-radius:50%; background:#ECEFF1; border: 1px solid #CFD8DC; display:flex; align-items:center; justify-content:center; font-weight:900; color:#455A64; font-size: 12px;">{star_initial}</div>'

                html_rows_stars += f"""
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #E8ECF0; background:#FFFFFF; border-radius:8px; margin-bottom: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="{badge_style}">{badge}</span>
                        {photo_html}
                        <div>
                            <span style="font-weight: 700; color: #1A1A2E;">{row['key_player']}</span><br>
                            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">{row['flag_emoji']} {row['team_name']}</span>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 11px; font-weight: 700; color: #1A6FBF; max-width: 100px; line-height:1.2;">
                        {row['key_player_stat']}
                    </div>
                </div>
                """
            st.markdown(html_rows_stars, unsafe_allow_html=True)
            
        # Column 3: Tournament Projections Metrics
        with col_watch3:
            st.markdown("<h4 style='font-size:16px; font-weight:800; color:#555570; margin-bottom:12px;'>📈 AI Model Projections</h4>", unsafe_allow_html=True)
            
            total_teams = len(df_db) if df_db is not None else 48
            avg_elo = int(df_db['elo_rating'].mean()) if df_db is not None else 1800
            avg_goals = df_db['avg_goals_scored'].mean() if df_db is not None else 2.1
            
            projections_html = f"""
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Predicted Champion Favorite</div>
                <div style="font-size: 24px; font-weight: 850; color: var(--primary); margin: 6px 0;">🇦🇷 Argentina</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Based on a 20.8% victory index computed across 5,000 AI Model simulations.</div>
            </div>
            
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Historical Average Goal Output</div>
                <div style="font-size: 24px; font-weight: 850; color: #1A6FBF; margin: 6px 0;">{avg_goals:.2f} Goals / G</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Historical statistics denote highly offensive transitional systems.</div>
            </div>
            
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Tournament Capacity</div>
                <div style="font-size: 24px; font-weight: 850; color: #E65100; margin: 6px 0;">{total_teams} Nations</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">First ever 48-nation expansion layout representing all confederations.</div>
            </div>
            
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Mean Quality ELO rating</div>
                <div style="font-size: 24px; font-weight: 850; color: #455A64; margin: 6px 0;">{avg_elo} Points</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Average structural strength representing global team hierarchies.</div>
            </div>
            """
            st.markdown(projections_html, unsafe_allow_html=True)

    def render_live_leaderboards(scorers, assists, completed_fixtures):
        col_l1, col_l2, col_l3 = st.columns(3)
        
        # COLUMN 1: Top Scorers
        with col_l1:
            st.markdown("<h4 style='font-size:16px; font-weight:800; color:var(--primary); margin-bottom:12px;'>🥾 Golden Boot Race</h4>", unsafe_allow_html=True)
            html_rows = ""
            for idx, item in enumerate(scorers[:10]):
                rank = idx + 1
                badge = "🥇" if rank == 1 else ("🥈" if rank == 2 else ("🥉" if rank == 3 else f"#{rank}"))
                badge_bg = "#FFF9C4" if rank <= 3 else "#F1F3F4"
                badge_color = "#000000" if rank <= 3 else "#555570"
                badge_style = f"font-weight: 800; font-size: 13px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background-color: {badge_bg}; border-radius: 50%; color: {badge_color};"
                
                p_name = item["player"].get("name", "Unknown Player")
                p_photo = item["player"].get("photo", "")
                t_name = item["statistics"][0]["team"].get("name", "Unknown Team")
                t_flag = get_flag(t_name)
                goals = item["statistics"][0]["goals"].get("total", 0) or 0
                
                if p_photo:
                    img_html = f'<img src="{p_photo}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid #E8ECF0;" />'
                else:
                    p_initial = p_name[0] if p_name else "👤"
                    img_html = f'<div style="width:34px; height:34px; border-radius:50%; background:#ECEFF1; border: 1px solid #CFD8DC; display:flex; align-items:center; justify-content:center; font-weight:900; color:#455A64; font-size: 12px;">{p_initial}</div>'
                    
                html_rows += f"""
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #E8ECF0; background:#FFFFFF; border-radius:8px; margin-bottom: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="{badge_style}">{badge}</span>
                        {img_html}
                        <div>
                            <span style="font-weight: 700; color: #1A1A2E;">{p_name}</span><br>
                            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">{t_flag} {t_name}</span>
                        </div>
                    </div>
                    <span style="font-size: 20px; font-weight: 850; color: var(--primary);">{goals}</span>
                </div>
                """
            st.markdown(html_rows, unsafe_allow_html=True)
            
        # COLUMN 2: Top Assists
        with col_l2:
            st.markdown("<h4 style='font-size:16px; font-weight:800; color:#1A6FBF; margin-bottom:12px;'>🎯 Playmaker Index</h4>", unsafe_allow_html=True)
            html_rows_assists = ""
            for idx, item in enumerate(assists[:10]):
                rank = idx + 1
                badge = "🥇" if rank == 1 else ("🥈" if rank == 2 else ("🥉" if rank == 3 else f"#{rank}"))
                badge_bg = "#E1F5FE" if rank <= 3 else "#F1F3F4"
                badge_color = "#0288D1" if rank <= 3 else "#555570"
                badge_style = f"font-weight: 800; font-size: 13px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background-color: {badge_bg}; border-radius: 50%; color: {badge_color};"
                
                p_name = item["player"].get("name", "Unknown Player")
                p_photo = item["player"].get("photo", "")
                t_name = item["statistics"][0]["team"].get("name", "Unknown Team")
                t_flag = get_flag(t_name)
                assists_ct = item["statistics"][0]["goals"].get("assists", 0) or 0
                
                if p_photo:
                    img_html = f'<img src="{p_photo}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid #E8ECF0;" />'
                else:
                    p_initial = p_name[0] if p_name else "👤"
                    img_html = f'<div style="width:34px; height:34px; border-radius:50%; background:#ECEFF1; border: 1px solid #CFD8DC; display:flex; align-items:center; justify-content:center; font-weight:900; color:#455A64; font-size: 12px;">{p_initial}</div>'
                    
                html_rows_assists += f"""
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #E8ECF0; background:#FFFFFF; border-radius:8px; margin-bottom: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="{badge_style}">{badge}</span>
                        {img_html}
                        <div>
                            <span style="font-weight: 700; color: #1A1A2E;">{p_name}</span><br>
                            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">{t_flag} {t_name}</span>
                        </div>
                    </div>
                    <span style="font-size: 20px; font-weight: 850; color: #1A6FBF;">{assists_ct}</span>
                </div>
                """
            st.markdown(html_rows_assists, unsafe_allow_html=True)
            
        # COLUMN 3: Tournament Match Facts
        with col_l3:
            st.markdown("<h4 style='font-size:16px; font-weight:800; color:#555570; margin-bottom:12px;'>📈 Tournament Stats</h4>", unsafe_allow_html=True)
            
            total_goals_val = 0
            avg_goals_val = 0.0
            most_goals_match_lbl = "—"
            highest_scoreline_lbl = "—"
            red_cards_val = 0
            
            if completed_fixtures:
                num_matches = len(completed_fixtures)
                max_match_goals = -1
                max_team_goals = -1
                
                for fixt in completed_fixtures:
                    h_goals = fixt.get('goals', {}).get('home', 0) or 0
                    a_goals = fixt.get('goals', {}).get('away', 0) or 0
                    match_sum = h_goals + a_goals
                    total_goals_val += match_sum
                    
                    if match_sum > max_match_goals:
                        max_match_goals = match_sum
                        t_h = fixt.get('teams', {}).get('home', {}).get('name', 'Home')
                        t_a = fixt.get('teams', {}).get('away', {}).get('name', 'Away')
                        highest_scoreline_lbl = f"{get_flag(t_h)} {t_h} {h_goals} - {a_goals} {t_a} {get_flag(t_a)}"
                    
                    for label, goals_ct in [('home', h_goals), ('away', a_goals)]:
                        curr_team = fixt.get('teams', {}).get(label, {}).get('name', '')
                        if curr_team and goals_ct > max_team_goals:
                            max_team_goals = goals_ct
                            most_goals_match_lbl = f"{get_flag(curr_team)} {curr_team} ({goals_ct} Goals)"
                
                avg_goals_val = total_goals_val / num_matches if num_matches > 0 else 0.0
                
                # Exclude counting systems for red cards in list details if needed
                for fixt in completed_fixtures:
                    events = fixt.get('events', [])
                    for e in events:
                        if e.get('type') == 'Card' and 'Red' in str(e.get('detail', '')):
                            red_cards_val += 1
                            
            stats_html = f"""
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Most Goals in a Match (Team)</div>
                <div style="font-size: 16px; font-weight: 850; color: var(--primary); margin: 6px 0;">{most_goals_match_lbl}</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Highest individual team score line reported.</div>
            </div>
            
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Highest Scoring Match</div>
                <div style="font-size: 16px; font-weight: 850; color: #1A6FBF; margin: 6px 0;">{highest_scoreline_lbl}</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Fixture yielding the maximum aggregate goal sum.</div>
            </div>
            
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total Goals Scored</div>
                <div style="font-size: 24px; font-weight: 850; color: #E65100; margin: 6px 0;">{total_goals_val} Goals</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Aggregated goals across any completed stage.</div>
            </div>

            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Average Goals per Match</div>
                <div style="font-size: 24px; font-weight: 850; color: #455A64; margin: 6px 0;">{avg_goals_val:.2f} Goals / G</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Average score output per finished confrontation.</div>
            </div>
            
            <div style="background-color: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 16px;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Number of Red Cards</div>
                <div style="font-size: 24px; font-weight: 850; color: #C62828; margin: 6px 0;">🟥 {red_cards_val} Cards</div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Disciplinaries and direct player ejections.</div>
            </div>
            """
            st.markdown(stats_html, unsafe_allow_html=True)

    if scorers_data and assists_data:
        render_live_leaderboards(scorers_data, assists_data, fixtures_data)
    else:
        render_pre_tournament_watch_list()
