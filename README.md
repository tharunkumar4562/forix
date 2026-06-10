# ⚽ FORIX — FIFA World Cup 2026 AI Match Intelligence

FORIX is a premium, data-driven sports analytics platform designed to track, simulate, and analyze the FIFA World Cup 2026 tournament structure. Moving past typical generic beginner data-science projects, FORIX integrates live RESTful sports data arrays, localized historical machine learning vector lookups, and generative large language models into a high-performance, frictionless editorial dashboard.

---

## 🚀 Architectural Workflow

The platform operates on a decoupled multi-stage data orchestration model to completely mitigate manual input friction:

```text
[ API-Sports / worldcup26.ir ] ──> Raw Match Metrics & Real-time Feeds
                                            │
                                            ▼
[ Local database.csv ] ───────────> Historical ELO & Form Vectors
                                            │
                                            ▼
[ Random Forest Engine ] ─────────> Core Win / Draw / Loss Probabilities
                                            │
                                            ▼
[ Google Gemini 1.5 ] ────────────> Automated Tactical Previews & Columns
                                            │
                                            ▼
[ Streamlit Editorial UI ] ───────> Frictionless Global Fan Dashboard
```

---

## ✨ Key Features & Multi-Page Layout

* **🏠 Page 1: The Match Hub (Main Launchpad)** — Features an elegant, high-contrast editorial light theme layout featuring automated live tournament tracking cards segmented into `Live Now`, `Upcoming`, and `Completed` matrices.
* **📊 Page 2: The Match Center (Core Engine)** — A comprehensive matchup deep-dive pane that resolves historical Head-to-Head (H2H) arrays, runs the predictive machine learning simulation matrix, and features a blurred premium value-teaser up-sell block linked to community crowdfunding.
* **🏆 Page 3: Tournament Standings & Leaderboards** — Real-time dynamic updates tracking all 48 participating countries mapped natively across 12 distinct tournament brackets (Groups A–L) with color-tinted qualification boundary indicators.
* **🗞️ Page 4: AI Insights Feed** — Automated tactical press columns and long-form journalistic previews generated dynamically by feeding live frame states straight into Google Gemini context tokens.

---

## 🛠️ Deep Tech Stack

* **UI Framework:** Streamlit (Custom layout injection utilizing explicit CSS container styling)
* **Data Processing & Analytics:** Pandas, NumPy
* **Machine Learning Model:** Scikit-Learn (Random Forest Classification pipeline utilizing automated ELO calculation sequences)
* **Generative AI Core:** Google Gemini 1.5 Flash (`google-generativeai`)
* **Primary Infrastructure Providers:** Direct API-Sports endpoints, backed up by the public `worldcup26.ir` REST framework for automated connection failover coverage.

---

## 📦 Local Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tharunkumar4562/forix.git
   cd forix
   ```

2. **Install Target System Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Secrets**  
   Create a `.streamlit/` directory in the project root and add a `secrets.toml` file inside it:
   ```toml
   # .streamlit/secrets.toml
   FOOTBALL_API_KEY = "YOUR_DIRECT_API_SPORTS_CREDENTIAL_HERE"
   GEMINI_API_KEY   = "YOUR_GOOGLE_AI_STUDIO_KEY_HERE"
   ```

4. **Launch the Core Application Hub**
   ```bash
   streamlit run app.py
   ```

---

## 🔒 Production Security Protocols

This project implements strict enterprise-grade repository governance:

* **Zero exposed hardcoded configurations:** All endpoints are defined natively as immutable strings inside helper classes; authentication handshakes occur strictly through sandboxed local configuration blocks.
* **Automated `.gitignore` guards:** Pre-configured constraints completely safeguard standard Python dependency trees, caching engines (`__pycache__`), Node directories, and Streamlit environment tokens from public repository tracking leaks.

---

## 👨‍💻 Author

**Tharun Kumar Malepati** — *Computer Science & AI/ML Developer*

* **GitHub:** [@tharunkumar4562](https://github.com/tharunkumar4562)
* **LinkedIn:** [Malepati Tharun Kumar](https://www.linkedin.com/in/malepati-tharun-kumar/)

---

*Disclaimer: This platform operates entirely on experimental, mathematical machine-learning algorithms and open-source APIs. Built solely for educational architecture validation and predictive portfolio research. No financial reliance implied.*
