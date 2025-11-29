import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, NavigationEnd, Router } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, HeaderComponent],
})
export class AppComponent {
  showNavigation = signal(true);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const hiddenRoutes = ['/', '/login', '/register'];
      this.showNavigation.set(!hiddenRoutes.includes(event.urlAfterRedirects));
    });
  }
}
