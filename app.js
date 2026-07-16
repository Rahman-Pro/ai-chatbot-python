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
        
        activeChat.messages.forEach((msg, idx) => {
            if (msg.role === 'tool') {
                return;
            }
            if (msg.tool_calls) {
                const thoughtId = 'thought_hist_' + idx;
                appendThoughtBox(thoughtId);
                let logHTML = '';
                
                msg.tool_calls.forEach(toolCall => {
                    const funcName = toolCall.function.name;
                    const funcArgs = toolCall.function.arguments;
                    
                    logHTML += `<div class="tool-call-log">⚙️ <strong>Running Tool:</strong> <code>${funcName}</code></div>`;
                    logHTML += `<div class="tool-call-log">💬 <strong>Args:</strong> <code>${funcArgs}</code></div>`;
                    
                    const toolResp = activeChat.messages.find((m, i) => i > idx && m.role === 'tool' && m.tool_call_id === toolCall.id);
                    if (toolResp) {
                        const trimmedOut = toolResp.content.length > 150 ? toolResp.content.substring(0, 150) + '...' : toolResp.content;
                        logHTML += `<div class="tool-call-log">✅ <strong>Output:</strong> ${escapedHTML(trimmedOut)}</div>`;
                    }
                });
                
                updateThoughtLogs(thoughtId, logHTML);
                const detailsEl = document.querySelector(`#${thoughtId} details`);
                if (detailsEl) detailsEl.removeAttribute('open');
                return;
            }
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

// --- Agent Tools and Functions ---

const agentTools = [
    {
        type: "function",
        function: {
            name: "get_current_time",
            description: "Get the current system/local date and time.",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "calculate",
            description: "Evaluate basic mathematical expressions. Supporting standard operators: +, -, *, /, (, ).",
            parameters: {
                type: "object",
                properties: {
                    expression: {
                        type: "string",
                        description: "The math equation to compute, e.g., '12 * (3.5 + 4)'"
                    }
                },
                required: ["expression"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_wikipedia",
            description: "Search Wikipedia for general information on concepts, historical events, famous people, or topics.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search term to query Wikipedia for."
                    }
                },
                required: ["query"]
            }
        }
    }
];

function getCurrentTime() {
    return "Current local time: " + new Date().toLocaleString();
}

function calculateExpression(expression) {
    try {
        const clean = expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = Function('"use strict"; return (' + clean + ')')();
        return `Calculation Result for '${expression}': ${result}`;
    } catch (e) {
        return `Error evaluating calculation: ${e.message}`;
    }
}

async function searchWikipedia(query) {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        const results = data.query?.search;
        if (!results || results.length === 0) {
            return `No Wikipedia results found for '${query}'.`;
        }
        const topTitle = results[0].title;
        const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(topTitle)}&format=json&origin=*`;
        const summaryRes = await fetch(summaryUrl);
        const summaryData = await summaryRes.json();
        const pages = summaryData.query?.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1") {
            return `Found Wikipedia article '${topTitle}', but failed to retrieve its summary content.`;
        }
        return `Source: Wikipedia - Article: ${topTitle}\n\nSummary:\n${pages[pageId].extract}`;
    } catch (e) {
        return `Error retrieving Wikipedia summary: ${e.message}`;
    }
}

// --- DOM Rendering Helpers for Thoughts ---

function appendThoughtBox(id) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai agent-thought-message';
    messageDiv.id = id;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <details class="agent-thought-container" open>
                <summary class="agent-thought-title">
                    <span>🤖 Agent Thought Process</span>
                </summary>
                <div class="agent-thought-details" id="${id}_logs">
                    <div class="tool-call-log">Thinking...</div>
                </div>
            </details>
        </div>
    `;
    messagesDiv.appendChild(messageDiv);
}

function updateThoughtLogs(id, logHTML) {
    const logsDiv = document.getElementById(`${id}_logs`);
    if (logsDiv) {
        logsDiv.innerHTML = logHTML;
    }
}

function removeThoughtBox(id) {
    const box = document.getElementById(id);
    if (box) box.remove();
}

function escapedHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
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
        let loopCnt = 0;
        const maxLoops = 5;
        let finalResponseText = '';
        let toolCallsMade = false;
        let thoughtId = 'thought_' + Date.now();
        let logHTML = '';

        // Continue calling API while LLM requests tool execution
        while (loopCnt < maxLoops) {
            loopCnt++;
            
            // Format conversation history for API request
            const apiMessages = activeChat.messages.map(m => {
                if (m.tool_calls) {
                    return {
                        role: m.role,
                        content: m.content || null,
                        tool_calls: m.tool_calls
                    };
                }
                if (m.role === 'tool') {
                    return {
                        role: m.role,
                        tool_call_id: m.tool_call_id,
                        name: m.name,
                        content: m.content
                    };
                }
                return {
                    role: m.role,
                    content: m.content
                };
            });

            // Add system prompt context at the start
            apiMessages.unshift({
                role: 'system',
                content: `You are an advanced AI agent chatbot powered by Groq.
You have access to tools that can check local time, perform math calculations, and lookup Wikipedia articles.
Use tools when requested or when answering a query requires information that you do not know. 
Keep your replies structured, informative, and friendly. Explain briefly what tools you used if you called any.`
            });

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: apiMessages,
                    tools: agentTools,
                    tool_choice: "auto",
                    temperature: 0.5,
                    max_tokens: 1524
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const responseMessage = data.choices[0].message;
            const toolCalls = responseMessage.tool_calls;

            if (toolCalls && toolCalls.length > 0) {
                // If it is the first tool call of this message, remove loader and append thought box
                if (!toolCallsMade) {
                    removeLoaderHTML(loaderId);
                    appendThoughtBox(thoughtId);
                    toolCallsMade = true;
                }

                // Add tool calls to history
                activeChat.messages.push({
                    role: 'assistant',
                    content: responseMessage.content || '',
                    tool_calls: toolCalls
                });

                for (let toolCall of toolCalls) {
                    const funcName = toolCall.function.name;
                    const funcArgs = JSON.parse(toolCall.function.arguments);
                    
                    logHTML += `<div class="tool-call-log">⚙️ <strong>Running Tool:</strong> <code>${funcName}</code></div>`;
                    logHTML += `<div class="tool-call-log">💬 <strong>Args:</strong> <code>${JSON.stringify(funcArgs)}</code></div>`;
                    updateThoughtLogs(thoughtId, logHTML + `<div class="tool-call-log">🤔 Executing...</div>`);
                    scrollToBottom();

                    let toolOut = '';
                    if (funcName === 'get_current_time') {
                        toolOut = getCurrentTime();
                    } else if (funcName === 'calculate') {
                        toolOut = calculateExpression(funcArgs.expression);
                    } else if (funcName === 'search_wikipedia') {
                        toolOut = await searchWikipedia(funcArgs.query);
                    } else {
                        toolOut = `Error: Tool '${funcName}' not found.`;
                    }

                    const trimmedOut = toolOut.length > 150 ? toolOut.substring(0, 150) + '...' : toolOut;
                    logHTML += `<div class="tool-call-log">✅ <strong>Output:</strong> ${escapedHTML(trimmedOut)}</div>`;
                    updateThoughtLogs(thoughtId, logHTML);
                    scrollToBottom();

                    // Push tool result message
                    activeChat.messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: funcName,
                        content: toolOut
                    });
                }
                
                saveChats();
                
                // Show a mini loader at the bottom during the next reasoning step
                appendLoaderHTML(loaderId);
                scrollToBottom();
            } else {
                // Final text response reached
                finalResponseText = responseMessage.content || '';
                break;
            }
        }

        // Clean up and display final response
        removeLoaderHTML(loaderId);
        
        // Collapse the thought box details after completion
        if (toolCallsMade) {
            const detailsEl = document.querySelector(`#${thoughtId} details`);
            if (detailsEl) detailsEl.removeAttribute('open');
        }

        if (finalResponseText) {
            activeChat.messages.push({ role: 'assistant', content: finalResponseText });
            appendMessageHTML('assistant', finalResponseText);
            saveChats();
            scrollToBottom();
        } else if (!toolCallsMade) {
            throw new Error("No response content generated by the AI model.");
        }

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
