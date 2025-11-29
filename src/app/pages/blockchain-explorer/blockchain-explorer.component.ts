
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';
import { BlockchainViewerComponent } from '../../components/blockchain-viewer/blockchain-viewer.component';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-blockchain-explorer',
  standalone: true,
  imports: [CommonModule, BlockchainViewerComponent, SkeletonLoaderComponent],
  templateUrl: './blockchain-explorer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockchainExplorerComponent {
  private dataService = inject(DataService);
  blockchain = toSignal(this.dataService.getBlockchain());
}
