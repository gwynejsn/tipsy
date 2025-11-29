
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';
import { AiService } from '../../services/ai.service';
import { AiDuplicateCheck } from '../../models/tipsy.model';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { signalToObservable } from '../../utils/signal-to-observable';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-report.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateReportComponent {
  private dataService = inject(DataService);
  private aiService = inject(AiService);
  private router = inject(Router);

  title = signal('');
  description = signal('');
  isSubmitting = signal(false);
  
  descriptionObservable = signalToObservable(this.description);
  
  duplicateCheckResult = toSignal<AiDuplicateCheck | null>(
    this.descriptionObservable.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(desc => {
        if (desc.length < 50) {
          return of(null);
        }
        return this.aiService.checkForDuplicates(desc);
      })
    )
  );

  submitReport(): void {
    if (this.title().trim() && this.description().trim() && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.dataService.addReport({ title: this.title(), description: this.description() })
        .subscribe(newReport => {
          this.isSubmitting.set(false);
          this.router.navigate(['/report', newReport.id]);
        });
    }
  }
}
