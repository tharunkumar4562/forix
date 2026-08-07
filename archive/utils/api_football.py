import streamlit as st
import requests

class FootballAPI:
    BASE_URL = "https://v3.football.api-sports.io"
    FALLBACK_URL = "https://worldcup26.ir/get"
    
    def __init__(self):
        # Read API key from Streamlit secrets (never hardcode)
        try:
            api_key = st.secrets["FOOTBALL_API_KEY"]
        except Exception:
            api_key = ""
        self.headers = {"x-apisports-key": api_key}

    @st.cache_data(ttl=300)
    def get_live_fixtures(_self):
        try:
            url = f"{_self.BASE_URL}/fixtures"
            params = {"live": "all", "league": "1", "season": "2026"}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"):
                    return res_json["response"]
            
            # Continuous Fallback to Open Source Public API if Direct fails
            fallback = requests.get(f"{_self.FALLBACK_URL}/games", timeout=10)
            if fallback.status_code == 200:
                data = fallback.json()
                # Ensure we always return a list, not a dict
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"API Error in get_live_fixtures: {e}")
        return []

    @st.cache_data(ttl=300)
    def get_upcoming_fixtures(_self, count=10):
        try:
            url = f"{_self.BASE_URL}/fixtures"
            params = {"league": "1", "season": "2026", "status": "NS", "next": str(count)}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_upcoming_fixtures: {e}")
        return []

    @st.cache_data(ttl=300)
    def get_completed_fixtures(_self, count=10):
        try:
            url = f"{_self.BASE_URL}/fixtures"
            params = {"league": "1", "season": "2026", "status": "FT", "last": str(count)}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_completed_fixtures: {e}")
        return []

    @st.cache_data(ttl=600)
    def get_head_to_head(_self, team1_id, team2_id, count=5):
        try:
            url = f"{_self.BASE_URL}/fixtures/headtohead"
            params = {"h2h": f"{team1_id}-{team2_id}", "last": str(count)}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_head_to_head: {e}")
        return []

    @st.cache_data(ttl=60)
    def get_lineups(_self, fixture_id):
        try:
            url = f"{_self.BASE_URL}/fixtures/lineups"
            params = {"fixture": str(fixture_id)}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_lineups: {e}")
        return []

    @st.cache_data(ttl=60)
    def get_player_stats(_self, fixture_id):
        try:
            url = f"{_self.BASE_URL}/fixtures/players"
            params = {"fixture": str(fixture_id)}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_player_stats: {e}")
        return []

    @st.cache_data(ttl=600)
    def get_standings(_self):
        try:
            url = f"{_self.BASE_URL}/standings"
            params = {"league": "1", "season": "2026"}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
                
            # Continuous Fallback to Open Source Public Standings
            fallback = requests.get(f"{_self.FALLBACK_URL}/groups", timeout=10)
            if fallback.status_code == 200:
                return fallback.json()
        except Exception as e:
            print(f"API Error in get_standings: {e}")
        return []

    @st.cache_data(ttl=600)
    def get_top_scorers(_self):
        try:
            url = f"{_self.BASE_URL}/players/topscorers"
            params = {"league": "1", "season": "2026"}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_top_scorers: {e}")
        return []

    @st.cache_data(ttl=600)
    def get_top_assists(_self):
        try:
            url = f"{_self.BASE_URL}/players/topassists"
            params = {"league": "1", "season": "2026"}
            response = requests.get(url, headers=_self.headers, params=params, timeout=10)
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("response"): return res_json["response"]
        except Exception as e:
            print(f"API Error in get_top_assists: {e}")
        return []
