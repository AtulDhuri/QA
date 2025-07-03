import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">{{ isRegister ? 'Create Account' : 'Welcome Back' }}</h1>
        <p class="page-subtitle" style="text-align: center; margin-bottom: 2rem;">
          {{ isRegister ? 'Join our platform today' : 'Sign in to your account' }}
        </p>
        
        <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Username <span class="required">*</span></label>
            <input type="text" formControlName="username" placeholder="Enter your username">
            <div class="error" *ngIf="authForm.get('username')?.invalid && authForm.get('username')?.touched">
              Username is required
            </div>
          </div>
          
          <div class="form-group">
            <label>Password <span class="required">*</span></label>
            <input type="password" formControlName="password" placeholder="Enter your password">
            <div class="error" *ngIf="authForm.get('password')?.invalid && authForm.get('password')?.touched">
              Password is required
            </div>
          </div>
          
          <div class="form-group" *ngIf="isRegister">
            <label>Role <span class="required">*</span></label>
            <select formControlName="role">
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          <div class="alert alert-error" *ngIf="error">
            {{ error }}
          </div>
          
          <div class="btn-group" style="margin-top: 2rem;">
            <button type="submit" class="btn btn-primary" [disabled]="authForm.invalid">
              {{ isRegister ? 'Create Account' : 'Sign In' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="toggleMode()">
              {{ isRegister ? 'Back to Login' : 'Create Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  authForm: FormGroup;
  isRegister = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['user']
    });
  }

  onSubmit() {
    if (this.authForm.valid) {
      const { username, password, role } = this.authForm.value;
      
      if (this.isRegister) {
        this.authService.register(username, password, role).subscribe({
          next: () => {
            this.isRegister = false;
            this.error = '';
          },
          error: (err) => this.error = err.error.error
        });
      } else {
        this.authService.login(username, password).subscribe({
          next: (user) => {
            this.authService.setCurrentUser(user);
            this.router.navigate([user.role === 'admin' ? '/admin' : '/user']);
          },
          error: (err) => this.error = err.error.error
        });
      }
    }
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
  }
}