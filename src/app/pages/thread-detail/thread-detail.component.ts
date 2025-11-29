import { CommonModule, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
// FIX: Import 'of' from rxjs to create an observable from a value.
import { FormsModule } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { BlockchainViewerComponent } from '../../components/blockchain-viewer/blockchain-viewer.component';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';
import { Criticality, ReportStatus } from '../../models/tipsy.model';
import { AiService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-thread-detail',
  standalone: true,
  imports: [
    CommonModule,
    JsonPipe,
    RouterLink,
    FormsModule,
    SkeletonLoaderComponent,
    BlockchainViewerComponent,
  ],
  templateUrl: './thread-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadDetailComponent {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private aiService = inject(AiService);
  private authService = inject(AuthService);

  private reportId = toSignal(
    this.route.paramMap.pipe(switchMap((params) => of(params.get('id')!)))
  );

  report = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.dataService.getReport(params.get('id')!))
    )
  );

  aiSummary = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.aiService.getSummary(params.get('id')!))
    )
  );
  aiSeverity = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.aiService.predictSeverity(params.get('id')!))
    )
  );
  aiEvidenceIntegrity = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.aiService.analyzeEvidence(params.get('id')!))
    )
  );
  blockchain = toSignal(this.dataService.getBlockchain());

  // Chat state
  isChatOpen = signal(false);
  newChatMessage = signal('');
  currentUser = this.authService.currentUser;
  isSubmitter = computed(
    () => this.report()?.submitterId === this.currentUser()?.id
  );

  chatSession = toSignal(
    toObservable(this.reportId).pipe(
      switchMap((id) =>
        id ? this.dataService.getChatSessionStream(id) : of(undefined)
      )
    )
  );

  newComment = signal('');

  reportBlockchain = computed(() => {
    const allBlocks = this.blockchain();
    const reportData = this.report();
    if (!allBlocks || !reportData) return [];

    return allBlocks.filter((block) => {
      try {
        const data = JSON.parse(block.data);
        return data.id === reportData.id || data.reportId === reportData.id;
      } catch (e) {
        return false;
      }
    });
  });

  upvote(): void {
    if (this.reportId()) {
      this.dataService.upvoteReport(this.reportId()!);
    }
  }

  downvote(): void {
    if (this.reportId()) {
      this.dataService.downvoteReport(this.reportId()!);
    }
  }

  submitComment(): void {
    const id = this.reportId();
    const commentText = this.newComment().trim();
    if (id && commentText) {
      this.dataService.addComment(id, commentText).subscribe(() => {
        this.newComment.set('');
      });
    }
  }

  toggleChat(): void {
    const id = this.reportId();
    if (id) {
      this.dataService.initiateChatSession(id);
      this.isChatOpen.update((v) => !v);
    }
  }

  sendChatMessage(): void {
    const sessionId = this.chatSession()?.id;
    const messageText = this.newChatMessage().trim();
    if (sessionId && messageText) {
      this.dataService.addChatMessage(sessionId, messageText);
      this.newChatMessage.set('');
    }
  }

  getSeverityClass(severity: Criticality | undefined): string {
    if (!severity) return 'bg-gray-500/20 text-gray-400';
    switch (severity) {
      case 'High':
        return 'bg-red-500 text-white';
      case 'Medium':
        return 'bg-yellow-500 text-white';
      case 'Low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  getStatusClass(status: ReportStatus | undefined): string {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    switch (status) {
      case 'Open':
        return 'bg-green-500/20 text-green-400';
      case 'Under Review':
        return 'bg-orange-500/20 text-orange-400';
      case 'Resolved':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }
}
