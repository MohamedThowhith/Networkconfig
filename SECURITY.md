# Security Policy

This document details the security posture and defensive design of the NetGuard AI Config Review Platform.

## 1. Credentials Isolation
- **No Client Exposure**: The `GEMINI_API_KEY` is retrieved strictly server-side `process.env.GEMINI_API_KEY`. It is never loaded on or transmitted to the client browser. No UI input fields or client-side storage keys are permitted to host administrative credentials.
- **Environment Isolation**: Default standard `.env.example` handles public template documentation. Real keys must be passed container-side via environment settings.

## 2. Input Sanitization & Threat Prevention
- **Payload Restrictions**: The Express pipeline utilizes explicit JSON parser limits (`limit: "10mb"`) to defend the system processes against Buffer Overflows or CPU starvation attacks from maliciously crafted configs.
- **Escape Checks**: To prevent HTML Injection or Cross-Site Scripting (XSS) within compiled Markdown reports, config strings are bound safely within literal code blocks (` ``` `).

## 3. Data Storage & Local Sandbox
- **Simulated Database**: `data/reviews.json` acts as our high-performance relational simulation folder.
- **De-escalated Privileges**: Production systems must swap this file store for authenticated Firestore structures or encrypted PostgreSQL containers (Cloud SQL).

## 4. NIST Policy Guidelines Compliance
All configuration difference reviews test against common misconfiguration patterns:
- Insecure Transport Terminals (transport input parameters referencing `telnet` are flagged immediately).
- Broad Subnets in Outbound Filters (rules matching `permit ip any any` increase the risk rating by `+35` points).
- Unencrypted administration protocols or weak credentials presets.
