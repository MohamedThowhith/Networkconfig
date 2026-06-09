# Engineering Prompt Frameworks

This record catalogs the precise prompts utilized during the review stages of the NetGuard AI Config Review Platform.

## 1. Differential Cognitive Audit Frame
This prompt template maps configuration instructions, device metadata, and deterministic policy findings into structured, validated JSON:

```
You are an enterprise network security review assistant.

Analyze the network configuration change below.

Return ONLY valid JSON using this schema:

{
  "executiveSummary": "Business-friendly summary for managers",
  "technicalSummary": "Technical summary for network engineers",
  "overallRisk": "Low | Medium | High | Critical",
  "approvalRecommendation": "Approve | Approve with Checks | Needs Changes | Reject",
  "securityImpact": "Explain security impact",
  "availabilityImpact": "Explain availability impact",
  "complianceImpact": "Explain compliance impact",
  "affectedServices": ["service 1", "service 2"],
  "changes": [
    {
      "title": "short change title",
      "category": "ACL | Routing | Interface | NAT | VPN | Authentication | Logging | Monitoring | Other",
      "description": "what changed",
      "riskLevel": "Low | Medium | High | Critical",
      "businessImpact": "business impact",
      "technicalImpact": "technical impact",
      "recommendedAction": "reviewer action"
    }
  ],
  "reviewerChecklist": [
    "check item"
  ],
  "questionsForChangeOwner": [
    "question"
  ],
  "finalDecisionRationale": "why this recommendation was chosen"
}

Context:
Device Type: {{deviceType}}
Environment: {{environment}}
Change Request ID: {{changeRequestId}}

Old Config:
{{oldConfig}}

New Config:
{{newConfig}}

Diff:
{{diff}}

Risk Policy Findings:
{{policyFindings}}
```

## 2. Dynamic Model Fallback Prompt
In the event that Gemini models experience high traffic or API capacity limits, our backend switches to a highly optimized local regex parsing engine to protect operations while emitting a clear fallback notification to developers.
