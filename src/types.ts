export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  value: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface PolicyCheckResult {
  scoreOffset: number;
  finding: string;
  category: "ACL" | "Routing" | "Interface" | "NAT" | "VPN" | "Authentication" | "Logging" | "Monitoring" | "Other";
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
}

export interface AIChange {
  title: string;
  category: "ACL" | "Routing" | "Interface" | "NAT" | "VPN" | "Authentication" | "Logging" | "Monitoring" | "Other";
  description: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  businessImpact: string;
  technicalImpact: string;
  recommendedAction: string;
}

export interface AIAnalysis {
  executiveSummary: string;
  technicalSummary: string;
  overallRisk: "Low" | "Medium" | "High" | "Critical";
  approvalRecommendation: "Approve" | "Approve with Checks" | "Needs Changes" | "Reject";
  securityImpact: string;
  availabilityImpact: string;
  complianceImpact: string;
  affectedServices: string[];
  changes: AIChange[];
  reviewerChecklist: string[];
  questionsForChangeOwner: string[];
  finalDecisionRationale: string;
}

export interface ChecklistItem {
  item: string;
  checked: boolean;
}

export interface AuditTrailEvent {
  timestamp: string;
  action: string;
  details: string;
  reviewer?: string;
}

export interface ReviewRecord {
  id: string;
  changeRequestId: string;
  deviceType: string;
  environment: "Production" | "Staging" | "Development";
  reviewer: string;
  status: "Pending" | "Approved" | "Rejected" | "Needs Changes";
  overallRisk: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
  oldConfig: string;
  newConfig: string;
  diff: DiffLine[];
  analysis: AIAnalysis;
  checklist: ChecklistItem[];
  auditTrail: AuditTrailEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalReviews: number;
  highRiskReviews: number;
  pendingApprovals: number;
  approvedChanges: number;
  needsChangesChanges: number;
  rejectedChanges: number;
}

export interface RiskDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface RecentActivityEvent {
  reviewId: string;
  changeRequestId: string;
  deviceType: string;
  environment: string;
  reviewer: string;
  action: string;
  details: string;
  timestamp: string;
  risk: string;
}

export interface SystemSettings {
  geminiConfigured: boolean;
  organizationName: string;
  retentionDays: number;
  allowSelfApproval: boolean;
  standardComplianceScope: string;
}
