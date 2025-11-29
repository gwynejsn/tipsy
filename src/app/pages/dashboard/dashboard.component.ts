import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';
import { Criticality, ReportStatus } from '../../models/tipsy.model';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private dataService = inject(DataService);

  reports = toSignal(this.dataService.getReports());

  statusFilter = signal<ReportStatus | 'All'>('All');
  criticalityFilter = signal<Criticality | 'All'>('All');

  statuses: (ReportStatus | 'All')[] = [
    'All',
    'Open',
    'Under Review',
    'Resolved',
  ];
  criticalities: (Criticality | 'All')[] = ['All', 'Low', 'Medium', 'High'];

  filteredReports = computed(() => {
    const reports = this.reports();
    const status = this.statusFilter();
    const criticality = this.criticalityFilter();

    if (!reports) return [];

    return reports.filter((report) => {
      const statusMatch = status === 'All' || report.status === status;
      const criticalityMatch =
        criticality === 'All' || report.criticality === criticality;
      return statusMatch && criticalityMatch;
    });
  });

  setStatusFilter(status: ReportStatus | 'All') {
    this.statusFilter.set(status);
  }

  setCriticalityFilter(criticality: Criticality | 'All') {
    this.criticalityFilter.set(criticality);
  }

  getSeverityClass(severity: Criticality): string {
    switch (severity) {
      case 'High':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  getStatusClass(status: ReportStatus): string {
    switch (status) {
      case 'Open':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Under Review':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Resolved':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }
}
