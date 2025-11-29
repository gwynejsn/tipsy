
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockchainBlock } from '../../models/tipsy.model';

@Component({
  selector: 'app-blockchain-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blockchain-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockchainViewerComponent {
  blocks = input.required<BlockchainBlock[]>();
  title = input<string>('Blockchain Log');
}
