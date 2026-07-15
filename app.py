import streamlit as st
import requests
import json
from datetime import datetime

# ─────────────────────────────────────────────
# Page Configuration
# ─────────────────────────────────────────────
st.set_page_config(
    page_title="AI Chatbot — Powered by Groq",
    page_icon="⚡",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────
# Custom CSS for Premium Look
# ─────────────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    /* Global */
    .stApp {
        font-family: 'Inter', sans-serif;
    }

    /* Chat Messages */
    .user-msg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 14px 18px;
        border-radius: 18px 18px 4px 18px;
        margin: 8px 0;
        max-width: 85%;
        margin-left: auto;
        font-size: 15px;
        line-height: 1.6;
        box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
    }

    .bot-msg {
        background: #f0f2f6;
        color: #1a1a2e;
        padding: 14px 18px;
        border-radius: 18px 18px 18px 4px;
        margin: 8px 0;
        max-width: 85%;
        font-size: 15px;
        line-height: 1.6;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* Dark mode bot message */
    [data-theme="dark"] .bot-msg {
        background: #262730;
        color: #fafafa;
    }

    .msg-time {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
    }

    /* Welcome */
    .welcome-box {
        text-align: center;
        padding: 60px 20px;
    }

    .welcome-box h1 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .welcome-box p {
        color: #888;
        font-size: 1.05rem;
    }

    /* Suggestion buttons */
    .stButton > button {
        border-radius: 12px !important;
        padding: 10px 20px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
    }

    .stButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Sidebar styling */
    .sidebar-title {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .stats-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        margin: 10px 0;
        text-align: center;
    }

    .stats-card h3 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 700;
    }

    .stats-card p {
        margin: 4px 0 0 0;
        font-size: 0.85rem;
        opacity: 0.85;
    }
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────
# Session State Initialization
# ─────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []

if "api_key" not in st.session_state:
    st.session_state.api_key = ""

if "total_messages" not in st.session_state:
    st.session_state.total_messages = 0

if "model" not in st.session_state:
    st.session_state.model = "llama-3.3-70b-versatile"


# ─────────────────────────────────────────────
# Groq API Call Function
# ─────────────────────────────────────────────
def chat_with_groq(user_message: str, chat_history: list) -> str:
    """Send message to Groq API and return the response."""

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {st.session_state.api_key}",
        "Content-Type": "application/json",
    }

    # Build messages list from history
    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful, friendly AI assistant. "
                "Provide clear, concise, and accurate answers. "
                "Use markdown formatting when helpful."
            ),
        }
    ]

    # Add chat history (last 20 messages for context)
    for msg in chat_history[-20:]:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": st.session_state.model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
        "top_p": 0.9,
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            return "❌ **Invalid API Key.** Please check your Groq API key and try again."
        elif response.status_code == 429:
            return "⏳ **Rate limit reached.** Please wait a moment and try again."
        else:
            return f"❌ **API Error ({response.status_code}):** {str(e)}"

    except requests.exceptions.ConnectionError:
        return "❌ **Connection Error.** Please check your internet connection."

    except Exception as e:
        return f"❌ **Error:** {str(e)}"


# ─────────────────────────────────────────────
# Sidebar
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown('<div class="sidebar-title">⚡ AI Chatbot</div>', unsafe_allow_html=True)

    # API Key Input
    api_key = st.text_input(
        "🔑 Groq API Key",
        type="password",
        value=st.session_state.api_key,
        placeholder="gsk_xxxxxxxxxxxxxxxx",
        help="Get your free key at [console.groq.com/keys](https://console.groq.com/keys)",
    )

    if api_key != st.session_state.api_key:
        st.session_state.api_key = api_key

    # Model Selection
    model_options = {
        "llama-3.3-70b-versatile": "🦙 Llama 3.3 70B (Best)",
        "llama-3.1-8b-instant": "🚀 Llama 3.1 8B (Fastest)",
        "gemma2-9b-it": "💎 Gemma 2 9B",
        "mixtral-8x7b-32768": "🌀 Mixtral 8x7B",
    }

    selected_model = st.selectbox(
        "🤖 AI Model",
        options=list(model_options.keys()),
        format_func=lambda x: model_options[x],
        index=0,
    )
    st.session_state.model = selected_model

    st.divider()

    # Stats
    st.markdown(
        f"""
        <div class="stats-card">
            <h3>{st.session_state.total_messages}</h3>
            <p>Messages Sent</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.divider()

    # Actions
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()
    with col2:
        if st.button("📋 Export", use_container_width=True):
            if st.session_state.messages:
                chat_text = "\n\n".join(
                    [f"{'You' if m['role'] == 'user' else 'AI'}: {m['content']}"
                     for m in st.session_state.messages]
                )
                st.download_button(
                    "💾 Download",
                    chat_text,
                    file_name=f"chat_{datetime.now().strftime('%Y%m%d_%H%M')}.txt",
                    use_container_width=True,
                )

    st.divider()
    st.caption("Built with Python 🐍 & Streamlit")
    st.caption("[GitHub](https://github.com) • [Groq](https://groq.com)")


# ─────────────────────────────────────────────
# Main Chat Area
# ─────────────────────────────────────────────

# Check API Key
if not st.session_state.api_key:
    st.markdown(
        """
        <div class="welcome-box">
            <h1>⚡ AI Chatbot</h1>
            <p>Enter your free Groq API key in the sidebar to start chatting.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.info("👈 Enter your **Groq API Key** in the sidebar to begin. [Get free key →](https://console.groq.com/keys)")

    st.stop()


# Welcome screen with suggestions (when no messages)
if not st.session_state.messages:
    st.markdown(
        """
        <div class="welcome-box">
            <h1>⚡ How can I help you?</h1>
            <p>Powered by Groq — the fastest AI inference engine</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Suggestion buttons
    suggestions = [
        ("🔬 Explain quantum computing", "Explain quantum computing in simple terms with examples"),
        ("📧 Write a professional email", "Write a professional email to a client about a project delay"),
        ("💻 Python code example", "Create a Python function to sort a list of dictionaries by a specific key"),
        ("💡 Business ideas", "Give me 5 creative and unique business ideas for 2025"),
    ]

    cols = st.columns(2)
    for i, (label, prompt) in enumerate(suggestions):
        with cols[i % 2]:
            if st.button(label, key=f"sug_{i}", use_container_width=True):
                st.session_state.messages.append({"role": "user", "content": prompt})
                with st.spinner("Thinking..."):
                    response = chat_with_groq(prompt, [])
                st.session_state.messages.append({"role": "assistant", "content": response})
                st.session_state.total_messages += 1
                st.rerun()


# Display chat messages
for msg in st.session_state.messages:
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="⚡"):
            st.markdown(msg["content"])


# Chat input
if prompt := st.chat_input("Type your message here..."):
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})

    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt)

    # Get AI response
    with st.chat_message("assistant", avatar="⚡"):
        with st.spinner("Thinking..."):
            response = chat_with_groq(prompt, st.session_state.messages[:-1])
        st.markdown(response)

    # Add assistant message
    st.session_state.messages.append({"role": "assistant", "content": response})
    st.session_state.total_messages += 1
    st.rerun()
