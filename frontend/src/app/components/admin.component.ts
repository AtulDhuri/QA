import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="app-header">
      <div class="header-content">
        <a href="#" class="logo">CMS</a>
        <div class="user-info">
          <span>Admin Panel</span>
          <button class="btn btn-danger" (click)="logout()" style="margin-left: 1rem;">Logout</button>
        </div>
      </div>
    </div>
    
    <div class="container">
      <h1 class="page-title">Administration Dashboard</h1>
      <p class="page-subtitle">Manage your customer forms and view user responses</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{questions.length}}</div>
          <div class="stat-label">Total Questions</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{responses.length}}</div>
          <div class="stat-label">Total Responses</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{10 - questions.length}}</div>
          <div class="stat-label">Questions Remaining</div>
        </div>
      </div>
      
      <div class="nav-tabs">
        <button class="nav-tab" [class.active]="showSection === 'questions'" (click)="setSection('questions')">
          Manage Questions
        </button>
        <button class="nav-tab" [class.active]="showSection === 'responses'" (click)="setSection('responses')">
          View Responses
        </button>
        <button class="nav-tab" [class.active]="showSection === 'preview'" (click)="setSection('preview')" [disabled]="questions.length === 0">
          Preview Form
        </button>
        <button class="nav-tab" [class.active]="showSection === 'users'" (click)="setSection('users')">
          Manage Users
        </button>
      </div>

      <div *ngIf="showSection === 'questions'">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Add New Question</h2>
          </div>
          <div class="card-body">
            <div class="alert alert-info" *ngIf="questions.length >= 10">
              Maximum limit of 10 questions reached. Delete existing questions to add new ones.
            </div>
            <div class="alert alert-warning" *ngIf="questions.length >= 8 && questions.length < 10">
              You can add {{10 - questions.length}} more question(s).
            </div>
            
            <form [formGroup]="questionForm" (ngSubmit)="addQuestion()">
              <div class="form-grid">
                <div class="form-group">
                  <label>Question Text <span class="required">*</span></label>
                  <input type="text" formControlName="text" placeholder="Enter your question">
                  <div class="error" *ngIf="questionForm.get('text')?.invalid && questionForm.get('text')?.touched">
                    Question text is required
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Input Type <span class="required">*</span></label>
                  <select formControlName="inputType" (change)="onInputTypeChange()">
                    <option value="text">Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="email">Email Input</option>
                    <option value="phone">Phone Number</option>
                    <option value="textarea">Text Area</option>
                    <option value="select">Dropdown Select</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkboxes</option>
                  </select>
                </div>
                
                <div class="form-group full-width" *ngIf="showOptions">
                  <label>Options <span class="required">*</span></label>
                  <input type="text" formControlName="options" placeholder="Enter options separated by commas">
                  <small style="color: var(--text-secondary);">Example: Option 1, Option 2, Option 3</small>
                </div>
                
                <div class="form-group">
                  <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" formControlName="required" style="width: auto; margin: 0;">
                    Required Field
                  </label>
                </div>
              </div>
              
              <div *ngIf="showValidation" class="card" style="margin-top: 1.5rem;">
                <div class="card-header">
                  <h3 class="card-title">Validation Rules</h3>
                </div>
                <div class="card-body">
                  <div class="form-grid">
                    <div *ngIf="questionForm.get('inputType')?.value === 'email'" class="form-group">
                      <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" formControlName="emailValidation" style="width: auto; margin: 0;">
                        Email Format Validation
                      </label>
                    </div>
                    
                    <div *ngIf="['text', 'textarea', 'phone'].includes(questionForm.get('inputType')?.value)" class="form-group">
                      <label>Minimum Length</label>
                      <input type="number" formControlName="minLength" min="0" placeholder="0">
                    </div>
                    
                    <div *ngIf="['text', 'textarea', 'phone'].includes(questionForm.get('inputType')?.value)" class="form-group">
                      <label>Maximum Length</label>
                      <input type="number" formControlName="maxLength" min="1" placeholder="No limit">
                    </div>
                    
                    <div *ngIf="questionForm.get('inputType')?.value === 'number'" class="form-group">
                      <label>Minimum Value</label>
                      <input type="number" formControlName="minValue" placeholder="No minimum">
                    </div>
                    
                    <div *ngIf="questionForm.get('inputType')?.value === 'number'" class="form-group">
                      <label>Maximum Value</label>
                      <input type="number" formControlName="maxValue" placeholder="No maximum">
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="btn-group" style="margin-top: 2rem;">
                <button type="submit" class="btn btn-primary" [disabled]="questionForm.invalid || questions.length >= 10">
                  Add Question
                </button>
                <button type="button" class="btn btn-outline" (click)="resetForm()">
                  Reset Form
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Current Questions ({{questions.length}}/10)</h2>
          </div>
          <div class="card-body">
            <div *ngIf="questions.length === 0" class="alert alert-info">
              No questions created yet. Add your first question above.
            </div>
            
            <div *ngFor="let question of questions; trackBy: trackByFn" class="question-item">
              <div *ngIf="editingId !== question._id">
                <div class="question-header">
                  <div class="question-content">
                    <div class="question-title">{{question.text}}</div>
                    <div class="question-meta">
                      <span>Type: {{getInputTypeLabel(question.inputType)}}</span>
                      <span>Required: {{question.required ? 'Yes' : 'No'}}</span>
                    </div>
                    <div *ngIf="question.options?.length" style="margin-top: 0.5rem;">
                      <strong>Options:</strong> {{question.options.join(', ')}}
                    </div>
                    <div *ngIf="question.validation?.minLength || question.validation?.maxLength" style="margin-top: 0.5rem;">
                      <strong>Length:</strong> {{question.validation?.minLength || 0}} - {{question.validation?.maxLength || 'unlimited'}}
                    </div>
                  </div>
                  <div class="question-actions">
                    <button class="btn btn-secondary" (click)="editQuestion(question)" [disabled]="hasResponses">
                      {{hasResponses ? 'Locked' : 'Edit'}}
                    </button>
                    <button class="btn btn-danger" (click)="deleteQuestion(question._id)" [disabled]="hasResponses">
                      {{hasResponses ? 'Locked' : 'Delete'}}
                    </button>
                  </div>
                </div>
              </div>
              
              <div *ngIf="editingId === question._id">
                <form [formGroup]="editForm" (ngSubmit)="updateQuestion()">
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Question Text</label>
                      <input type="text" formControlName="text" placeholder="Question text">
                    </div>
                    <div class="form-group">
                      <label>Input Type</label>
                      <select formControlName="inputType" (change)="onEditInputTypeChange()">
                        <option value="text">Text Input</option>
                        <option value="number">Number Input</option>
                        <option value="email">Email Input</option>
                        <option value="phone">Phone Number</option>
                        <option value="textarea">Text Area</option>
                        <option value="select">Dropdown Select</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkboxes</option>
                      </select>
                    </div>
                    <div class="form-group full-width" *ngIf="showEditOptions">
                      <label>Options</label>
                      <input type="text" formControlName="options" placeholder="Options (comma separated)">
                    </div>
                    <div class="form-group" *ngIf="showEditValidation">
                      <label>Min Length</label>
                      <input type="number" formControlName="minLength" placeholder="Min Length" min="0">
                    </div>
                    <div class="form-group" *ngIf="showEditValidation">
                      <label>Max Length</label>
                      <input type="number" formControlName="maxLength" placeholder="Max Length" min="1">
                    </div>
                    <div class="form-group">
                      <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" formControlName="required" style="width: auto; margin: 0;">
                        Required
                      </label>
                    </div>
                  </div>
                  <div class="btn-group" style="margin-top: 1rem;">
                    <button type="submit" class="btn btn-success">Update Question</button>
                    <button type="button" class="btn btn-outline" (click)="cancelEdit()">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="showSection === 'responses'">
        <div class="card">
          <div class="card-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <h2 class="card-title">User Responses ({{filteredResponses.length}}/{{responses.length}})</h2>
              <div style="display: flex; gap: 1rem; align-items: center;">
                <label style="margin: 0; font-weight: normal;">Filter by Rating:</label>
                <select [(ngModel)]="ratingFilter" (change)="filterResponses()" style="width: auto; min-width: 120px;">
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                  <option value="0">No Rating</option>
                </select>
                <button class="btn btn-outline" (click)="searchByMobile()" style="white-space: nowrap;">Search by Mobile</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="responses.length === 0" class="alert alert-info">
              No responses submitted yet. Responses will appear here once users start submitting the form.
            </div>
            
            <div *ngIf="responses.length > 0 && filteredResponses.length === 0" class="alert alert-warning">
              No responses match the selected rating filter.
            </div>
            
            <div *ngFor="let response of filteredResponses; trackBy: trackByResponseFn" class="card" style="margin-bottom: 1.5rem;">
              <div class="card-header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h3 class="card-title">{{response.userId?.username || 'Anonymous User'}}</h3>
                  <span style="color: var(--text-secondary); font-size: 0.875rem;">
                    {{response.submittedAt | date:'medium'}}
                  </span>
                </div>
              </div>
              <div class="card-body">
                <div class="form-grid">
                  <div *ngFor="let field of getResponseFields(response)" class="form-group">
                    <label>{{field.key}}</label>
                    <div style="padding: 0.75rem; background: var(--background-color); border-radius: 6px; border: 1px solid var(--border-color);">
                      {{field.value}}
                    </div>
                  </div>
                </div>
                
                <div *ngIf="response.remarks && response.remarks.length > 0" class="remarks-section" style="margin-top: 1.5rem;">
                  <h4 class="remarks-title">Remarks History</h4>
                  <div *ngFor="let remark of response.remarks" class="remark-item">
                    <div class="remark-header">
                      <span><strong>{{remark.attendedBy}}</strong></span>
                      <span class="rating-badge">{{remark.rating}}/10</span>
                    </div>
                    <p>{{remark.remark}}</p>
                    <small style="color: var(--text-secondary);">{{remark.createdAt | date:'medium'}}</small>
                  </div>
                  <div *ngIf="response.clientRating !== undefined" style="margin-top: 1rem; text-align: center;">
                    <div class="stat-card" style="display: inline-block; min-width: 150px;">
                      <div class="stat-number">{{response.clientRating || 0}}/5</div>
                      <div class="stat-label">Client Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Preview Section -->
      <div *ngIf="showSection === 'preview'">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Form Preview</h2>
          </div>
          <div class="card-body">
            <div class="dynamic-form-container">
              <div class="form-sections">
                <div *ngFor="let question of questions; let i = index" class="question-card">
                  <div class="question-header">
                    <div class="question-number">{{i + 1}}</div>
                    <div class="question-content">
                      <h3 class="question-title">{{question.text}}</h3>
                      <span class="question-type">{{getInputTypeLabel(question.inputType)}}</span>
                      <span *ngIf="question.required" class="required-badge">Required</span>
                    </div>
                  </div>
                  
                  <div class="question-input">
                    <!-- Preview inputs (disabled) -->
                    <div *ngIf="['text', 'number', 'email', 'phone'].includes(question.inputType)" class="input-wrapper">
                      <input [type]="question.inputType === 'phone' ? 'tel' : question.inputType" 
                             [placeholder]="getPreviewPlaceholder(question)"
                             class="form-input" disabled>
                    </div>
                    
                    <div *ngIf="question.inputType === 'textarea'" class="textarea-wrapper">
                      <textarea [placeholder]="getPreviewPlaceholder(question)" class="form-textarea" disabled rows="4"></textarea>
                    </div>
                    
                    <div *ngIf="question.inputType === 'select'" class="select-wrapper">
                      <select class="form-select" disabled>
                        <option>Choose an option...</option>
                        <option *ngFor="let option of question.options">{{option}}</option>
                      </select>
                    </div>
                    
                    <div *ngIf="question.inputType === 'radio'" class="options-container">
                      <div class="options-grid radio-grid">
                        <div *ngFor="let option of question.options" class="option-item radio-option">
                          <input type="radio" disabled class="option-input">
                          <label class="option-label">
                            <span class="option-indicator"></span>
                            <span class="option-text">{{option}}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div *ngIf="question.inputType === 'checkbox'" class="options-container">
                      <div class="options-grid checkbox-grid">
                        <div *ngFor="let option of question.options" class="option-item checkbox-option">
                          <input type="checkbox" disabled class="option-input">
                          <label class="option-label">
                            <span class="option-indicator"></span>
                            <span class="option-text">{{option}}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- User Management Section -->
      <div *ngIf="showSection === 'users'">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Create New User</h2>
          </div>
          <div class="card-body">
            <form [formGroup]="userForm" (ngSubmit)="createUser()">
              <div class="form-grid">
                <div class="form-group">
                  <label>Username <span class="required">*</span></label>
                  <input type="text" formControlName="username" placeholder="Enter username">
                  <div class="error" *ngIf="userForm.get('username')?.invalid && userForm.get('username')?.touched">
                    Username is required
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Password <span class="required">*</span></label>
                  <input type="password" formControlName="password" placeholder="Enter password">
                  <div class="error" *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
                    Password is required
                  </div>
                </div>
              </div>
              
              <div class="btn-group" style="margin-top: 2rem;">
                <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
                  Create User
                </button>
                <button type="button" class="btn btn-outline" (click)="resetUserForm()">
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">My Users ({{users.length}})</h2>
          </div>
          <div class="card-body">
            <div *ngIf="users.length === 0" class="alert alert-info">
              No users created yet. Create your first user above.
            </div>
            
            <div *ngFor="let user of users" class="user-item">
              <div class="user-info">
                <div class="user-name">{{user.username}}</div>
                <div class="user-meta">
                  <span>Created: {{user.createdAt | date:'short'}}</span>
                </div>
              </div>
              <div class="user-actions">
                <button class="btn btn-danger btn-sm" (click)="deleteUser(user._id)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  questionForm: FormGroup;
  editForm: FormGroup;
  userForm: FormGroup;
  questions: any[] = [];
  responses: any[] = [];
  filteredResponses: any[] = [];
  users: any[] = [];
  ratingFilter: string = 'all';
  hasResponses = false;
  showOptions = false;
  showValidation = false;
  showEditOptions = false;
  showEditValidation = false;
  showSection = 'questions';
  editingId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private authService: AuthService,
    private router: Router
  ) {
    this.questionForm = this.fb.group({
      text: ['', Validators.required],
      inputType: ['text'],
      options: [''],
      required: [false],
      emailValidation: [false],
      minLength: [''],
      maxLength: [''],
      minValue: [''],
      maxValue: ['']
    });
    
    this.editForm = this.fb.group({
      text: ['', Validators.required],
      inputType: ['text'],
      options: [''],
      required: [false],
      minLength: [''],
      maxLength: ['']
    });
    
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.loadQuestions();
    this.loadResponses();
    this.loadUsers();
  }

  onInputTypeChange() {
    const inputType = this.questionForm.get('inputType')?.value;
    this.showOptions = ['select', 'radio', 'checkbox'].includes(inputType);
    this.showValidation = ['text', 'number', 'email', 'phone', 'textarea'].includes(inputType);
  }

  addQuestion() {
    if (this.questionForm.valid && this.questions.length < 10) {
      const formValue = this.questionForm.value;
      const validation: any = {};
      
      // Build validation object
      if (formValue.emailValidation && formValue.inputType === 'email') {
        validation.pattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
      }
      if (formValue.minLength) validation.minLength = parseInt(formValue.minLength);
      if (formValue.maxLength) validation.maxLength = parseInt(formValue.maxLength);
      if (formValue.minValue) validation.min = parseInt(formValue.minValue);
      if (formValue.maxValue) validation.max = parseInt(formValue.maxValue);
      
      const question = {
        text: formValue.text,
        inputType: formValue.inputType,
        options: formValue.options ? formValue.options.split(',').map((o: string) => o.trim()) : [],
        required: formValue.required,
        validation: validation
      };

      this.questionService.createQuestion(question).subscribe({
        next: () => {
          this.resetForm();
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error creating question:', error);
          alert(error.error?.error || 'Error creating question');
        }
      });
    }
  }
  
  resetForm() {
    this.questionForm.reset({ inputType: 'text', required: false });
    this.showOptions = false;
    this.showValidation = false;
  }
  
  getInputTypeLabel(inputType: string): string {
    const labels: {[key: string]: string} = {
      'text': 'Text Input',
      'number': 'Number Input', 
      'email': 'Email Input',
      'phone': 'Phone Number',
      'textarea': 'Text Area',
      'select': 'Dropdown Select',
      'radio': 'Radio Buttons',
      'checkbox': 'Checkboxes'
    };
    return labels[inputType] || inputType;
  }
  
  getPreviewPlaceholder(question: any): string {
    const placeholders: {[key: string]: string} = {
      'text': `Enter ${question.text.toLowerCase()}`,
      'number': 'Enter a number',
      'email': 'Enter your email address',
      'phone': 'Enter 10-digit mobile number',
      'textarea': `Provide details for ${question.text.toLowerCase()}`
    };
    return placeholders[question.inputType] || `Enter ${question.text.toLowerCase()}`;
  }
  
  loadUsers() {
    this.questionService.getAdminUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }
  
  createUser() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      this.questionService.createUser(userData).subscribe({
        next: () => {
          this.loadUsers();
          this.resetUserForm();
        },
        error: (error) => {
          console.error('Error creating user:', error);
        }
      });
    }
  }
  
  resetUserForm() {
    this.userForm.reset();
  }
  
  deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.questionService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  loadQuestions() {
    this.questionService.getQuestions().subscribe(questions => {
      this.questions = questions;
    });
  }

  deleteQuestion(id: string) {
    this.questionService.deleteQuestion(id).subscribe(() => {
      this.loadQuestions();
    });
  }

  setSection(section: string) {
    this.showSection = section;
    if (section === 'responses') {
      this.loadResponses();
    }
  }

  loadResponses() {
    console.log('Loading responses...');
    this.questionService.getResponses().subscribe({
      next: (responses) => {
        console.log('Responses loaded:', responses);
        this.responses = responses;
        this.hasResponses = responses.length > 0;
        this.filterResponses();
      },
      error: (error) => {
        console.error('Error loading responses:', error);
        this.responses = [];
        this.filteredResponses = [];
        this.hasResponses = false;
      }
    });
  }
  
  filterResponses() {
    if (this.ratingFilter === 'all') {
      this.filteredResponses = [...this.responses];
    } else if (this.ratingFilter === '0') {
      this.filteredResponses = this.responses.filter(r => !r.clientRating || r.clientRating === 0);
    } else {
      const rating = parseInt(this.ratingFilter);
      this.filteredResponses = this.responses.filter(r => r.clientRating === rating);
    }
  }
  
  searchByMobile() {
    this.router.navigate(['/search']);
  }

  trackByFn(index: number, item: any) {
    return item._id || index;
  }

  editQuestion(question: any) {
    this.editingId = question._id;
    this.editForm.patchValue({
      text: question.text,
      inputType: question.inputType,
      options: question.options?.join(', ') || '',
      required: question.required,
      minLength: question.validation?.minLength || '',
      maxLength: question.validation?.maxLength || ''
    });
    this.onEditInputTypeChange();
  }

  onEditInputTypeChange() {
    const inputType = this.editForm.get('inputType')?.value;
    this.showEditOptions = ['select', 'radio', 'checkbox'].includes(inputType);
    this.showEditValidation = ['text', 'number', 'email', 'phone', 'textarea'].includes(inputType);
  }

  updateQuestion() {
    if (this.editForm.valid && this.editingId) {
      const formValue = this.editForm.value;
      const validation: any = {};
      
      if (formValue.minLength) validation.minLength = parseInt(formValue.minLength);
      if (formValue.maxLength) validation.maxLength = parseInt(formValue.maxLength);
      
      const question = {
        text: formValue.text,
        inputType: formValue.inputType,
        options: formValue.options ? formValue.options.split(',').map((o: string) => o.trim()) : [],
        required: formValue.required,
        validation: validation
      };

      this.questionService.updateQuestion(this.editingId, question).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadQuestions();
        }
      });
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm.reset({ inputType: 'text', required: false });
    this.showEditOptions = false;
    this.showEditValidation = false;
  }

  getResponseFields(response: any): any[] {
    const fields = [];
    for (const [key, value] of Object.entries(response)) {
      if (key !== '_id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v' && key !== 'submittedAt' && key !== 'remarks' && key !== 'clientRating') {
        if (typeof value === 'object' && value !== null) {
          // For checkbox objects, show only selected values
          const selectedValues = Object.entries(value)
            .filter(([k, v]) => v === true)
            .map(([k, v]) => k);
          fields.push({ key, value: selectedValues.length > 0 ? selectedValues.join(', ') : 'None selected' });
        } else {
          fields.push({ key, value });
        }
      }
    }
    return fields;
  }

  trackByResponseFn(index: number, item: any) {
    return item._id || index;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}