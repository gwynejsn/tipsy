import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../models/tipsy.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users = signal<User[]>([]);
  currentUser = signal<User | null>(null);

  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  constructor() {
    this.loadUsersFromStorage();
    this.loadCurrentUserFromStorage();
  }

  private loadUsersFromStorage() {
    const storedUsers = localStorage.getItem('tipsy_users');
    if (storedUsers) {
      this.users.set(JSON.parse(storedUsers));
    } else {
      // Create initial admin and employee users if none exist
      const initialUsers: User[] = [
        { id: 'u1', email: 'admin@tipsy.com', password: 'password', role: 'Admin', anonymousId: 'Admin' },
        { id: 'u2', email: 'user1@tipsy.com', password: 'password', role: 'Employee', reputation: 25, anonymousId: 'Employee #18432' },
        { id: 'u3', email: 'user2@tipsy.com', password: 'password', role: 'Employee', reputation: 10, anonymousId: 'Employee #58291' },
        { id: 'u4', email: 'user3@tipsy.com', password: 'password', role: 'Employee', reputation: 50, anonymousId: 'Employee #93104' },
      ];
      this.users.set(initialUsers);
      this.saveUsersToStorage();
    }
  }

  private saveUsersToStorage() {
    localStorage.setItem('tipsy_users', JSON.stringify(this.users()));
  }

  private loadCurrentUserFromStorage() {
    const storedUser = localStorage.getItem('tipsy_currentUser');
    if (storedUser) {
      this.currentUser.set(JSON.parse(storedUser));
    }
  }

  getUsers(): User[] {
    return this.users();
  }
  
  syncUsers(updatedUsers: User[]) {
      this.users.set(updatedUsers);
      this.saveUsersToStorage();
      // update current user if their data changed
      const currentUser = this.currentUser();
      if(currentUser) {
          const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id);
          if(updatedCurrentUser) {
              this.currentUser.set(updatedCurrentUser);
              localStorage.setItem('tipsy_currentUser', JSON.stringify(updatedCurrentUser));
          }
      }
  }

  login(email: string, password: string):boolean {
    const user = this.users().find(u => u.email === email && u.password === password);
    if (user) {
      this.currentUser.set(user);
      localStorage.setItem('tipsy_currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }
  
  register(email: string, password: string): User | null {
      if (this.users().some(u => u.email === email)) {
          return null; // User already exists
      }
      const newUser: User = {
          id: `u${this.users().length + 1}`,
          email,
          password,
          role: 'Employee',
          reputation: 1,
          anonymousId: `Employee #${Math.floor(10000 + Math.random() * 90000)}`
      };
      this.users.update(users => [...users, newUser]);
      this.saveUsersToStorage();
      this.login(email, password);
      return newUser;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('tipsy_currentUser');
  }
}
