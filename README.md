# NetGuard AI Config Review Platform

An enterprise-grade DevSecOps auditing system that compares network configuration differences, parses security exposures, issues compliance verdicts using Google Gemini models, and streamlines reviewer approval workflows.

## Core Capabilities
- **Line-by-Line Differentials**: Computes strict Largest Common Subsequence (LCS) matrix edits for Router/Firewall configurations.
- **Cognitive Security Agent**: Employs Google Gemini models to detect wide exposures (`permit ip any any`), unencrypted transport protocols (`telnet`), default route takeovers, and weak password configurations.
- **Deterministic Risk Scoring**: Generates quantitative risk numbers based on standardized network threat modifiers.
- **Review Workflow Hub**: Maintains persistent audit logs, change request assignments, status controls, and reviewer checksheets.
- **Compliance Export**: High-fidelity automated Markdown compliance report downloads.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Frame Motion.
- **Backend**: Node.js, Express, tsx Server.
- **AI Core**: Google GenAI SDK (with model fallback mechanisms).
- **Database**: Simulated Local JSON File Database (`data/reviews.json`).

## Architecture
```
+-----------------------------------------------------------+
|                     React Client UI                       |
|   (Dashboard, History, Settings, Interactive Checklists)  |
+---------------------------------------------+-------------+
                                              | (HTTP API)
                                              v
+-----------------------------------------------------------+
|                     Express Backend                       |
|   (LCS Engine, JSON File DB, AI Prompt Synthesizer)       |
+---------------------------------------------+-------------+
                                              | (Server-side SDK)
                                              v
+-----------------------------------------------------------+
|                     Google Gemini API                     |
|          ('gemini-3.5-flash' LLM Evaluation)              |
+-----------------------------------------------------------+
```

## Running the Application
### 1. Configure the API Key
Declare the standard environment variable in your secret panel:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Live Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.
