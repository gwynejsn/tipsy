
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AiSummary, AiSeverity, AiDuplicateCheck, AiEvidenceIntegrity, AiRecommendation, Criticality } from '../models/tipsy.model';

@Injectable({ providedIn: 'root' })
export class AiService {

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getSummary(reportId: string): Observable<AiSummary> {
    const summary = `AI analysis indicates the report focuses on potential ethical violations. Key points include [summary point 1], [summary point 2], and a potential breach of company policy. The provided evidence appears to support the claims made.`;
    return of({ summary }).pipe(delay(700));
  }

  predictSeverity(reportId: string): Observable<AiSeverity> {
    const severities: Criticality[] = ['Low', 'Medium', 'High'];
    const hash = this.simpleHash(reportId);
    const severity = severities[hash % severities.length];
    return of({ severity }).pipe(delay(500));
  }

  checkForDuplicates(reportText: string): Observable<AiDuplicateCheck> {
    const isDuplicate = this.simpleHash(reportText) % 5 === 0; // ~20% chance of being a duplicate
    const result: AiDuplicateCheck = {
      isDuplicate,
      similarReportId: isDuplicate ? `r${(this.simpleHash(reportText.slice(0,10)) % 15) + 1}` : undefined,
      similarityScore: isDuplicate ? 80 + (this.simpleHash(reportText.slice(10,20)) % 21) : 10 + (this.simpleHash(reportText.slice(10,20)) % 21),
    };
    return of(result).pipe(delay(1000));
  }

  analyzeEvidence(reportId: string): Observable<AiEvidenceIntegrity> {
    const hash = this.simpleHash(reportId);
    const integrityScore = 60 + (hash % 41); // Deterministic score between 60 and 100
    const feedback = integrityScore > 85 ? "Evidence appears consistent and high-quality." : "Evidence is moderately convincing but could benefit from further corroboration.";
    return of({ integrityScore, feedback }).pipe(delay(1200));
  }

  getRecommendation(reportText: string, severity: Criticality): Observable<AiRecommendation> {
    let action = "Standard procedure: Assign to an investigator for preliminary review.";
    if (severity === 'High') {
      action = "High Priority: Escalate immediately to the ethics committee and legal department for urgent review.";
    } else if (severity === 'Medium') {
      action = "Moderate Priority: Assign to a senior investigator and monitor closely.";
    }
    const reasoning = `Based on the report's content and a severity level of ${severity}, this action is recommended to ensure timely and appropriate handling of the potential issue.`;
    return of({ action, reasoning }).pipe(delay(800));
  }
}
