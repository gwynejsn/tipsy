import { ChangeDetectionStrategy, Component, computed, inject, signal, ElementRef, viewChild, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';
import { AiService } from '../../services/ai.service';
import { Report, ReportStatus, Criticality, AiRecommendation, User, ChatSession } from '../../models/tipsy.model';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';
import { Chart } from 'chart.js/auto';
import { switchMap, of } from 'rxjs';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, FormsModule],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnDestroy {
  private dataService = inject(DataService);
  private aiService = inject(AiService);

  reports = toSignal(this.dataService.getReports());
  activeTab = signal<ReportStatus | 'Open'>('Open');
  
  selectedReportId = signal<string | null>(null);
  selectedReport = computed(() => this.reports()?.find(r => r.id === this.selectedReportId()));
  
  aiRecommendation = signal<AiRecommendation | null>(null);
  isRecommendationLoading = signal(false);

  // Chat state
  adminNewMessage = signal('');
  selectedChatSession = toSignal(
    toObservable(this.selectedReportId).pipe(
      switchMap(id => id ? this.dataService.getChatSessionStream(id) : of(undefined))
    )
  );

  statusChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('statusChart');
  criticalityChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('criticalityChart');
  
  private statusChart: Chart | null = null;
  private criticalityChart: Chart | null = null;

  constructor() {
    effect(() => {
      const reportsData = this.reports();
      const statusCanvasEl = this.statusChartCanvas()?.nativeElement;
      const criticalityCanvasEl = this.criticalityChartCanvas()?.nativeElement;

      if (reportsData && reportsData.length > 0) {
        if (statusCanvasEl) {
          this.createStatusChart(statusCanvasEl, reportsData);
        }
        if (criticalityCanvasEl) {
          this.createCriticalityChart(criticalityCanvasEl, reportsData);
        }
      }
    });
  }

  ngOnDestroy(): void {
      this.statusChart?.destroy();
      this.criticalityChart?.destroy();
  }

  filteredReports = computed(() => {
    return this.reports()?.filter(r => r.status === this.activeTab()) ?? [];
  });

  submitter = computed(() => {
      const report = this.selectedReport();
      if (!report) return null;
      return this.dataService.getUser(report.submitterId);
  })
  
  selectReport(report: Report) {
    this.selectedReportId.set(report.id);
    this.aiRecommendation.set(null);
    this.isRecommendationLoading.set(true);
    this.aiService.getRecommendation(report.description, report.criticality).subscribe(rec => {
        this.aiRecommendation.set(rec);
        this.isRecommendationLoading.set(false);
    });
  }
  
  changeStatus(report: Report, status: ReportStatus) {
      this.dataService.updateReportStatus(report.id, status);
  }

  sendAdminReply(): void {
    const sessionId = this.selectedChatSession()?.id;
    const messageText = this.adminNewMessage().trim();
    if (sessionId && messageText) {
      this.dataService.addChatMessage(sessionId, messageText);
      this.adminNewMessage.set('');
    }
  }

  getSeverityClass(severity: Criticality): string {
    switch (severity) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  private createStatusChart(canvas: HTMLCanvasElement, reports: Report[]) {
    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const reportsByStatus = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<ReportStatus, number>);

    const chartData = {
      labels: Object.keys(reportsByStatus),
      datasets: [{
        label: 'Reports by Status',
        data: Object.values(reportsByStatus),
        backgroundColor: ['#22C55E', '#F97316', '#A855F7'],
        borderColor: '#23263A',
        borderWidth: 2
      }]
    };

    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#E0E0E0'
            }
          }
        }
      }
    });
  }

  private createCriticalityChart(canvas: HTMLCanvasElement, reports: Report[]) {
    if(this.criticalityChart) {
        this.criticalityChart.destroy();
    }

    const reportsByCriticality = reports.reduce((acc, report) => {
      acc[report.criticality] = (acc[report.criticality] || 0) + 1;
      return acc;
    }, {} as Record<Criticality, number>);

    const chartData = {
      labels: Object.keys(reportsByCriticality),
      datasets: [{
        label: 'Reports by Criticality',
        data: Object.values(reportsByCriticality),
        backgroundColor: ['#EF4444', '#EAB308', '#3B82F6'], // High, Medium, Low
        borderColor: '#23263A',
        borderWidth: 2,
      }]
    };

    this.criticalityChart = new Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
          y: { ticks: { color: '#E0E0E0' }, grid: { color: '#374151' } }
        }
      }
    });
  }
}