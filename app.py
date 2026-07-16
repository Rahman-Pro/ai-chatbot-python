import streamlit as st
from groq import Groq
import json
import requests
from bs4 import BeautifulSoup
import datetime
import math

# Page Config
st.set_page_config(
    page_title="Advanced AI Agent Chatbot",
    page_icon="🤖",
    layout="wide"
)

# Initialize Session State
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "raw_history" not in st.session_state:
    st.session_state.raw_history = []

# --- Tool Definitions ---

def get_current_time():
    """Get the current system/local date and time."""
    return f"Current local time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

def calculate(expression):
    """Evaluate a mathematical expression safely. Supports basic arithmetic operators: +, -, *, /, (, )."""
    try:
        # Create a safe math environment
        allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
        allowed_names.update({"abs": abs, "round": round, "min": min, "max": max, "sum": sum, "pow": pow})
        
        # Clean expression
        clean_expr = "".join(c for c in expression if c in "0123456789+-*/()., eEpi* ")
        result = eval(clean_expr, {"__builtins__": None}, allowed_names)
        return f"Calculation Result for '{expression}': {result}"
    except Exception as e:
        return f"Error executing math calculation: {str(e)}"

def search_wikipedia(query):
    """Search Wikipedia for summary information about a topic, person, history, or concept."""
    try:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "utf8": 1
        }
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        search_data = res.json()
        search_results = search_data.get("query", {}).get("search", [])
        
        if not search_results:
            return f"No Wikipedia search results found for '{query}'."
            
        top_title = search_results[0]["title"]
        summary_params = {
            "action": "query",
            "prop": "extracts",
            "exintro": 1,
            "explaintext": 1,
            "titles": top_title,
            "format": "json"
        }
        summary_res = requests.get(url, params=summary_params, timeout=10)
        summary_res.raise_for_status()
        summary_data = summary_res.json()
        pages = summary_data.get("query", {}).get("pages", {})
        page_id = list(pages.keys())[0]
        
        if page_id == "-1":
            return f"Found Wikipedia article '{top_title}', but failed to retrieve its summary content."
            
        extract = pages[page_id].get("extract", "")
        return f"Source: Wikipedia - Article: {top_title}\n\nSummary:\n{extract}"
    except Exception as e:
        return f"Error retrieving Wikipedia summary: {str(e)}"

def fetch_webpage(url):
    """Fetch the text content of a webpage or site to gather live information."""
    try:
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
            
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        for script_or_style in soup(["script", "style", "meta", "noscript"]):
            script_or_style.decompose()
            
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = "\n".join(chunk for chunk in chunks if chunk)
        
        # Trim text to avoid token overflow
        max_length = 1500
        truncated = clean_text[:max_length]
        if len(clean_text) > max_length:
            truncated += "\n... [Content Truncated due to size constraints]"
            
        return f"Source Webpage URL: {url}\n\nContent:\n{truncated}"
    except Exception as e:
        return f"Error scraping web page '{url}': {str(e)}"

# Groq Tool Definitions List
agent_tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the current system local date and time.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Evaluate basic mathematical expressions. Supporting standard operators: +, -, *, /, (, ).",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The math equation to compute, e.g., '12 * (3.5 + 4)'"
                    }
                },
                "required": ["expression"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_wikipedia",
            "description": "Search Wikipedia for general information on concepts, historical events, famous people, or topics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search term to query Wikipedia for."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_webpage",
            "description": "Fetch raw text content of an external website page. Use this to search or browse details from a URL.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The target website URL."
                    }
                },
                "required": ["url"]
            }
        }
    }
]

# Sidebar configuration
with st.sidebar:
    st.title("🤖 Groq AI Agent")
    st.caption("Advanced Python & Streamlit Agent Console")
    
    api_key = st.text_input(
        "Groq API Key",
        type="password",
        placeholder="gsk_..."
    )
    
    # Toggle to enable/disable tools
    agent_enabled = st.toggle("Enable Agentic Tools", value=True, help="When enabled, the AI can search Wikipedia, browse web URLs, and run math calculations.")
    
    level = st.selectbox(
        "Your English Level (Tutor Mode)",
        ["Beginner", "Elementary", "Intermediate", "Advanced"]
    )
    
    native_language = st.selectbox(
        "Your Native Language (Tutor Mode)",
        ["Bengali", "Hindi", "Arabic", "Spanish", "Other"]
    )
    
    model = st.selectbox(
        "AI Model",
        [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant"
        ]
    )

# Key check fallback
if not api_key:
    st.title("🤖 Groq AI Agent Console")
    st.info("👈 বাম পাশের Sidebar-এ আপনার Groq API Key দিন শুরু করার জন্য।")
    st.markdown("""
    ### Free Groq API Key পাওয়ার নিয়ম:
    1. [console.groq.com](https://console.groq.com/keys) এ যান।
    2. Account তৈরি অথবা Login করুন।
    3. **Create API Key** বাটনে ক্লিক করে key কপি করুন।
    4. Sidebar-এ paste করুন।
    
    *🔒 আপনার API key নিরাপদ। এটি সম্পূর্ণ client-side এ চলে এবং কোনো সার্ভারে জমা রাখা হয় না।*
    """)
    st.stop()

# Initialize Groq Client
client = Groq(api_key=api_key)

# Unified Agent execution loop
def run_agent_execution(system_prompt, user_query, history_messages=None, temperature=0.5):
    # Initialize query message structure
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    if history_messages:
        messages.extend(history_messages)
        
    messages.append({"role": "user", "content": user_query})
    
    max_loops = 5
    loop_cnt = 0
    
    status_placeholder = st.empty()
    
    while loop_cnt < max_loops:
        loop_cnt += 1
        
        # Build API kwargs
        api_kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        
        # Attach tools if enabled
        if agent_enabled:
            api_kwargs["tools"] = agent_tools
            api_kwargs["tool_choice"] = "auto"
            
        response = client.chat.completions.create(**api_kwargs)
        response_msg = response.choices[0].message
        
        # Check if LLM requested tool execution
        tool_calls = getattr(response_msg, "tool_calls", None)
        
        if tool_calls:
            # We must append the model's message containing tool_calls first
            messages.append(response_msg)
            
            with status_placeholder.status(f"🤖 Agent executing {len(tool_calls)} action(s)...", expanded=True) as status:
                for tool in tool_calls:
                    func_name = tool.function.name
                    func_args = json.loads(tool.function.arguments)
                    
                    status.write(f"⚙️ **Running Tool:** `{func_name}`")
                    status.write(f"💬 **Args:** `{json.dumps(func_args)}`")
                    
                    # Execute
                    if func_name == "get_current_time":
                        out = get_current_time()
                    elif func_name == "calculate":
                        out = calculate(func_args.get("expression", ""))
                    elif func_name == "search_wikipedia":
                        out = search_wikipedia(func_args.get("query", ""))
                    elif func_name == "fetch_webpage":
                        out = fetch_webpage(func_args.get("url", ""))
                    else:
                        out = f"Error: Tool '{func_name}' is not recognized."
                        
                    status.write(f"✅ **Output:** {out[:200]}...")
                    
                    # Append tool response
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool.id,
                        "name": func_name,
                        "content": out
                    })
                
                status.update(label="🤖 Tool executing complete. Formulating final answer...", state="running")
        else:
            # Final output reached
            status_placeholder.empty()
            return response_msg.content, messages
            
    status_placeholder.empty()
    return "Error: Maximum agent processing limit reached.", messages

# App UI layout
st.title("🤖 Advanced AI Agent Chatbot")
st.caption("Powered by Groq's high-speed LPU and Python execution tools")

tab1, tab2, tab3, tab4 = st.tabs([
    "💬 AI Agent Chat",
    "✏️ English Tutor / Grammar Checker",
    "📖 Intelligent Dictionary",
    "🌐 Context Translator"
])

# Tab 1: Conversational Agent Chat
with tab1:
    st.header("💬 Conversational AI Agent")
    st.caption("Ask anything! The agent will use tools (Wikipedia, scraping, calculator, time) if required.")
    
    # Display clean chat history
    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            
    user_input = st.chat_input("Ask a question, request a calculation, or paste a URL...")
    
    if user_input:
        # Show user message
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)
            
        sys_prompt = """You are an advanced AI agent assistant powered by Groq.
You have access to tools that can check local time, perform mathematical equations, lookup Wikipedia summaries, and browse webpages.
Use tools when requested or when answering a query requires information that you do not know. 
Keep your replies structured, informative, and friendly. Explain briefly what tools you used if you called any."""
        
        try:
            with st.spinner("Thinking..."):
                ans, updated_raw = run_agent_execution(
                    system_prompt=sys_prompt,
                    user_query=user_input,
                    history_messages=st.session_state.raw_history,
                    temperature=0.5
                )
            
            # Save raw history containing tools
            # Discard system prompts from raw history to prevent duplicates
            st.session_state.raw_history = [m for m in updated_raw if m.get("role") != "system"]
            
            # Save and display answer
            st.session_state.chat_history.append({"role": "assistant", "content": ans})
            with st.chat_message("assistant"):
                st.markdown(ans)
                
            st.rerun()
        except Exception as err:
            st.error(f"Error executing agent query: {err}")
            
    if st.button("🗑️ Clear Agent Chat History"):
        st.session_state.chat_history = []
        st.session_state.raw_history = []
        st.rerun()

# Tab 2: English Tutor / Grammar Checker
with tab2:
    st.header("✏️ English Tutor Correction")
    st.caption("Submit your English sentences to analyze mistakes and receive detailed tutoring feedback.")
    
    sentence = st.text_area(
        "Enter English text to analyze:",
        height=150,
        placeholder="Example: She don't likes writing scripts."
    )
    
    if st.button("✏️ Correct Writing"):
        if not sentence.strip():
            st.warning("Please type a sentence first.")
        else:
            tutor_sys = f"You are a patient and expert English grammar teacher for a {level} level student whose native language is {native_language}."
            tutor_query = f"""Analyze and correct the following text. Highlight specific mistakes, explain them simply, provide grammar tips, and suggest a more natural alternative.
            
Text:
{sentence}"""
            
            try:
                with st.spinner("Analyzing text..."):
                    ans, _ = run_agent_execution(tutor_sys, tutor_query, temperature=0.3)
                st.markdown(ans)
            except Exception as err:
                st.error(f"Error: {err}")

# Tab 3: Intelligent Dictionary
with tab3:
    st.header("📖 Intelligent Dictionary")
    st.caption("Look up definition details, synonyms, pronunciations, and native translations.")
    
    word = st.text_input("Enter a word to inspect:", placeholder="Example: Resilience")
    
    if st.button("🔍 Analyze Word"):
        if not word.strip():
            st.warning("Please write a word.")
        else:
            dict_sys = f"You are a lexicographer and dictionary teacher. Help a {level} student with native language {native_language}."
            dict_query = f"""Explain the word '{word}' in detail.
Include:
1. Definition & Pronunciation
2. Meaning in {native_language} (if known/applicable)
3. Three distinct example sentences
4. Synonyms & Antonyms
5. A common mistake when using this word."""
            
            try:
                with st.spinner("Looking up word details..."):
                    ans, _ = run_agent_execution(dict_sys, dict_query, temperature=0.3)
                st.markdown(ans)
            except Exception as err:
                st.error(f"Error: {err}")

# Tab 4: Context Translator
with tab4:
    st.header("🌐 Context Translator")
    st.caption("Translate words or sentences and explain structural context grammar differences.")
    
    source = st.text_area("Write source text to translate:", height=150, placeholder="Example Bengali: আমি গতকাল সেখানে গিয়েছিলাম।")
    
    if st.button("🌐 Translate and Explain Context"):
        if not source.strip():
            st.warning("Please enter text to translate.")
        else:
            trans_sys = f"You are an expert bilingual translator. Help a {level} student with native language {native_language}."
            trans_query = f"""Translate the following text into natural English. Explain important vocabulary words and contrast the grammar rules between English and {native_language} for this specific sentence structure.
            
Text:
{source}"""
            
            try:
                with st.spinner("Translating..."):
                    ans, _ = run_agent_execution(trans_sys, trans_query, temperature=0.4)
                st.markdown(ans)
            except Exception as err:
                st.error(f"Error: {err}")