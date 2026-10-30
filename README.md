# Bob — Oil & Gas Procurement Advisor (Gemini AI Chatbot)

## Executive Summary

**Bob — Oil & Gas Procurement Advisor** is a specialized, full-stack conversational AI web application built with **Node.js**, **Express**, and **Vanilla JavaScript**, powered by the **Google Gemini API** (`@google/genai` SDK using `gemini-3.5-flash`).

The application emulates **"Bob"**, a seasoned Oil & Gas Procurement Advisor with 100 years of domain experience across upstream, midstream, and downstream operations (onshore, offshore/subsea, and subsurface). Bob assists procurement professionals and industry stakeholders with vendor discovery, category strategy, market trend analysis, and pricing/cost estimation guidance using industry benchmarks such as **S&P Global** and **Rystad Energy**.

The project features a zero-framework, dark industrial-themed frontend with a custom XSS-safe Markdown renderer, multi-turn conversation state management, and strict domain guardrails enforced via system instructions.

---

## Table of Contents

1. [Key Features](#key-features)
2. [System Architecture & Data Flow](#system-architecture--data-flow)
3. [AI Persona, Guardrails & Conversation Rules](#ai-persona-guardrails--conversation-rules)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Environment Variables](#environment-variables)
9. [Running the Application](#running-the-application)
10. [API Reference](#api-reference)
11. [Frontend Architecture & Markdown Rendering](#frontend-architecture--markdown-rendering)
12. [Troubleshooting](#troubleshooting)
13. [License](#license)

---

## Key Features

- **Domain-Specific AI Advisor ("Bob")**: Tailored specifically for Oil & Gas goods and services procurement, category strategy, vendor sourcing, and cost indexing.
- **Multi-Turn Contextual Memory**: Maintains the full session conversation history (`user` and `model` turns) on the client and passes it to the Gemini API on each request for coherent multi-turn dialogue.
- **Structured Consultative Workflow**: Rather than giving generic one-shot answers, Bob validates the inquiry, asks up to 5 targeted clarifying questions once per session, categorizes the procurement subtopic, and references relevant industry databases (e.g., S&P, Rystad).
- **Strict Topic Guardrails & Anti-Hallucination Controls**: Politely refuses non-Oil & Gas topics, avoids fabricating external links, explicitly states confidence levels, and enforces a 10-turn session cap.
- **Zero-Framework Industrial UI/UX**: Custom dark-slate and amber Oil & Gas aesthetic with animated "Thinking..." indicators, responsive Flexbox chat layout, and form state locking during in-flight requests.
- **Built-in Safe Markdown Parser**: Lightweight Vanilla JS Markdown-to-HTML parser (`renderMarkdown`) that escapes raw HTML to prevent XSS while rendering headings, lists, blockquotes, code blocks, and inline formatting.

---

## System Architecture & Data Flow

```text
+-----------------------------------------------------------------------+
|                        Browser (Vanilla JS UI)                        |
|  - Captures user input & appends message bubble                       |
|  - Pushes { role: "user", text } to local `conversation` array        |
|  - Renders animated "Thinking..." indicator                           |
|  - Sends POST /api/chat with full `{ conversation }` history          |
|  - Parses Markdown response via `renderMarkdown()` & updates DOM      |
+-----------------------------------+-----------------------------------+
                                    |
                                    | HTTP POST /api/chat (JSON)
                                    v
+-----------------------------------------------------------------------+
|                     Backend (Node.js + Express 5)                     |
|  - Validates `conversation` array payload                             |
|  - Maps items to Gemini format: `{ role, parts: [{ text }] }`         |
|  - Attaches Bob's O&G Procurement `systemInstruction`                 |
+-----------------------------------+-----------------------------------+
                                    |
                                    | @google/genai SDK
                                    v
+-----------------------------------------------------------------------+
|                  Google Gemini API (gemini-3.5-flash)                 |
|  - Evaluates guardrails, turn limits, and conversation context        |
|  - Generates Markdown-formatted advisory response                     |
+-----------------------------------------------------------------------+
```

---

## AI Persona, Guardrails & Conversation Rules

Configured in `index.js` via `config.systemInstruction`, Bob operates under the following behavioral rules:

1. **Identity & Caveats**:
   - Introduces himself as **Bob**, a master procurement advisor for Oil & Gas goods and services with 100 years of experience (under the sun, under the sea, and underground).
   - Disclaims that all responses are advisory only, prone to errors, and that he assumes no responsibility for business decisions made from the chat.
2. **Strict Domain Guardrail**:
   - Responds exclusively to Oil & Gas inquiries.
   - Politely and authoritatively refuses any off-topic discussions.
3. **One-Time Clarifying Phase**:
   - Upon receiving a valid initial inquiry, Bob asks **no more than 5 clarifying questions** before delivering a final recommendation (instructing the user to answer as much as possible). This step occurs only once per session.
4. **Topic Categorization & Industry Indexing**:
   - Internally categorizes the user's inquiry into a topic and subtopic.
   - When addressing **Procurement -> Category Strategy** or **Market Trends**, Bob incorporates relevant price indexes or databases from **S&P** or **Rystad Energy**.
5. **Hallucination & Confidence Policy**:
   - Explicitly states when confidence is low and explains the reason for doubt.
   - Refuses to provide external URLs/links to prevent link hallucination.
6. **Session Turn Limit (10 Turns)**:
   - Ends the conversation after **10 turns**, instructing the user to close the window or restart a new conversation.
   - If prompted further after the session limit is reached, responds strictly with the exact 6 words: `close window or start new conversation`.

---

## Tech Stack

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules enabled via `"type": "module"`)
- **Web Framework**: [Express](https://expressjs.com/) `^5.3.0`
- **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai) `^2.32.0` (Model: `gemini-3.5-flash`)
- **Middleware & Config**:
  - `cors` `^2.8.6` for Cross-Origin Resource Sharing
  - `dotenv` `^18.0.9` for environment variable management

### Frontend
- **Markup**: Semantic HTML5 (`Public/index.html`)
- **Styling**: Custom CSS3 with CSS Variables, Flexbox, keyframe animations, and responsive media queries (`Public/style.css`)
- **Logic**: Vanilla ES6+ JavaScript (`Public/script.js`) using `fetch` API and custom DOM/Markdown utilities

---

## Project Structure

```text
gemini-chatbot-api/
├── Public/
│   ├── index.html       # Main chat interface & advisor header/banner
│   ├── style.css        # Industrial O&G dark theme, layout & Markdown styles
│   └── script.js        # Chat state, Fetch API integration & Markdown parser
├── index.js             # Express server, static hosting & POST /api/chat route
├── package.json         # Project metadata and dependencies
├── .env                 # Environment variables (GEMINI_API_KEY, PORT) - gitignored
├── .gitignore           # Ignored files (node_modules, .env, package-lock.json)
└── README.md            # Project documentation
```

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: `v18.0.0` or higher recommended (supports native ES modules and modern JS features)
- **npm**: Included with Node.js
- **Google Gemini API Key**: Obtain an API key from [Google AI Studio](https://aistudio.google.com/)

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/gemini-chatbot-api.git
   cd gemini-chatbot-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create the `.env` file**:
   Create a `.env` file in the root directory of the project:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   PORT=3000
   ```

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | — | Your Google Gemini API key used by `@google/genai`. |
| `PORT` | No | `3000` | The local port on which the Express server listens. |

---

## Running the Application

1. **Start the Express server**:
   ```bash
   node index.js
   ```

2. **Verify the server is running**:
   The terminal will output:
   ```text
   Server ready on http://localhost:3000
   ```

3. **Open the Web App**:
   Navigate to `http://localhost:3000` in your web browser.

---

## API Reference

### `POST /api/chat`

Generates a contextual AI response from Bob based on the conversation history provided.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
The endpoint expects a JSON object containing a `conversation` array. Each element must include a `role` (`"user"` or `"model"`) and `text` (`string`).

```json
{
  "conversation": [
    {
      "role": "user",
      "text": "We need to source subsea Christmas trees for an offshore deepwater project in West Africa. How should we structure our category strategy?"
    },
    {
      "role": "model",
      "text": "Hello! I am Bob, your Oil & Gas procurement advisor..."
    },
    {
      "role": "user",
      "text": "Water depth is 1,500m, 8 wells, target FID in Q4 next year."
    }
  ]
}
```

#### Success Response (`200 OK`)
```json
{
  "result": "Thank you for the details. For 1,500m deepwater subsea trees in West Africa..."
}
```

#### Error Response (`500 Internal Server Error`)
Returned if `conversation` is not an array, if the Gemini API request fails, or if the API key is invalid/missing.
```json
{
  "error": "Message must be an array"
}
```

---

## Frontend Architecture & Markdown Rendering

The frontend (`Public/script.js`) is purposefully written in clean **Vanilla JavaScript** with zero external runtime dependencies:

1. **Conversation State (`conversation` array)**:
   - Stores every turn as `{ role: 'user' | 'model', text: string }` in memory so that follow-up responses retain full session context.
2. **Asynchronous Submission Lifecycle**:
   - Prevents default form reload.
   - Appends the user's message bubble immediately.
   - Disables the text input and submit button (`setFormDisabled(true)`) to prevent duplicate submissions while waiting.
   - Appends a temporary bot message bubble with a three-dot pulsing animation (`Thinking...`).
   - Sends the `POST /api/chat` request and replaces the thinking indicator with the rendered Markdown response.
   - Gracefully handles empty results (`"Sorry, no response received."`) and network/server errors (`"Failed to get response from server."`) with visual error styling.
3. **XSS-Safe Markdown Parser (`renderMarkdown`)**:
   - **Step 1 (`escapeHtml`)**: Escapes `&`, `<`, `>`, `"`, and `'` before any formatting tags are introduced, preventing arbitrary HTML/script injection.
   - **Step 2 (Block Parsing)**: Extracts fenced code blocks (` ``` `), headings (`#` to `####`), blockquotes (`>`), unordered lists (`-`, `*`, `•`), ordered lists (`1.`), horizontal rules (`---`), and paragraphs.
   - **Step 3 (`formatInline`)**: Converts inline code (`` `code` ``), bold (`**text**`), italic (`*text*`), and bold-italic (`***text***`) into semantic HTML elements styled by `Public/style.css`.

---

## Troubleshooting

- **`Failed to get response from server.` in the chat box**:
  - Verify the Node.js server is running (`node index.js`).
  - Check your terminal console for error details.
  - Ensure `.env` exists in the project root and contains a valid `GEMINI_API_KEY`.
- **`Error: Message must be an array` (`500`)**:
  - Ensure custom API clients (like Postman or cURL) send `{ "conversation": [ ... ] }` with `Content-Type: application/json`.
- **Port `3000` already in use (`EADDRINUSE`)**:
  - Change the `PORT` value in `.env` (e.g., `PORT=3001`) and restart the server.

---

## License

This project is licensed under the **ISC License**.

