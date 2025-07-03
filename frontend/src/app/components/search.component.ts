import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="app-header">
      <div class="header-content">
        <a href="#" class="logo">CMS</a>
        <div class="user-info">
          <span>Search Portal</span>
          <button class="btn btn-outline" (click)="goToUserForm()" style="margin-right: 0.5rem;">Back to Form</button>
          <button class="btn btn-danger" (click)="logout()">Logout</button>
        </div>
      </div>
    </div>
    
    <div class="container">
      <h1 class="page-title">Search Response</h1>
      <p class="page-subtitle">Find and edit your previous form submissions using your mobile number</p>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Search by Mobile Number</h2>
        </div>
        <div class="card-body">
          <div class="search-tabs">
            <button class="nav-tab" [class.active]="searchType === 'mobile'" (click)="setSearchType('mobile')">
              Search by Mobile
            </button>
            <button class="nav-tab" [class.active]="searchType === 'name'" (click)="setSearchType('name')">
              Search by Name
            </button>
            <button class="nav-tab" [class.active]="searchType === 'filter'" (click)="setSearchType('filter')">
              Advanced Filter
            </button>
          </div>
          
          <!-- Mobile Search -->
          <form *ngIf="searchType === 'mobile'" [formGroup]="searchForm" (ngSubmit)="searchByMobile()">
            <div class="form-group">
              <label>Mobile Number <span class="required">*</span></label>
              <input type="tel" 
                     formControlName="mobile" 
                     placeholder="Enter 10-digit mobile number"
                     maxlength="10"
                     (input)="onMobileInput($event)">
              <div class="error" *ngIf="searchForm.get('mobile')?.invalid && searchForm.get('mobile')?.touched">
                Please enter a valid 10-digit mobile number
              </div>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="searchForm.invalid || searching">
              {{searching ? 'Searching...' : 'Search by Mobile'}}
            </button>
          </form>
          
          <!-- Name Search -->
          <form *ngIf="searchType === 'name'" [formGroup]="nameForm" (ngSubmit)="searchByName()">
            <div class="form-group">
              <label>Name <span class="required">*</span></label>
              <input type="text" 
                     formControlName="name" 
                     placeholder="Enter name to search">
              <div class="error" *ngIf="nameForm.get('name')?.invalid && nameForm.get('name')?.touched">
                Name is required
              </div>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="nameForm.invalid || searching">
              {{searching ? 'Searching...' : 'Search by Name'}}
            </button>
          </form>
          
          <!-- Advanced Filter -->
          <div *ngIf="searchType === 'filter'" class="filter-section">
            <div class="form-grid">
              <div class="form-group">
                <label>Filter by Field</label>
                <select [(ngModel)]="selectedField">
                  <option value="">Select a field...</option>
                  <option *ngFor="let field of availableFields" [value]="field">{{field}}</option>
                </select>
              </div>
              <div class="form-group" *ngIf="selectedField">
                <label>Search Value</label>
                <input type="text" [(ngModel)]="searchValue" placeholder="Enter value to search">
              </div>
            </div>
            <button class="btn btn-primary" (click)="searchByFilter()" [disabled]="!selectedField || !searchValue || searching">
              {{searching ? 'Searching...' : 'Search'}}
            </button>
          </div>
        </div>
      </div>
      
      <div class="alert alert-error" *ngIf="error">
        {{error}}
      </div>
      
      <div *ngIf="responses.length > 0" class="card">
        <div class="card-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 class="card-title">Found {{responses.length}} Response(s)</h2>
            <div class="btn-group">
              <button class="btn btn-outline" [class.active]="viewMode === 'table'" (click)="setViewMode('table')">
                Table View
              </button>
              <button class="btn btn-outline" [class.active]="viewMode === 'cards'" (click)="setViewMode('cards')">
                Card View
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <!-- Table View -->
          <div *ngIf="viewMode === 'table'" class="table-container">
            <table class="response-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Rating</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let response of responses" (click)="viewDetails(response)" class="table-row">
                  <td>{{getFieldValue(response, 'Enter your Full Name') || 'N/A'}}</td>
                  <td>{{getFieldValue(response, 'Mobile') || getFieldValue(response, 'Phone') || 'N/A'}}</td>
                  <td>{{getFieldValue(response, 'Email') || 'N/A'}}</td>
                  <td>
                    <span *ngIf="response.clientRating" class="rating-badge">{{response.clientRating}}/5</span>
                    <span *ngIf="!response.clientRating">No Rating</span>
                  </td>
                  <td>{{response.submittedAt | date:'short'}}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" (click)="editResponse(response); $event.stopPropagation()">
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Card View -->
          <div *ngIf="viewMode === 'cards'">
            <div *ngFor="let response of responses" class="card" style="margin-bottom: 1.5rem;">
              <div class="card-header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h3 class="card-title">{{getFieldValue(response, 'Name') || 'User Response'}}</h3>
                  <div style="text-align: right;">
                    <div style="color: var(--text-secondary); font-size: 0.875rem;">
                      {{response.submittedAt | date:'medium'}}
                    </div>
                    <div *ngIf="response.clientRating !== undefined" class="rating-badge" style="margin-top: 0.5rem;">
                      {{response.clientRating}}/5 Rating
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="form-grid">
                  <div *ngFor="let key of getResponseKeys(response)" class="form-group">
                    <label>{{key}}</label>
                    <div style="padding: 0.75rem; background: var(--background-color); border-radius: 6px; border: 1px solid var(--border-color);">
                      {{getDisplayValue(response[key])}}
                    </div>
                  </div>
                </div>
                
                <div *ngIf="response.remarks?.length" class="remarks-section" style="margin-top: 1.5rem;">
                  <h4 class="remarks-title">Remarks ({{response.remarks.length}})</h4>
                  <div *ngFor="let remark of response.remarks" class="remark-item">
                    <div class="remark-header">
                      <span><strong>{{remark.attendedBy}}</strong></span>
                      <span class="rating-badge">{{remark.rating}}/10</span>
                    </div>
                    <p>{{remark.remark}}</p>
                    <small style="color: var(--text-secondary);">{{remark.createdAt | date:'medium'}}</small>
                  </div>
                </div>
                
                <div class="btn-group" style="margin-top: 1.5rem;">
                  <button class="btn btn-primary" (click)="editResponse(response)">
                    Edit Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Detailed View Modal -->
      <div *ngIf="selectedResponse" class="modal-overlay" (click)="closeDetails()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Response Details</h2>
            <button class="btn btn-outline" (click)="closeDetails()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div *ngFor="let key of getResponseKeys(selectedResponse)" class="form-group">
                <label>{{key}}</label>
                <div class="detail-value">{{getDisplayValue(selectedResponse[key])}}</div>
              </div>
            </div>
            
            <div *ngIf="selectedResponse.remarks?.length" class="remarks-section">
              <h3>Remarks History</h3>
              <div *ngFor="let remark of selectedResponse.remarks" class="remark-item">
                <div class="remark-header">
                  <span><strong>{{remark.attendedBy}}</strong></span>
                  <span class="rating-badge">{{remark.rating}}/10</span>
                </div>
                <p>{{remark.remark}}</p>
                <small>{{remark.createdAt | date:'medium'}}</small>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" (click)="editResponse(selectedResponse)">
              Edit Response
            </button>
            <button class="btn btn-outline" (click)="closeDetails()">
              Close
            </button>
          </div>
        </div>
      </div>
      
      <div *ngIf="searched && responses.length === 0 && !error" class="alert alert-info">
        No responses found for this mobile number. You may not have submitted any forms yet.
      </div>
    </div>
  `
})
export class SearchComponent {
  searchForm: FormGroup;
  nameForm: FormGroup;
  responses: any[] = [];
  allResponses: any[] = [];
  searching = false;
  searched = false;
  error = '';
  searchType = 'mobile';
  viewMode = 'table';
  selectedResponse: any = null;
  availableFields: string[] = [];
  selectedField = '';
  searchValue = '';

  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private authService: AuthService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]]
    });
    
    this.nameForm = this.fb.group({
      name: ['', Validators.required]
    });
    
    this.loadAllResponses();
  }
  
  onMobileInput(event: any) {
    const value = event.target.value;
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits
    if (numericValue.length <= 10) {
      this.searchForm.get('mobile')?.setValue(numericValue);
    }
  }
  
  goToUserForm() {
    this.router.navigate(['/user']);
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  setSearchType(type: string) {
    this.searchType = type;
    this.responses = [];
    this.searched = false;
    this.error = '';
    this.searchValue = '';
  }
  
  setViewMode(mode: string) {
    this.viewMode = mode;
  }
  
  searchByName() {
    if (this.nameForm.valid) {
      const name = this.nameForm.get('name')?.value;
      this.searching = true;
      this.error = '';
      
      this.questionService.getResponsesByName(name).subscribe({
        next: (responses) => {
          this.responses = responses || [];
          this.searching = false;
          this.searched = true;
        },
        error: (error) => {
          this.error = `Error: ${error.error?.error || 'Search failed'}`;
          this.searching = false;
          this.searched = true;
        }
      });
    }
  }
  
  loadAllResponses() {
    this.questionService.getResponses().subscribe({
      next: (responses) => {
        this.allResponses = responses;
        this.extractAvailableFields();
      },
      error: (error) => console.error('Error loading responses:', error)
    });
  }
  
  extractAvailableFields() {
    const fields = new Set<string>();
    this.allResponses.forEach(response => {
      Object.keys(response).forEach(key => {
        if (!['_id', '__v', 'userId', 'createdAt', 'updatedAt', 'submittedAt', 'remarks', 'clientRating'].includes(key)) {
          fields.add(key);
        }
      });
    });
    this.availableFields = Array.from(fields);
  }
  
  searchByFilter() {
    if (this.selectedField && this.searchValue) {
      this.searching = true;
      this.error = '';
      
      this.questionService.getResponsesByFieldValue(this.selectedField, this.searchValue).subscribe({
        next: (responses) => {
          this.responses = responses || [];
          this.searching = false;
          this.searched = true;
        },
        error: (error) => {
          this.error = `Error: ${error.error?.error || 'Search failed'}`;
          this.searching = false;
          this.searched = true;
        }
      });
    }
  }
  
  getFieldValue(response: any, fieldName: string): string {
    return response[fieldName] || '';
  }
  
  viewDetails(response: any) {
    this.selectedResponse = response;
  }
  
  closeDetails() {
    this.selectedResponse = null;
  }

  searchByMobile() {
    if (this.searchForm.valid) {
      const mobile = this.searchForm.get('mobile')?.value;
      console.log('Searching for mobile:', mobile);
      this.searching = true;
      this.error = '';
      this.responses = [];
      
      this.questionService.getResponsesByMobile(mobile).subscribe({
        next: (responses) => {
          console.log('Search results:', responses);
          this.responses = responses || [];
          this.searching = false;
          this.searched = true;
        },
        error: (error) => {
          console.error('Search error:', error);
          if (error.error && typeof error.error === 'string' && error.error.includes('<!doctype')) {
            this.error = 'Server error: API endpoint not found';
          } else {
            this.error = `Error: ${error.error?.error || error.message || 'Search failed'}`;
          }
          this.searching = false;
          this.searched = true;
        }
      });
    } else {
      this.error = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
    }
  }
  
  getResponseKeys(response: any): string[] {
    return Object.keys(response).filter(key => 
      key !== '_id' && key !== '__v' && key !== 'userId' && 
      key !== 'createdAt' && key !== 'updatedAt' && key !== 'remarks' &&
      key !== 'clientRating' && key !== 'submittedAt' && typeof response[key] !== 'function'
    );
  }
  
  getDisplayValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && !Array.isArray(value)) {
      // For checkbox objects, show only selected values
      const selectedValues = Object.entries(value)
        .filter(([k, v]) => v === true)
        .map(([k, v]) => k);
      return selectedValues.length > 0 ? selectedValues.join(', ') : 'None selected';
    }
    return value.toString();
  }
  
  editResponse(response: any) {
    // Store the response in localStorage for the user component to access
    localStorage.setItem('editResponse', JSON.stringify(response));
    this.router.navigate(['/user']);
  }
}