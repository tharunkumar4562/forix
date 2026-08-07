import streamlit as st
import google.generativeai as genai

class GeminiAI:
    def __init__(self):
        try:
            genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        except Exception as e:
            print(f"Initialization Error in GeminiAI: {e}")
            self.model = None

    def generate_match_preview(self, home, away, home_form="", away_form="", key_home="", key_away=""):
        if not self.model:
            return f"### Tactical Preview: {home} vs {away}\nHistorical dynamics indicate an intense match. Look out for midfield transitions."
        try:
            prompt = (
                f"You are an elite football tactical analyst. Generate an extensive, high-end match preview "
                f"for the 2026 World Cup match: {home} vs {away}.\n"
                f"Recent Form: {home} ({home_form}), {away} ({away_form}).\n"
                f"Key Players: {key_home} (Home), {key_away} (Away).\n"
                f"Provide tactical structures, formation analysis, and predict a final score."
            )
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini preview generation failed: {e}")
            return f"### Tactical Preview: {home} vs {away}\nData parsing completed. Midfield possession control and set-pieces will decide the outcome."

    def generate_match_insight(self, home, away, home_score, away_score, events_summary=""):
        if not self.model:
            return f"### Post-Match Analysis\nMatch concluded. {home} {home_score} - {away_score} {away}.\nReview individual player stat sheets for impact ratings."
        try:
            prompt = (
                f"Analyze this completed World Cup game: {home} {home_score} - {away_score} {away}.\n"
                f"Events Log: {events_summary}.\n"
                f"Provide a definitive tactical review explaining where the game was won or lost."
            )
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini insight generation failed: {e}")
            return f"### Post-Match Analysis\n{home} and {away} delivered a high-stakes fixture. Tactical changes in the second half decided the game."
