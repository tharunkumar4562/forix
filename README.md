# ⚽ FORIX — FIFA World Cup 2026 AI Match Intelligence

FORIX is a premium, data-driven sports analytics platform designed to track, simulate, and analyze the FIFA World Cup 2026 tournament structure. Moving past typical generic beginner data-science projects, FORIX integrates live RESTful sports data arrays, localized historical machine learning vector lookups, and generative large language models into a high-performance, frictionless editorial dashboard.

---

## 🚀 Architectural Workflow

The platform operates on an decoupled multi-stage data orchestration model to completely mitigate manual input friction:

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
