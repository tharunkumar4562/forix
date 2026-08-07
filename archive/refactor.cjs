const fs = require('fs');
const files = ['app.py', 'pages/1_Match_Center.py', 'pages/2_Standings.py', 'pages/3_Insights.py'];

for (const filepath of files) {
    if (!fs.existsSync(filepath)) continue;
    let content = fs.readFileSync(filepath, 'utf8');

    content = content.replace(
        /import streamlit as st.*?initial_sidebar_state=[\"']collapsed[\"']\s*\)/s,
        `import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from utils.api_football import FootballAPI
from utils.gemini_helper import GeminiAI

# Global Layout Initialization
st.set_page_config(page_title="FORIX Hub", layout="wide", initial_sidebar_state="collapsed")

# Instantiating clean data handlers
api = FootballAPI()
ai = GeminiAI()`
    );
    
    fs.writeFileSync(filepath, content);
}
console.log('Done replacing headers');
