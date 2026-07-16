# ⚡ Advanced AI Agent Chatbot — Powered by Groq & Python

An advanced, ultra-fast **AI Agent Chatbot** built with **Python (Streamlit)** and **client-side JavaScript (HTML/CSS)**, running on **Groq's LPU** inference engine.

This is a true agentic application that features **autonomous tool-calling** (function calling) in both the Python server-side application and the browser client-side application. The agent can dynamically decide to query Wikipedia, execute math expressions, check system local time, or scrape webpage links to retrieve answer context.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red?logo=streamlit&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-API-orange)
![License](https://img.shields.io/badge/License-MIT-green)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://rahman-pro.github.io/ai-chatbot-python/)

---

## 🌐 Live Demo & Client-Side Agent
Try the static web version of the chatbot directly in your browser — zero installation and serverless:

👉 **[https://rahman-pro.github.io/ai-chatbot-python/](https://rahman-pro.github.io/ai-chatbot-python/)**

*🔒 Your API key stays in your browser's local storage and is sent directly to Groq. It never touches any third-party servers.*

---

## ⚙️ Agentic Tools & Function Calling
When a user asks a query, the AI does not just predict text; it is equipped with tools that it calls autonomously:

1.  **Wikipedia Lookup (`search_wikipedia`):** Queries the Wikipedia REST API (fully supported client-side with CORS) to extract introductory summaries on people, science, history, and concepts.
2.  **Safe Math Calculator (`calculate`):** Safely computes basic mathematical equations using arithmetic operations, avoiding LLM math errors.
3.  **Web Scraping (`fetch_webpage` - Python):** Fetches the DOM and parses plain-text content of external webpages to gather real-time context.
4.  **Local Time Clock (`get_current_time`):** Returns the user's local date and time.

---

## ✨ Features
*   **Collapsible Thought Process Logs:** Visual logs showing the agent's thought process, what tools it is executing, what arguments it is passing, and the raw tool output.
*   **Dual Mode Implementation:** Includes both a Streamlit Python console and a static HTML/JS web interface.
*   **Multi-Model Select:** Supports top-tier models like Llama 3.3 70B, Llama 3.1 8B, Gemma 2, and Mixtral.
*   **Interactive Tabs (Streamlit Tutor Console):**
    *   `💬 AI Agent Chat` — The core tool-calling conversation assistant.
    *   `✏️ English Tutor / Grammar Checker` — Analyzes grammar mistakes and provides detailed feedback.
    *   `📖 Dictionary` — Detailed vocabulary definition details, example sentences, and synonyms.
    *   `🌐 Context Translator` — Context-aware translation that explains structural sentence rules.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/rahman-pro/ai-chatbot-python.git
cd ai-chatbot-python
```

### 2. Install Dependencies
Make sure you install the updated dependencies which include the `groq` SDK and `beautifulsoup4` for web scraping:
```bash
pip install -r requirements.txt
```

### 3. Get Free Groq API Key
1. Go to [console.groq.com](https://console.groq.com/keys)
2. Sign up/Login (free, no credit card needed)
3. Create an API Key

### 4. Run the Applications

#### Option A: Streamlit Python Agent (Recommended)
```bash
streamlit run app.py
```
The console will open at `http://localhost:8501` 🎉

#### Option B: Static Web Client (Serverless)
Simply open `index.html` directly in your browser or run a simple local web server:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 🌐 Deploy for Free (Streamlit Cloud)
1. Push this repository to your GitHub account.
2. Visit [share.streamlit.io](https://share.streamlit.io).
3. Connect your GitHub repository.
4. Select `app.py` as the main path and click **Deploy**. ✅

---

## 📁 Project Structure
```
ai-chatbot-python/
├── index.html           # Static web client template
├── style.css            # Custom CSS for theme & Agent Thought indicators
├── app.js               # Web interface agent & tool calling logic
├── app.py               # Streamlit application (Tutor tabs & Agent loop)
├── requirements.txt     # Python dependencies (Streamlit, Groq, BeautifulSoup)
└── README.md            # Documentation
```

---

## 🛠️ Tech Stack
| Technology | Purpose |
| :--- | :--- |
| **Python 3.9+** | Core server-side language |
| **Streamlit** | Dashboard and chat UI layout |
| **Groq SDK** | Quick LLM inference and function-calling orchestration |
| **BeautifulSoup4**| Web scraping tool parser |
| **HTML/CSS/JS** | Client-side static agent runner |

---

## 👨‍💻 Author
Built with ❤️ by **Atiqur Rahman**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/atiqur-rahman-pro/)

⭐ **Star this repo** if you find it useful!
