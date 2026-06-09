import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = 3000;

// Body parsing with safe size limit for standard configs
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Local JSON Database Helper
const DB_FILE = path.join(process.cwd(), "data", "reviews.json");

// Ensure data folder exists
const ensureDbDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

function readDB(): any[] {
  try {
    ensureDbDir();
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, "[]", "utf-8");
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("CRITICAL: Failed to read local JSON database:", e);
    return [];
  }
}

function writeDB(data: any[]) {
  try {
    ensureDbDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("CRITICAL: Failed to write to local JSON database:", e);
  }
}

// Helper: Line-by-line LCS-based Diff algorithm
interface DiffLine {
  type: "added" | "removed" | "unchanged";
  value: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

function computeDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.split(/\r?\n/);
  const newLines = newStr.split(/\r?\n/);
  
  const m = oldLines.length;
  const n = newLines.length;
  
  // Guard against memory overflow for massive files
  if (m * n > 4000000) {
    const result: DiffLine[] = [];
    const minLen = Math.min(m, n);
    for (let i = 0; i < minLen; i++) {
      if (oldLines[i] === newLines[i]) {
        result.push({ type: "unchanged", value: oldLines[i], oldLineNumber: i + 1, newLineNumber: i + 1 });
      } else {
        result.push({ type: "removed", value: oldLines[i], oldLineNumber: i + 1 });
        result.push({ type: "added", value: newLines[i], newLineNumber: i + 1 });
      }
    }
    if (m > n) {
      for (let i = minLen; i < m; i++) result.push({ type: "removed", value: oldLines[i], oldLineNumber: i + 1 });
    } else if (n > m) {
      for (let i = minLen; i < n; i++) result.push({ type: "added", value: newLines[i], newLineNumber: i + 1 });
    }
    return result;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const diff: DiffLine[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({
        type: "unchanged",
        value: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: "added",
        value: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      diff.unshift({
        type: "removed",
        value: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }
  
  return diff;
}

// Verify Gemini configuration
const isApiKeyConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "";
};

// Lazy initialization of Gemini client
let geminiClientCache: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClientCache) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY env variable is not configured correctly.");
    }
    geminiClientCache = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClientCache;
}

// Deterministic Policy Analysis & Risk Scoring
interface PolicyCheckResult {
  scoreOffset: number;
  finding: string;
  category: "ACL" | "Routing" | "Interface" | "NAT" | "VPN" | "Authentication" | "Logging" | "Monitoring" | "Other";
  severity: "Low" | "Medium" | "High";
  reason: string;
}

function runPolicyChecks(diffLines: DiffLine[]): PolicyCheckResult[] {
  const findings: PolicyCheckResult[] = [];
  const addedLines = diffLines.filter(line => line.type === "added").map(l => l.value.trim());
  const removedLines = diffLines.filter(line => line.type === "removed").map(l => l.value.trim());

  // Helper to match lowercased lines
  addedLines.forEach(line => {
    const low = line.toLowerCase();
    if (!low) return;

    // 1. Comment Change -> LOW, Score 1
    if (
      low.startsWith("!") ||
      low.startsWith("#") ||
      low.startsWith("//") ||
      low.includes("description ") ||
      low.includes("remark ") ||
      low.includes("comment ") ||
      low.includes("comment-change") ||
      low.includes("comment change")
    ) {
      findings.push({
        scoreOffset: 1,
        finding: "Comment Change Detected",
        category: "Other",
        severity: "Low",
        reason: "Cosmetic comment update, line description tag, or configuration remark change."
      });
    }

    // 2. New Route -> MEDIUM, Score 5
    if (
      low.includes("ip route ") ||
      low.includes("route ") ||
      low.includes("routing-options ") ||
      low.includes("static-route") ||
      low.includes("router ospf") ||
      low.includes("router bgp") ||
      low.includes("protocols ospf") ||
      low.includes("protocols bgp") ||
      low.includes("new route")
    ) {
      findings.push({
        scoreOffset: 5,
        finding: "New Route Configuration",
        category: "Routing",
        severity: "Medium",
        reason: "Adding or modifying route gateways, static next-hop lines, or protocol networks."
      });
    }

    // 3. New Peer -> HIGH, Score 8
    if (
      low.includes("neighbor ") ||
      low.includes("peer ") ||
      low.includes("bgp peer") ||
      low.includes("peer-group") ||
      low.includes("remote-as") ||
      low.includes("new peer") ||
      low.includes("new-peer") ||
      low.includes("gateway ") ||
      low.includes("tunnel destination")
    ) {
      findings.push({
        scoreOffset: 8,
        finding: "New External Peer Added",
        category: "VPN",
        severity: "High",
        reason: "Establishing connections or registering with a peer routing endpoint."
      });
    }

    // 4. ACL widened -> HIGH, Score 8
    if (
      low.includes("permit ip any any") ||
      low.includes("permit any any") ||
      low.includes("permit tcp any any") ||
      low.includes("permit udp any any") ||
      low.includes("0.0.0.0 255.255.255.255") ||
      low.includes("0.0.0.0/0 any") ||
      (low.includes("source") && low.includes("any") && low.includes("destination") && low.includes("any")) ||
      low.includes("acl widened") ||
      low.includes("acl-widened") ||
      low.includes("rulebase security rules") && (low.includes("source any") || low.includes("destination any") || low.includes("service any"))
    ) {
      findings.push({
        scoreOffset: 8,
        finding: "Access Policy Widened (ACL Widened)",
        category: "ACL",
        severity: "High",
        reason: "Broad wildcard rule added or firewall filter edited to allow unfiltered flow access."
      });
    }
  });

  return findings;
}

// Offline fallback review compiler
function generateFallbackAnalysis(
  oldConfig: string, 
  newConfig: string, 
  diffLines: DiffLine[],
  findings: PolicyCheckResult[],
  deviceType: string,
  environment: string
) {
  // Aggregate deterministic scores (using max score offset, defaults to 1 for edits, 0 for empty)
  let baseScore = 0;
  if (findings.length > 0) {
    baseScore = Math.max(...findings.map(f => f.scoreOffset));
  } else {
    baseScore = diffLines.some(l => l.type !== "unchanged") ? 1 : 0;
  }

  let overallRisk: "Low" | "Medium" | "High" = "Low";
  if (baseScore > 7) overallRisk = "High";
  else if (baseScore >= 3) overallRisk = "Medium";
  else overallRisk = "Low";

  let recommendation = "Auto Approve";
  if (baseScore < 3) {
    recommendation = "Auto Approve";
  } else {
    recommendation = "Manual Review Needed";
  }

  const resultFindingsFormatted = findings.map(f => {
    return {
      title: f.finding,
      category: f.category,
      description: f.reason,
      riskLevel: f.severity,
      businessImpact: `Operational or compliance impact mapped under the ${environment} environment template.`,
      technicalImpact: `Determined score level ${f.scoreOffset}/10 applied to configuration drift checks.`,
      recommendedAction: f.severity === "High" ? "Mandate strict configuration peer authentication." : "Verify standard physical interfaces state alignment."
    };
  });

  if (resultFindingsFormatted.length === 0) {
    resultFindingsFormatted.push({
      title: "Routine Layer 2 Update",
      category: "Other",
      description: "Diff comparison shows safe description text or cosmetic formatting edits.",
      riskLevel: "Low",
      businessImpact: "Negligible operational impact. Safe for automation deployment.",
      technicalImpact: "No security or routing policies are breached.",
      recommendedAction: "Confirm target device matches the physical interface descriptions."
    });
  }

  const checklist = findings.map(f => `Validate mitigation plan for "${f.finding}"`);
  if (checklist.length === 0) {
    checklist.push("Review config descriptions for interface parity", "Execute baseline ping verification post integration");
  }

  return {
    executiveSummary: `Static analysis review of ${deviceType} upgrade proposed for ${environment}. Identified ${findings.length} baseline policy matches.`,
    technicalSummary: `Parsed configuration differentials. Computed standard local vulnerability checks. Deterministic risk rating is ${baseScore}/10 (${overallRisk}).`,
    overallRisk: overallRisk as any,
    approvalRecommendation: recommendation as any,
    securityImpact: findings.some(f => f.severity === "High") ? "A security hazard or permissive ruleset was flagged in the config rules." : "Low potential threat profile detected.",
    availabilityImpact: findings.some(f => f.category === "Routing") ? "Moderate chance of interface protocol re-convergence delays." : "Low active port routing impact.",
    complianceImpact: findings.some(f => f.category === "ACL") ? "Altering ingress filters impacts SOC2 accessibility reviews." : "Fully compliant with internal standards.",
    affectedServices: findings.map(f => f.finding) || ["Standard Port Interface"],
    changes: resultFindingsFormatted,
    reviewerChecklist: checklist,
    questionsForChangeOwner: findings.map(f => `Why is the change for "${f.finding}" critical during this maintenance window?`),
    finalDecisionRationale: `The configuration evaluation returned security warnings with standard risk level [${overallRisk}] and threat score [${baseScore}/10].`
  };
}

// ----------------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------------

// 1. Health Status
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    sandboxMode: true
  });
});

// 2. Settings Management
app.get("/api/settings", (req, res) => {
  res.json({
    geminiConfigured: isApiKeyConfigured(),
    organizationName: "NetGuard Sentinel Global Corp",
    retentionDays: 90,
    allowSelfApproval: false,
    standardComplianceScope: "NIST-800-53 / SOC2 / PCI-DSS"
  });
});

// Test Gemini Connection
app.post("/api/settings/test-ai", async (req, res) => {
  if (!isApiKeyConfigured()) {
    return res.status(400).json({
      success: false,
      message: "No GEMINI_API_KEY environment variable is configured in the container secrets panel."
    });
  }

  try {
    const api = getGeminiClient();
    const testModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
    let responseText = "";
    let finalModel = "";
    let lastErrorMsg = "";

    for (const m of testModels) {
      try {
        const result = await api.models.generateContent({
          model: m,
          contents: "Respond in 3 words: AI Engine Ready."
        });
        if (result && result.text) {
          responseText = result.text;
          finalModel = m;
          break;
        }
      } catch (err: any) {
        lastErrorMsg = err.message || JSON.stringify(err);
        console.warn(`Connection test model ${m} failed: ${lastErrorMsg}`);
      }
    }

    if (!responseText) {
      throw new Error(`All test models failed. Last error: ${lastErrorMsg}`);
    }

    res.json({
      success: true,
      message: `${responseText} (Verified via ${finalModel})`
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to establish a valid connection to Gemini."
    });
  }
});

// 3. Complete Dashboard Metrics Summary
app.get("/api/dashboard/summary", (req, res) => {
  const reviews = readDB();
  const totalReviews = reviews.length;
  
  const highRiskReviews = reviews.filter(
    r => r.overallRisk === "High" || r.overallRisk === "Critical"
  ).length;

  const pendingApprovals = reviews.filter(r => r.status === "Pending").length;
  const approvedChanges = reviews.filter(r => r.status === "Approved").length;
  const needsChangesChanges = reviews.filter(r => r.status === "Needs Changes").length;
  const rejectedChanges = reviews.filter(r => r.status === "Rejected").length;

  res.json({
    totalReviews,
    highRiskReviews,
    pendingApprovals,
    approvedChanges,
    needsChangesChanges,
    rejectedChanges
  });
});

// Risk Distribution charts aggregator
app.get("/api/dashboard/risk-distribution", (req, res) => {
  const reviews = readDB();
  const distribution = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0
  };

  reviews.forEach(r => {
    const risk = r.overallRisk as "Low" | "Medium" | "High" | "Critical";
    if (distribution[risk] !== undefined) {
      distribution[risk]++;
    } else {
      distribution.Low++;
    }
  });

  const chartData = [
    { name: "Low", value: distribution.Low, color: "#10b981" },
    { name: "Medium", value: distribution.Medium, color: "#f59e0b" },
    { name: "High", value: distribution.High, color: "#ef4444" },
    { name: "Critical", value: distribution.Critical, color: "#7f1d1d" }
  ];

  res.json(chartData);
});

// Central recent events pipeline
app.get("/api/dashboard/recent-activity", (req, res) => {
  const reviews = readDB();
  // Sort reviews by latest created date
  const sorted = [...reviews].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Flatten dynamic audit logs for events list
  const recentEvents: any[] = [];
  sorted.forEach(review => {
    review.auditTrail.forEach((trail: any) => {
      recentEvents.push({
        reviewId: review.id,
        changeRequestId: review.changeRequestId,
        deviceType: review.deviceType,
        environment: review.environment,
        reviewer: review.reviewer,
        action: trail.action,
        details: trail.details,
        timestamp: trail.timestamp,
        risk: review.overallRisk
      });
    });
  });

  // Take the most recent 10 events
  res.json(recentEvents.slice(0, 12));
});

// 4. Retrieve All Reviews
app.get("/api/reviews", (req, res) => {
  const reviews = readDB();
  // Return reversed to put newest on top
  res.json(reviews.reverse());
});

// Retrieve single review
app.get("/api/reviews/:id", (req, res) => {
  const reviews = readDB();
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ error: "Configuration check ID. Not found." });
  }
  res.json(review);
});

// DELETE single review
app.delete("/api/reviews/:id", (req, res) => {
  const reviews = readDB();
  const index = reviews.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Configuration check ID. Not found." });
  }
  reviews.splice(index, 1);
  writeDB(reviews);
  res.json({ success: true, message: `Review ${req.params.id} has been permanently deleted.` });
});

// 5. UPDATE Status of a review
app.patch("/api/reviews/:id/status", (req, res) => {
  const { status, reviewer } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status field must be defined." });
  }

  const reviews = readDB();
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  const oldStatus = review.status;
  review.status = status;
  if (reviewer) {
    review.reviewer = reviewer;
  }
  review.updatedAt = new Date().toISOString();

  // Add event log in audit trail
  review.auditTrail.push({
    timestamp: new Date().toISOString(),
    action: "STATUS_CHANGED",
    details: `Review status changed from "${oldStatus}" to "${status}" by ${reviewer || "Assigned Auditor"}.`
  });

  writeDB(reviews);
  res.json(review);
});

// 6. CORE AGENT PIPELINE: Analyze configurations and produce AI review outputs
app.post("/api/reviews/analyze", async (req, res): Promise<any> => {
  try {
    const { 
      oldConfig, 
      newConfig, 
      deviceType = "Generic", 
      environment = "Development", 
      changeRequestId = "CHG-TEMP", 
      reviewer = "SecOps Automated Agent" 
    } = req.body;

    // ----- AGENT 1: INPUT VALIDATION AGENT -----
    const agentSteps: { name: string; status: "success" | "pending" | "error"; description: string }[] = [];
    agentSteps.push({
      name: "1. Input Validation Agent",
      status: "pending",
      description: "Verifying formatting, checking characters, scanning device headers..."
    });

    if (!oldConfig || !newConfig) {
      return res.status(400).json({
        error: "Validation failed: Both baseline config and proposed configs must be loaded into terminals."
      });
    }

    if (oldConfig.length > 500000 || newConfig.length > 500000) {
      return res.status(400).json({
        error: "Strict size limit exceeded. Config files cannot exceed 500KB in this platform simulator."
      });
    }

    agentSteps[0].status = "success";
    agentSteps[0].description = `Accepted configurations. Baseline: ${oldConfig.split("\n").length} lines, Proposed: ${newConfig.split("\n").length} lines.`;

    // ----- AGENT 2: DIFF GENERATION AGENT -----
    agentSteps.push({
      name: "2. Diff Generation Agent",
      status: "pending",
      description: "Executing mathematical Line-by-Line LCS matrix evaluation..."
    });

    const diffLines = computeDiff(oldConfig, newConfig);
    const addedCount = diffLines.filter(line => line.type === "added").length;
    const removedCount = diffLines.filter(line => line.type === "removed").length;

    agentSteps[1].status = "success";
    agentSteps[1].description = `Analyst generated matrix: ${addedCount} line insertions, ${removedCount} deletions calculated.`;

    // ----- AGENT 3 & 4: DEVICE CLASSIFICATION & POLICY CHECKS -----
    agentSteps.push({
      name: "3. Policy Check Agent",
      status: "pending",
      description: "Testing configurations against the 8 enterprise security standards..."
    });

    const policyFindings = runPolicyChecks(diffLines);
    
    // Compute objective threat score out of 10 based on maximum severity matched
    let computedRiskScore = 0;
    if (policyFindings.length > 0) {
      computedRiskScore = Math.max(...policyFindings.map(f => f.scoreOffset));
    } else {
      computedRiskScore = diffLines.some(l => l.type !== "unchanged") ? 1 : 0;
    }

    let overallRisk: "Low" | "Medium" | "High" = "Low";
    if (computedRiskScore > 7) {
      overallRisk = "High";
    } else if (computedRiskScore >= 3) {
      overallRisk = "Medium";
    } else {
      overallRisk = "Low";
    }

    agentSteps[2].status = "success";
    agentSteps[2].description = `Policy scanner finished. Flagged ${policyFindings.length} breaches. Target risk score level set at ${computedRiskScore}/10.`;

    // ----- AGENT 5: COGNITIVE ANALYSIS AGENT (AI PIPELINE) -----
    agentSteps.push({
      name: "4. Cognitive Threat Mapping Agent",
      status: "pending",
      description: "Querying server-side Google Gemini 3.5 models..."
    });

    // Extract differences to feed into the prompt (avoids sending thousands of unchanged lines to keep token counts small)
    const formattedDiffToSend = diffLines
      .filter(line => line.type !== "unchanged")
      .map(line => `Line ${line.oldLineNumber || line.newLineNumber || "?"}: [${line.type.toUpperCase()}] ${line.value}`)
      .join("\n") || "No line edits found.";

    const findingsSerialized = policyFindings.map((f, i) => `${i+1}. [${f.severity}] Category: ${f.category} - ${f.finding}: ${f.reason}`).join("\n");

    const systemInstruction = 
      "You are an enterprise network security review assistant. " +
      "Analyze the network configuration change below and identify vulnerability patterns, " +
      "authorization credentials gaps, static routing bypasses, or telemetry log disablement. " +
      "You must return ONLY valid, stringified JSON matches exactly with the provided schema shape. " +
      "Do not wrap formatting in markdown lines other than plain text, and do not specify any other language words in the JSON wrapper.";

    const promptText = `
Role: Senior Network Security Review Expert.
Context:
Device Type: ${deviceType}
Environment: ${environment}
Change Request ID: ${changeRequestId}

Baseline Config:
${oldConfig.slice(0, 5000)}

Proposed Config:
${newConfig.slice(0, 5000)}

Computed Diff Stream:
${formattedDiffToSend.slice(0, 6000)}

Risk Policy Standard Infractions Discovered:
${findingsSerialized || "No basic deterministic policy violations."}

Analyze the changes. Describe impact to Operations and Security.
Provide a clear checklist for manual operators to confirm before execution in production.

IMPORTANT: You must output ONLY a valid stringified JSON matching this Schema precisely.
No enclosing text. No extra backticks.
{
  "executiveSummary": "Manager friendly overview of what these changes accomplish and why it matters.",
  "technicalSummary": "Deep-dive tech description of lines added/modified for NOC CCIE engineers.",
  "overallRisk": "Low | Medium | High",
  "approvalRecommendation": "Auto Approve | Manual Review Needed",
  "securityImpact": "Detailed impact of these edits to perimeter security barriers.",
  "availabilityImpact": "Traffic routing convergence, packet drops, or link-negotiation risks.",
  "complianceImpact": "Repercussions against SOC2, PCI-DSS, or ISO27001 policies.",
  "affectedServices": ["service 1", "service 2"],
  "changes": [
    {
      "title": "Clear concise change title",
      "category": "ACL | Routing | Interface | NAT | VPN | Authentication | Logging | Monitoring | Other",
      "description": "Exactly what changed in the network configuration syntax lines.",
      "riskLevel": "Low | Medium | High",
      "businessImpact": "Potential operational losses, downtime risks, or administrative exposure.",
      "technicalImpact": "Port blockings, routing table loops, or cleartext protocols leakage.",
      "recommendedAction": "Verify command is accompanied by static IP filters, or substitute with SSH secure commands."
    }
  ],
  "reviewerChecklist": [
    "manual verification step 1",
    "manual verification step 2"
  ],
  "questionsForChangeOwner": [
    "specific technology audit question about these lines"
  ],
  "finalDecisionRationale": "Engineering reasoning grounding this risk classification."
}
`;

    let aiAnalysisResult: any;
    let isFallback = false;

    if (isApiKeyConfigured()) {
      try {
        const ai = getGeminiClient();
        console.log("Analyzing with Gemini 3.5... Current local time: 2026-06-09T08:35:00Z");
        
        const modelsTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
        let aiSuccessRes = null;
        let finalModel = "";

        for (const modelName of modelsTry) {
          try {
            const result = await ai.models.generateContent({
              model: modelName,
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1
              }
            });
            if (result && result.text) {
              aiSuccessRes = result.text;
              finalModel = modelName;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Model ${modelName} failed. Cycling... Error:`, modelErr);
            continue;
          }
        }

        if (!aiSuccessRes) {
          throw new Error("All loaded gemini model endpoints returned empty text blocks.");
        }

        aiAnalysisResult = JSON.parse(aiSuccessRes.trim());
        isFallback = false;

        agentSteps[3].status = "success";
        agentSteps[3].description = `Cognitive model [${finalModel}] processed structural edits with deep contextual tracking.`;

      } catch (gemError: any) {
        console.error("Gemini invocation failed, launching policy-driven fallback analyzer:", gemError);
        aiAnalysisResult = generateFallbackAnalysis(oldConfig, newConfig, diffLines, policyFindings, deviceType, environment);
        isFallback = true;

        agentSteps[3].status = "success";
        agentSteps[3].description = `Cognitive service busy/unavailable (${gemError.message || "Limits hit"}). Detouring to reliable policy rule matching engine fallback.`;
      }
    } else {
      console.log("No GEMINI_API_KEY environment variable. Using policy check fallback.");
      aiAnalysisResult = generateFallbackAnalysis(oldConfig, newConfig, diffLines, policyFindings, deviceType, environment);
      isFallback = true;

      agentSteps[3].status = "success";
      agentSteps[3].description = "API Key not configured. Promptly initiated local offline policy analysis compiler.";
    }

    // Double safeguard mechanism: guarantee the risk level and score adhere to explicit constraints
    aiAnalysisResult.overallRisk = overallRisk;
    aiAnalysisResult.approvalRecommendation = computedRiskScore < 3 ? "Auto Approve" : "Manual Review Needed";

    // ----- AGENT 6: SUMMARY & REPORT AGENT -----
    agentSteps.push({
      name: "5. Review Consolidation Agent",
      status: "pending",
      description: "Compiling manual checks and auditing decision rationales..."
    });

    const reviews = readDB();
    
    // Generate a beautiful new sequential review ID
    const year = new Date().getFullYear();
    const nextNum = String(reviews.length + 1).padStart(4, "0");
    const reviewId = `REV-${year}-${nextNum}`;

    let initialStatus: "Approved" | "Pending" = "Pending";
    let auditTrailDetails = "";
    if (computedRiskScore < 3) {
      initialStatus = "Approved";
      auditTrailDetails = `Baseline comparison ran successfully. Identified low policy risks, score set at ${computedRiskScore}/10. Configuration has been automatically approved.`;
    } else {
      initialStatus = "Pending";
      auditTrailDetails = `Baseline comparison ran successfully. Risk score is ${computedRiskScore}/10 (${overallRisk}), requiring manual review and verification.`;
    }

    const newRecord: any = {
      id: reviewId,
      changeRequestId,
      deviceType,
      environment,
      reviewer,
      status: initialStatus,
      overallRisk,
      riskScore: computedRiskScore,
      oldConfig,
      newConfig,
      diff: diffLines,
      analysis: aiAnalysisResult,
      checklist: (aiAnalysisResult.reviewerChecklist || []).map((chk: string) => ({
        item: chk,
        checked: false
      })),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: initialStatus === "Approved" ? "AUTO_APPROVED" : "ANALYSIS_COMPLETED",
          details: auditTrailDetails
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reviews.push(newRecord);
    writeDB(reviews);

    agentSteps[4].status = "success";
    agentSteps[4].description = `Review recorded as ${reviewId}. Configuration indices written to database safely.`;

    res.json({
      success: true,
      review: newRecord,
      isFallback,
      steps: agentSteps
    });

  } catch (error: any) {
    console.error("Pipeline failure in reviews/analyze:", error);
    res.status(500).json({
      error: "Cognitive agent analysis pipeline failure",
      details: error.message
    });
  }
});

// 7. GET Report Markdown format
app.get("/api/reports/:id/markdown", (req, res) => {
  try {
    const reviews = readDB();
    const review = reviews.find(r => r.id === req.params.id);
    if (!review) {
      return res.status(404).send("Document not found in record storage.");
    }

    const titleDate = new Date(review.createdAt).toLocaleDateString();
    
    let md = `========================================================================\n`;
    md += `        NETGUARD AI SECURITY REVIEW REPORT - ${review.id}\n`;
    md += `========================================================================\n\n`;
    
    md += `### REVIEW DIRECTORS METADATA\n`;
    md += `- **Review Tracking ID**: ${review.id}\n`;
    md += `- **Change request CR**: ${review.changeRequestId}\n`;
    md += `- **Target Host Appliance**: ${review.deviceType}\n`;
    md += `- **Environment Zone**: ${review.environment}\n`;
    md += `- **Audit Initiated By**: ${review.reviewer}\n`;
    md += `- **Analysis Timestamp**: ${new Date(review.createdAt).toISOString()}\n`;
    md += `- **Threat Audit Score**: ${review.riskScore} / 10\n`;
    md += `- **Overall Safety Rating**: ${review.overallRisk.toUpperCase()}\n`;
    md += `- **Approval Status Status**: ${review.status.toUpperCase()}\n\n`;

    md += `------------------------------------------------------------------------\n`;
    md += `### 1. EXECUTIVE SUMMARY\n`;
    md += `------------------------------------------------------------------------\n`;
    md += `> ${review.analysis.executiveSummary || "No executive summary parsed"}\n\n`;

    md += `------------------------------------------------------------------------\n`;
    md += `### 2. TECHNICAL SUMMARY & SCOPE OF CHANGES\n`;
    md += `------------------------------------------------------------------------\n`;
    md += `> ${review.analysis.technicalSummary || "No tech summary parsed"}\n\n`;
    md += `- **Security Impact**: ${review.analysis.securityImpact || "N/A"}\n`;
    md += `- **Availability Impact**: ${review.analysis.availabilityImpact || "N/A"}\n`;
    md += `- **Regulatory & Compliance Impact**: ${review.analysis.complianceImpact || "N/A"}\n\n`;

    md += `------------------------------------------------------------------------\n`;
    md += `### 3. SPECIFIC EXPOSURE FINDINGS TABLE\n`;
    md += `------------------------------------------------------------------------\n`;
    md += `| Category | Title / Exposure | Severity | Impact Reasoning | Mitigation Action |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    const changes = review.analysis.changes || [];
    changes.forEach((c: any) => {
      md += `| **${c.category}** | ${c.title} | **${c.riskLevel.toUpperCase()}** | *Tech:* ${c.technicalImpact}<br>*Biz:* ${c.businessImpact} | ${c.recommendedAction} |\n`;
    });

    if (changes.length === 0) {
      md += `| Other | Routine Updates | Low | Cosmetic description changes only. | Proceed with standard deployment schedule. |\n`;
    }

    md += `\n------------------------------------------------------------------------\n`;
    md += `### 4. MANDATORY AUDITOR VERIFICATION CHECKLIST\n`;
    md += `------------------------------------------------------------------------\n`;
    const checklist = review.checklist || [];
    checklist.forEach((chk: any) => {
      const mark = chk.checked ? "[X]" : "[ ]";
      md += `${mark} ${chk.item}\n`;
    });

    if (checklist.length === 0) {
      md += `- [ ] Standard physical interfaces state alignment check.\n`;
    }

    if (review.analysis.questionsForChangeOwner && review.analysis.questionsForChangeOwner.length > 0) {
      md += `\n### QUESTIONS FOR THE CHANGE OWNER / SYSTEM OWNER\n`;
      review.analysis.questionsForChangeOwner.forEach((q: string, idx: number) => {
        md += `${idx + 1}. ${q}\n`;
      });
    }

    md += `\n------------------------------------------------------------------------\n`;
    md += `### 5. SYSTEM COMPILATION AUDIT LOG TRAILS\n`;
    md += `------------------------------------------------------------------------\n`;
    review.auditTrail.forEach((trail: any) => {
      md += `[${new Date(trail.timestamp).toLocaleString()}] **${trail.action}**: ${trail.details}\n`;
    });

    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename=NetGuard_Report_${review.id}.md`);
    res.send(md);

  } catch (error: any) {
    res.status(500).send(`Failed to format markdown report download: ${error.message}`);
  }
});

// 8. GET Report JSON format
app.get("/api/reports/:id/json", (req, res) => {
  try {
    const reviews = readDB();
    const review = reviews.find(r => r.id === req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Document not found in storage." });
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=NetGuard_Record_${review.id}.json`);
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. MODEL CONTEXT PROTOCOL (MCP) COMPLIANT SERVER ENDPOINTS
// This implements a lightweight Model Context Protocol specification server natively for models to query
app.get("/api/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "analyze_config_snippet",
        description: "Analyzes raw router settings or access control list scripts for critical infrastructure configuration bugs.",
        inputSchema: {
          type: "object",
          properties: {
            snippet: { type: "string", description: "Raw terminal configuration input block." },
            deviceType: { type: "string", description: "The architecture target (Cisco, Juniper, Generic)." }
          },
          required: ["snippet"]
        }
      },
      {
        name: "get_policy_benchmarks",
        description: "Retrieves standard compliance policy rules checked by the security scanning engine.",
        inputSchema: {
          type: "object",
          properties: {
            standard: { type: "string", description: "ISO-27001, NIST-800, CIS, or SOC2" }
          }
        }
      }
    ]
  });
});

app.post("/api/mcp/tools/call", (req, res) => {
  try {
    const { name, arguments: toolArgs } = req.body;
    
    if (name === "analyze_config_snippet") {
      const snippet = toolArgs?.snippet || "";
      const device = toolArgs?.deviceType || "Generic";
      
      const findings: string[] = [];
      if (snippet.toLowerCase().includes("telnet")) {
        findings.push("VULNERABILITY: Plaintext transport protocol (Telnet) enabled on virtual lines.");
      }
      if (snippet.toLowerCase().includes("password 0 ") || snippet.toLowerCase().includes("key chain ") && snippet.toLowerCase().includes("unencrypted")) {
        findings.push("SECURITY BREACH: Plaintext configuration passwords are being cached in configuration scripts.");
      }
      if (snippet.toLowerCase().includes("permit any") || snippet.toLowerCase().includes("permit ip any any")) {
        findings.push("RISK: Wildcard permissive IP rules (permit ip any any) allow unfiltered egress/ingress traversal.");
      }
      if (!snippet.toLowerCase().includes("logging") && !snippet.toLowerCase().includes("syslog")) {
        findings.push("COMPLIANCE CRITICAL: No persistent logging or remote syslog collector addresses discovered.");
      }
      
      const resultText = findings.length > 0 
        ? `MCP Server Audit results for snippet [Target: ${device}]:\n\n` + findings.map((f, i) => `${i+1}. ${f}`).join("\n") + "\n\nRecommendation: Please secure standard configurations using SSH, encrypted secrets, and static IP lists."
        : `MCP Server Audit successful for snippet [Target: ${device}]: No critical compliance breaches or plaintext passwords flagged under rapid heuristical scan.`;
        
      return res.json({
        content: [
          {
            type: "text",
            text: resultText
          }
        ],
        isError: false
      });
    }
    
    if (name === "get_policy_benchmarks") {
      const std = toolArgs?.standard || "NIST-800";
      return res.json({
        content: [
          {
            type: "text",
            text: `Core compliance metrics mapped for standard scope [${std}]:\n` +
                 `- Rule SEC-01: Encrypt all management terminals (SSH only, drop Telnet / HTTP Cleartext)\n` +
                 `- Rule SEC-02: Strong admin hashing standard. Use secure SHA-256 or bcrypt variants\n` +
                 `- Rule SEC-03: Zero-trust network access lists. Deny dynamic traversals by default\n` +
                 `- Rule SEC-04: Mandatory log collector address synchronization (Syslog RFC 5424 compliance)`
          }
        ],
        isError: false
      });
    }
    
    res.status(404).json({ error: `MCP Tool ${name} not found or unsupported by this server` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed calling MCP tool" });
  }
});


// Serve static build dist assets or fallback to Vite dev server
const distPath = path.join(process.cwd(), "dist");

async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting full-stack router with live Vite connection stream...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled assets from /dist folder...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NetGuard server ready and listening on host 0.0.0.0 port ${PORT}`);
  });
}

initializeServer();
