# 🤖 Human-in-the-Loop AI Assistant for WhatsApp

A production-ready Client Relationship Management (CRM) system that integrates Local LLMs with WhatsApp to provide AI-assisted customer support. Features a robust "Human-in-the-Loop" (HITL) workflow, allowing human operators to review, edit, and approve AI-generated suggestions before they are sent.

![Dashboard Preview](./docs/dashboard-preview.png)

## ✨ Key Features

### 🧠 AI & Automation
- **Local LLM Integration**: Powered by LM Studio (compatible with OpenAI API).
- **Context Awareness**: Remembers conversation history and client details.
- **Intent Recognition**: Analyzes user messages to determine intent (e.g., "Support", "Sales", "Greeting").
- **Confidence Scoring**: Assigns a confidence score to every AI suggestion.

### 🛡️ Human-in-the-Loop (HITL)
- **Review Queue**: AI suggestions appear as "Pending" requiring human approval.
- **Instant Actions**: One-click **Approve**, **Edit**, or **Reject** suggestions.
- **Live Metadata**: View AI reasoning, intent, and confidence scores in real-time.
- **Optimistic UI**: Instant feedback on actions for a smooth user experience.

### 💬 Conversation Management
- **Real-time Chat**: WebSocket-powered live chat interface.
- **Pin & Archive**: Pin important chats to the top or archive old ones to keep the view clean.
- **Multi-Client Simulation**: Built-in tools to simulate incoming messages from different clients.
- **Context Menus**: Right-click actions for quick management (Copy, Delete, Pin, Archive).

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Fully responsive theme support.
- **Glassmorphism Design**: Sleek, modern aesthetic using Tailwind CSS v4.
- **Fluid Animations**: Smooth transitions for a premium feel.

## 🛠️ Technology Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4
- **AI Engine**: LM Studio (Local LLM), OpenAI Python Client
- **Real-time**: WebSockets, `lucide-react` icons, `react-contexify`

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- [LM Studio](https://lmstudio.ai/) (running a local server on port 1234)

### 1. Backend Setup
```bash
cd server
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Server will start at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Frontend will start at `http://localhost:5173`.

### 3. Local LLM Setup
1. Open LM Studio.
2. Load a model (e.g., `Mistral-7B` or `Llama-3`).
3. Start the **Local Server** on port `1234`.

## 📜 License
MIT
