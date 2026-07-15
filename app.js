// State Management
let apiKey = localStorage.getItem('groq_api_key') || '';
let chats = JSON.parse(localStorage.getItem('groq_chats')) || [];
let activeChatId = localStorage.getItem('groq_active_chat_id') || '';
let currentTheme = localStorage.getItem('groq_theme') || 'dark';

// DOM Elements
const modalOverlay = document.getElementById('api-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');

const appContainer = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const modelSelect = document.getElementById('model-select');
const chatHistory = document.getElementById('chat-history');
const newChatBtn = document.getElementById('new-chat-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const changeKeyBtn = document.getElementById('change-key-btn');

const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const messagesDiv = document.getElementById('messages');
const currentModelName = document.getElementById('current-model-name');

const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const suggestionCards = document.querySelectorAll('.suggestion-card');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initApp();
    setupEventListeners();
});

function initTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>`;
    } else {
        document.body.classList.remove('light-theme');
        themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    }
}

function initApp() {
    if (!apiKey) {
        modalOverlay.classList.remove('hidden');
        appContainer.classList.add('hidden');
        return;
    }

    modalOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');

    if (chats.length === 0) {
        createNewChat();
    } else {
        if (!activeChatId) {
            activeChatId = chats[0].id;
        }
        loadChat(activeChatId);
    }
    renderSidebar();
}

function setupEventListeners() {
    // API Key Event Listeners
    saveKeyBtn.addEventListener('click', saveApiKey);
    apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Sidebar Mobile Toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // New Chat Button
    newChatBtn.addEventListener('click', () => {
        createNewChat();
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });

    // Clear All Chats
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all chats?')) {
            chats = [];
            activeChatId = '';
            localStorage.removeItem('groq_chats');
            localStorage.removeItem('groq_active_chat_id');
            createNewChat();
            renderSidebar();
        }
    });

    // Change API Key Button
    changeKeyBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('hidden');
        appContainer.classList.add('hidden');
    });

    // Model Change Selector
    modelSelect.addEventListener('change', () => {
        const selectedModelText = modelSelect.options[modelSelect.selectedIndex].text;
        currentModelName.textContent = selectedModelText;
    });

    // Suggestion Cards clicks
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const promptText = card.getAttribute('data-prompt');
            userInput.value = promptText;
            userInput.style.height = 'auto';
            userInput.style.height = userInput.scrollHeight + 'px';
            sendBtn.removeAttribute('disabled');
            userInput.focus();
        });
    });

    // User Textarea Inputs
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';

        if (userInput.value.trim().length > 0) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
}

// Save Key and Authenticate
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        alert('Please enter a valid Groq API Key.');
        return;
    }
    apiKey = key;
    localStorage.setItem('groq_api_key', apiKey);
    initApp();
}

// Toggle Theme Modes
function toggleTheme() {
    if (document.body.classList.contains('light-theme')) {
        currentTheme = 'dark';
    } else {
        currentTheme = 'light';
    }
    localStorage.setItem('groq_theme', currentTheme);
    initTheme();
}

// Spawning and Switching Chats
function createNewChat() {
    const newChat = {
        id: 'chat_' + Date.now(),
        title: 'New Chat',
        messages: []
    };
    chats.unshift(newChat);
    activeChatId = newChat.id;
    saveChats();
    loadChat(activeChatId);
    renderSidebar();
}

function loadChat(chatId) {
    activeChatId = chatId;
    localStorage.setItem('groq_active_chat_id', activeChatId);

    const activeChat = chats.find(c => c.id === chatId);
    if (!activeChat) return;

    // Reset current active class
    const items = chatHistory.querySelectorAll('.history-item');
    items.forEach(item => {
        if (item.getAttribute('data-id') === chatId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    messagesDiv.innerHTML = '';

    if (activeChat.messages.length === 0) {
        welcomeScreen.classList.remove('hidden');
        messagesDiv.parentElement.classList.add('welcome-bg');
    } else {
        welcomeScreen.classList.add('hidden');
        messagesDiv.parentElement.classList.remove('welcome-bg');
        
        activeChat.messages.forEach(msg => {
            appendMessageHTML(msg.role, msg.content);
        });
        scrollToBottom();
    }
}

function saveChats() {
    localStorage.setItem('groq_chats', JSON.stringify(chats));
    localStorage.setItem('groq_active_chat_id', activeChatId);
}

function renderSidebar() {
    chatHistory.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === activeChatId ? 'active' : ''}`;
        item.setAttribute('data-id', chat.id);
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = chat.title;
        titleSpan.style.overflow = 'hidden';
        titleSpan.style.textOverflow = 'ellipsis';
        titleSpan.style.whiteSpace = 'nowrap';
        titleSpan.style.marginRight = '8px';
        titleSpan.style.flex = '1';
        item.appendChild(titleSpan);

        // Delete button for this chat
        const delBtn = document.createElement('span');
        delBtn.innerHTML = '✕';
        delBtn.style.cursor = 'pointer';
        delBtn.style.opacity = '0.5';
        delBtn.style.fontSize = '0.8rem';
        delBtn.style.padding = '2px 6px';
        delBtn.style.borderRadius = '4px';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        item.appendChild(delBtn);

        item.addEventListener('click', () => loadChat(chat.id));
        chatHistory.appendChild(item);
    });
}

function deleteChat(chatId) {
    chats = chats.filter(c => c.id !== chatId);
    if (activeChatId === chatId) {
        activeChatId = chats.length > 0 ? chats[0].id : '';
    }
    saveChats();
    initApp();
}

// Message Sending and API Integration
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Reset Input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.setAttribute('disabled', 'true');

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    // Hide suggestions
    welcomeScreen.classList.add('hidden');

    // Save user message
    activeChat.messages.push({ role: 'user', content: text });
    appendMessageHTML('user', text);
    scrollToBottom();

    // Auto update chat title if it's the first message
    if (activeChat.title === 'New Chat') {
        activeChat.title = text.length > 25 ? text.substring(0, 25) + '...' : text;
        renderSidebar();
    }

    saveChats();

    // Prepare typing placeholder
    const loaderId = 'loader_' + Date.now();
    appendLoaderHTML(loaderId);
    scrollToBottom();

    try {
        const selectedModel = modelSelect.value;
        const apiMessages = activeChat.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: apiMessages,
                temperature: 0.7,
                max_tokens: 1524
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;

        // Remove Loader and append AI Message
        removeLoaderHTML(loaderId);
        activeChat.messages.push({ role: 'assistant', content: aiMessage });
        appendMessageHTML('assistant', aiMessage);
        saveChats();
        scrollToBottom();

    } catch (error) {
        console.error('API Error:', error);
        removeLoaderHTML(loaderId);
        appendMessageHTML('assistant', `⚠️ **Error connecting to Groq:** ${error.message}\n\nPlease check that your API key is correct and you have an active internet connection.`);
        scrollToBottom();
    }
}

// DOM Rendering Utilities
function appendMessageHTML(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user' : 'ai'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMarkdown(text);

    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
}

function appendLoaderHTML(id) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.id = id;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `
        <div class="loader-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
}

function removeLoaderHTML(id) {
    const loader = document.getElementById(id);
    if (loader) loader.remove();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Markdown Formatter (Lightweight)
function formatMarkdown(text) {
    // Escape HTML to prevent XSS
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 1. Code blocks (```language ... ```)
    escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // 2. Inline Code (`code`)
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Bold (**text**)
    escaped = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');

    // 4. Italic (*text*)
    escaped = escaped.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');

    // 5. Line breaks
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}
