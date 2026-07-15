import streamlit as st
from groq import Groq

st.set_page_config(
    page_title="AI English Tutor",
    page_icon="🎓",
    layout="wide"
)

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

with st.sidebar:
    st.title("🎓 AI English Tutor")

    api_key = st.text_input(
        "Groq API Key",
        type="password",
        placeholder="gsk_..."
    )

    level = st.selectbox(
        "Your English Level",
        ["Beginner", "Elementary", "Intermediate", "Advanced"]
    )

    native_language = st.selectbox(
        "Your Native Language",
        ["Bengali", "Hindi", "Arabic", "Spanish", "Other"]
    )

    model = st.selectbox(
        "AI Model",
        [
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile"
        ]
    )

if not api_key:
    st.title("🎓 AI English Tutor")
    st.info("বাম পাশের sidebar-এ আপনার Groq API Key দিন।")

    st.markdown("""
    ### Free Groq API Key পাওয়ার নিয়ম

    1. [console.groq.com](https://console.groq.com) খুলুন
    2. Account তৈরি বা Login করুন
    3. API Keys থেকে নতুন key তৈরি করুন
    4. Key-টি sidebar-এ paste করুন

    **আপনার API key কারও সঙ্গে share করবেন না।**
    """)
    st.stop()

client = Groq(api_key=api_key)


def ask_ai(system_prompt, user_prompt, history=None, temperature=0.4):
    messages = [
        {"role": "system", "content": system_prompt}
    ]

    if history:
        messages.extend(history)

    messages.append({
        "role": "user",
        "content": user_prompt
    })

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=1200
    )

    return response.choices[0].message.content


st.title("🎓 AI English Tutor")
st.caption("Practice English with your personal AI teacher")

tab1, tab2, tab3, tab4 = st.tabs([
    "💬 Conversation",
    "✏️ Correction",
    "📖 Dictionary",
    "🌐 Translator"
])


# Conversation
with tab1:
    st.header("💬 English Conversation")

    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    user_message = st.chat_input(
        "Write something in English..."
    )

    if user_message:
        st.session_state.chat_history.append({
            "role": "user",
            "content": user_message
        })

        system_prompt = f"""
You are a friendly English teacher.

Student English level: {level}
Student native language: {native_language}

Have a natural conversation in English.
Gently correct important mistakes after your reply.
Use this format when correction is needed:

📝 Correction:
Wrong: ...
Correct: ...
Why: ...

Keep your answer friendly and not too long.
"""

        try:
            answer = ask_ai(
                system_prompt,
                user_message,
                history=st.session_state.chat_history[:-1],
                temperature=0.7
            )

            st.session_state.chat_history.append({
                "role": "assistant",
                "content": answer
            })

            st.rerun()

        except Exception as error:
            st.error(f"Error: {error}")

    if st.button("🗑️ Clear Conversation"):
        st.session_state.chat_history = []
        st.rerun()


# Sentence Correction
with tab2:
    st.header("✏️ Sentence Correction")

    sentence = st.text_area(
        "Write your English sentence or paragraph:",
        height=180,
        placeholder="Example: I am go to market yesterday."
    )

    if st.button("✏️ Correct My English"):
        if not sentence.strip():
            st.warning("Please write something first.")
        else:
            prompt = f"""
Correct the following English text for a {level} student.

Give your answer in this format:

## ✅ Correct Version
Write the corrected sentence.

## 🔍 Mistakes
Explain each mistake simply.

## 💡 Grammar Tip
Give one or two useful grammar tips.

## 🌟 Natural Version
Write a more natural version if possible.

Text:
{sentence}
"""

            try:
                with st.spinner("Checking your English..."):
                    result = ask_ai(
                        "You are a patient and expert English grammar teacher.",
                        prompt
                    )

                st.markdown(result)

            except Exception as error:
                st.error(f"Error: {error}")


# Dictionary
with tab3:
    st.header("📖 Word Dictionary")

    word = st.text_input(
        "Enter an English word:",
        placeholder="Example: beautiful"
    )

    if st.button("🔍 Explain Word"):
        if not word.strip():
            st.warning("Please enter a word.")
        else:
            prompt = f"""
Explain the English word "{word}" for a {level} student.

Include:

## 🔤 Word
## 📌 Meaning
Explain in simple English.

## 🗣️ Pronunciation
Give pronunciation.

## 🌐 Bengali/Native Language Meaning
Give the meaning in {native_language}.

## 💬 Example Sentences
Give three example sentences.

## 🔄 Synonyms
Give three synonyms.

## 🚫 Common Mistake
Mention one common mistake.
"""

            try:
                with st.spinner("Finding word meaning..."):
                    result = ask_ai(
                        "You are an English dictionary and vocabulary teacher.",
                        prompt
                    )

                st.markdown(result)

            except Exception as error:
                st.error(f"Error: {error}")


# Translator
with tab4:
    st.header("🌐 Bengali to English Translator")

    source_text = st.text_area(
        "Write Bengali or another language:",
        height=180,
        placeholder="আমি ইংরেজি শিখতে চাই।"
    )

    if st.button("🌐 Translate and Explain"):
        if not source_text.strip():
            st.warning("Please write something first.")
        else:
            prompt = f"""
Translate the following text into natural English.

Student level: {level}
Native language: {native_language}

Give your answer in this format:

## 🌐 English Translation
Give the translation.

## 🔤 Important Words
Explain important vocabulary.

## 📝 Grammar Explanation
Explain the important grammar simply.

## 💬 Another Natural Version
Give another way to say it.

Text:
{source_text}
"""

            try:
                with st.spinner("Translating..."):
                    result = ask_ai(
                        "You are an English translator and teacher.",
                        prompt
                    )

                st.markdown(result)

            except Exception as error:
                st.error(f"Error: {error}")