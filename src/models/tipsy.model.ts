export type ReportStatus = 'Open' | 'Under Review' | 'Resolved';
export type Criticality = 'Low' | 'Medium' | 'High';
export type UserRole = 'Admin' | 'Employee';

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be a hash
  role: UserRole;
  reputation?: number;
  anonymousId: string; // e.g., "Employee #12345"
}

export interface Report {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  criticality: Criticality;
  upvotes: number;
  downvotes: number;
  status: ReportStatus;
  submitterId: string; // The actual user ID
  submitter: string; // The anonymous display ID, e.g., "Employee #12345"
  comments: Comment[];
  evidence: Evidence[];
}

export interface Comment {
  id: string;
  reportId: string;
  text: string;
  createdAt: string;
  author: string; // e.g., "Employee #67890"
}

export interface Evidence {
  id:string;
  reportId: string;
  type: 'image' | 'file';
  url: string;
  filename: string;
}

export interface BlockchainBlock {
  id: number;
  data: string; // Stringified JSON of report/comment
  hash: string;
  previousHash: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string; // "Admin" or "Employee #XYZ"
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string; // Same as reportId
  reportId: string;
  messages: ChatMessage[];
}

export interface AiSummary {
  summary: string;
}

export interface AiSeverity {
  severity: Criticality;
}

export interface AiDuplicateCheck {
  isDuplicate: boolean;
  similarReportId?: string;
  similarityScore: number;
}

export interface AiEvidenceIntegrity {
  integrityScore: number; // 0-100
  feedback: string;
}

export interface AiRecommendation {
  action: string;
  reasoning: string;
}