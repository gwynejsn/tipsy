import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  error = signal<string | null>(null);

  register() {
    this.error.set(null);
    if (this.password() !== this.confirmPassword()) {
        this.error.set("Passwords do not match.");
        return;
    }
    const newUser = this.authService.register(this.email(), this.password());
    if (newUser) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('An account with this email already exists.');
    }
  }
}
