import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import CryptoJS from 'crypto-js';
import { delay, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BlockchainBlock,
  ChatMessage,
  ChatSession,
  Comment,
  Report,
  ReportStatus,
  User,
} from '../models/tipsy.model';
import { AiService } from './ai.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private authService = inject(AuthService);
  private reports = signal<Report[]>([]);
  private users = signal<User[]>(this.authService.getUsers());
  private blockchain = signal<BlockchainBlock[]>([]);
  private aiService = inject(AiService);
  private chatSessions = signal<ChatSession[]>([]);

  constructor() {
    this.reports.set(this.generateInitialReports());
    this.initializeBlockchain();
  }

  getReports(): Observable<Report[]> {
    return toObservable(this.reports).pipe(delay(500));
  }

  getReport(id: string): Observable<Report | undefined> {
    return toObservable(this.reports).pipe(
      map((reports) => reports.find((r) => r.id === id))
    );
  }

  getUser(id: string): User | undefined {
    return this.users().find((u) => u.id === id);
  }

  upvoteReport(id: string): void {
    this.reports.update((reports) =>
      reports.map((report) => {
        if (report.id === id) {
          this.updateReputation(report.submitterId, 1);
          return { ...report, upvotes: report.upvotes + 1 };
        }
        return report;
      })
    );
  }

  downvoteReport(id: string): void {
    this.reports.update((reports) =>
      reports.map((report) => {
        if (report.id === id) {
          this.updateReputation(report.submitterId, -1);
          return { ...report, downvotes: report.downvotes + 1 };
        }
        return report;
      })
    );
  }

  private updateReputation(userId: string, change: number): void {
    this.users.update((users) =>
      users.map((user) => {
        if (user.id === userId && typeof user.reputation === 'number') {
          return { ...user, reputation: user.reputation + change };
        }
        return user;
      })
    );
    this.authService.syncUsers(this.users());
  }

  addReport(reportData: {
    title: string;
    description: string;
  }): Observable<Report> {
    const currentUser = this.authService.currentUser()!;

    return this.aiService.predictSeverity(`r${this.reports().length + 1}`).pipe(
      map((severityResult) => {
        const newReport: Report = {
          id: `r${this.reports().length + 1}`,
          title: reportData.title,
          description: reportData.description,
          createdAt: new Date().toISOString(),
          criticality: severityResult.severity,
          upvotes: 0,
          downvotes: 0,
          status: 'Open',
          submitterId: currentUser.id,
          submitter: currentUser.anonymousId,
          comments: [],
          evidence: [
            {
              id: 'e1',
              reportId: `r${this.reports().length + 1}`,
              type: 'image',
              url: `https://picsum.photos/seed/${Math.random()}/600/400`,
              filename: 'evidence_A.jpg',
            },
            {
              id: 'e2',
              reportId: `r${this.reports().length + 1}`,
              type: 'image',
              url: `https://picsum.photos/seed/${Math.random()}/600/400`,
              filename: 'evidence_B.jpg',
            },
          ],
        };

        this.reports.update((reports) => [...reports, newReport]);
        this.addBlock(newReport);

        return newReport;
      })
    );
  }

  addComment(reportId: string, text: string): Observable<boolean> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return of(false);

    this.reports.update((reports) =>
      reports.map((report) => {
        if (report.id === reportId) {
          const newComment: Comment = {
            id: `c${report.comments.length + 1}-${reportId}`,
            reportId,
            text,
            createdAt: new Date().toISOString(),
            author: currentUser.anonymousId,
          };
          this.addBlock(newComment);
          return { ...report, comments: [...report.comments, newComment] };
        }
        return report;
      })
    );
    return of(true).pipe(delay(400));
  }

  updateReportStatus(reportId: string, status: ReportStatus): void {
    this.reports.update((reports) =>
      reports.map((report) =>
        report.id === reportId ? { ...report, status } : report
      )
    );
    const updateData = {
      reportId,
      newStatus: status,
      timestamp: new Date().toISOString(),
    };
    this.addBlock(updateData);
  }

  getBlockchain(): Observable<BlockchainBlock[]> {
    return of(this.blockchain()).pipe(delay(600));
  }

  // --- Chat Methods ---

  getChatSessionStream(sessionId: string): Observable<ChatSession | undefined> {
    return toObservable(this.chatSessions).pipe(
      map((sessions) => sessions.find((s) => s.id === sessionId))
    );
  }

  initiateChatSession(reportId: string): void {
    const sessionExists = this.chatSessions().some((s) => s.id === reportId);
    if (!sessionExists) {
      const newSession: ChatSession = {
        id: reportId,
        reportId: reportId,
        messages: [],
      };
      this.chatSessions.update((sessions) => [...sessions, newSession]);
    }
  }

  addChatMessage(sessionId: string, text: string): void {
    const sender = this.authService.currentUser();
    if (!sender) return;

    this.chatSessions.update((sessions) =>
      sessions.map((session) => {
        if (session.id === sessionId) {
          const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sessionId,
            senderId: sender.anonymousId,
            text,
            timestamp: new Date().toISOString(),
          };
          this.addBlock(newMessage); // Log chat message to blockchain
          return { ...session, messages: [...session.messages, newMessage] };
        }
        return session;
      })
    );
  }

  private generateInitialReports(): Report[] {
    const users = this.users().filter((u) => u.role === 'Employee'); // Only employees can submit initial reports
    if (!users.length) return [];
    return Array.from({ length: 15 }, (_, i) => {
      const randomUser = users[i % users.length];
      return {
        id: `r${i + 1}`,
        title: `Report of potential misconduct #${i + 1}`,
        description: `This is a detailed anonymous report concerning potential ethical violations observed on ${new Date(
          Date.now() - i * 1000 * 3600 * 24
        ).toLocaleDateString()}. The incident involves [brief, non-identifying description of the incident]. This behavior appears to contradict our company's code of conduct, specifically section [X.Y]. I have attached photographic evidence for your review. I believe this requires immediate attention to uphold our corporate integrity.`,
        createdAt: new Date(Date.now() - i * 1000 * 3600 * 24).toISOString(),
        criticality: i % 3 === 0 ? 'High' : i % 2 === 0 ? 'Medium' : 'Low',
        upvotes: Math.floor(Math.random() * 100),
        downvotes: Math.floor(Math.random() * 20),
        status: i < 5 ? 'Open' : i < 10 ? 'Under Review' : 'Resolved',
        submitterId: randomUser.id,
        submitter: randomUser.anonymousId,
        comments: Array.from(
          { length: Math.floor(Math.random() * 5) },
          (_, c) => ({
            id: `c${c + 1}-r${i + 1}`,
            reportId: `r${i + 1}`,
            text: `I can corroborate this. I witnessed a similar event. This needs to be looked into.`,
            createdAt: new Date(Date.now() - c * 1000 * 3600).toISOString(),
            author: `Employee #${Math.floor(10000 + Math.random() * 90000)}`,
          })
        ),
        evidence: [
          {
            id: `e1-r${i + 1}`,
            reportId: `r${i + 1}`,
            type: 'image',
            url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRib9uAtEIqKjgX7Ct_hJ1yuaEDWmmxwqfgE8nwMlDOK7YUbTkf23bvJJCoKku2dlnwgSQ&usqp=CAU',
            filename: 'evidence-1.png',
          },
          {
            id: `e2-r${i + 1}`,
            reportId: `r${i + 1}`,
            type: 'image',
            url: 'https://www.intelligenthq.com/wp-content/uploads/2020/12/illegal-business-practice.jpg',
            filename: 'evidence-2.png',
          },
        ],
      };
    });
  }

  private calculateHash(
    id: number,
    previousHash: string,
    timestamp: string,
    data: string
  ): string {
    return CryptoJS.SHA256(id + previousHash + timestamp + data).toString();
  }

  private createBlock(
    id: number,
    data: any,
    previousHash: string = ''
  ): BlockchainBlock {
    const timestamp = new Date().toISOString();
    const stringifiedData = JSON.stringify(data);
    const hash = this.calculateHash(
      id,
      previousHash,
      timestamp,
      stringifiedData
    );
    return { id, data: stringifiedData, hash, previousHash, timestamp };
  }

  private initializeBlockchain() {
    const genesisBlock = this.createBlock(0, 'Genesis Block', '0');
    this.blockchain.set([genesisBlock]);
    this.reports().forEach((report) => this.addBlock(report));
  }

  private addBlock(data: any): void {
    this.blockchain.update((chain) => {
      const previousBlock = chain[chain.length - 1];
      const newBlock = this.createBlock(chain.length, data, previousBlock.hash);
      return [...chain, newBlock];
    });
  }
}
