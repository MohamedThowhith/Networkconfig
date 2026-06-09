# Architecture Blueprint

## System Overview
NetGuard AI is configured as a full-stack Node.js / Express application hosting React 19 web assets.

## The Cognitive Agent Lifecycle
When a user submits a configuration review request, the task passes through an encapsulated multi-agent sequence on our Express server:

```
[User Submit Request]
       |
       v
+-----------------------------+
| 1. Input Validation Agent   | -> Checks size constraints & file headers
+-----------------------------+
       |
       v
+-----------------------------+
| 2. Diff Generation Agent    | -> Runs LCS algorithms, compiles (+/-) edits
+-----------------------------+
       |
       v
+-----------------------------+
| 3. Change Classify Agent    | -> Sorts commands (ACL, Route, Peer, Interface)
+-----------------------------+
       |
       v
+-----------------------------+
| 4. Policy Check Agent       | -> Evaluates 10 policy findings with score offsets
+-----------------------------+
       |
       v
+-----------------------------+
| 5. Cognitive Review Agent   | -> Connects with Gemini to formulate summaries
+-----------------------------+
       |
       v
+-----------------------------+
| 6. Audit & Storage Agent    | -> Logs audit trails, appends data/reviews.json
+-----------------------------+
       |
       v
[UI Render Outcomes]
```

## Policy Threat Score Offsets
To provide consistent, objective risk parameters, our deterministic parser scans the modified configuration variables and increments the score based on strict criteria:

| Trigger Pattern | Score Offset | Severe Rating Impact |
| :--- | :--- | :--- |
| `permit ip any any` | `+35` | High Outbound exposure |
| `telnet enabled` | `+25` | Cleartext admin transmission |
| weak standard passwords | `+20` | Brute force risk |
| default route change | `+20` | Dynamic path hijack |
| wide management subnet | `+30` | Core port scanning risk |
| ACL removed | `+20` | Network partition drop |
| dynamic routing protocol modified | `+20` | Convergence looping |
| system auditing/logging disabled | `+15` | Compliance failure |

Risk classification mapping scale:
- **Low**: `0 - 34`
- **Medium**: `35 - 64`
- **High**: `65 - 84`
- **Critical**: `85 - 100`
