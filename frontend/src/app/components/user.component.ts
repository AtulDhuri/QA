import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionService } from '../services/question.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="app-header">
      <div class="header-content">
        <a href="#" class="logo">CMS</a>
        <div class="user-info">
          <span>{{isEditMode ? 'Update Response' : 'User Portal'}}</span>
          <button class="btn btn-outline" (click)="goToSearch()" style="margin-right: 0.5rem;">Search Responses</button>
          <button class="btn btn-danger" (click)="logout()">Logout</button>
        </div>
      </div>
    </div>
    
    <div class="container">
      <h1 class="page-title">{{isEditMode ? 'Update Your Response' : 'Customer Form'}}</h1>
      <p class="page-subtitle" *ngIf="questions.length > 0">
        {{isEditMode ? 'Make changes to your previous submission' : 'Please fill out all required fields below'}}
      </p>
      
      <div class="alert alert-info" *ngIf="questions.length === 0">
        No questions are available at this time. Please check back later or contact your administrator.
      </div>
      
      <form [formGroup]="dynamicForm" (ngSubmit)="submitForm()" *ngIf="questions.length > 0">
        <div class="dynamic-form-container">
          <div class="form-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="getFormProgress()"></div>
            </div>
            <span class="progress-text">{{getCompletedFields()}}/{{questions.length}} completed</span>
          </div>
          
          <div class="form-sections">
            <div *ngFor="let question of questions; let i = index" 
                 class="question-card" 
                 [class]="getQuestionCardClass(question)"
                 [attr.data-question-type]="question.inputType">
              
              <div class="question-header">
                <div class="question-number">{{i + 1}}</div>
                <div class="question-content">
                  <h3 class="question-title">{{question.text}}</h3>
                  <span class="question-type">{{getInputTypeLabel(question.inputType)}}</span>
                  <span *ngIf="question.required" class="required-badge">Required</span>
                </div>
              </div>
              
              <div class="question-input">
                <!-- Single Line Inputs -->
                <div *ngIf="['text', 'number', 'email', 'phone'].includes(question.inputType)" class="input-wrapper">
                  <input
                    [type]="question.inputType === 'phone' ? 'text' : getInputType(question.inputType)"
                    [formControlName]="question._id"
                    (blur)="markFieldTouched(question._id)"
                    (input)="question.inputType === 'phone' ? onPhoneInput($event, question._id) : null"
                    [placeholder]="getPlaceholder(question)"
                    [maxlength]="question.inputType === 'phone' ? '10' : null"
                    class="form-input"
                    autocomplete="off"
                  />
                  <div *ngIf="question.inputType !== 'phone'" class="input-icon" [class]="'icon-' + question.inputType"></div>
                </div>
                
                <!-- Textarea -->
                <div *ngIf="question.inputType === 'textarea'" class="textarea-wrapper">
                  <textarea [formControlName]="question._id" 
                            (blur)="markFieldTouched(question._id)"
                            [placeholder]="getPlaceholder(question)"
                            class="form-textarea"
                            rows="4"></textarea>
                </div>
                
                <!-- Select Dropdown -->
                <div *ngIf="question.inputType === 'select'" class="select-wrapper">
                  <select [formControlName]="question._id" class="form-select">
                    <option value="">Choose an option...</option>
                    <option *ngFor="let option of question.options" [value]="option">{{option}}</option>
                  </select>
                  <div class="select-arrow"></div>
                </div>
                
                <!-- Radio Buttons -->
                <div *ngIf="question.inputType === 'radio'" class="options-container">
                  <div class="options-grid radio-grid">
                    <div *ngFor="let option of question.options; let j = index" class="option-item radio-option">
                      <input type="radio" 
                             [value]="option" 
                             [formControlName]="question._id" 
                             [id]="question._id + '_radio_' + j"
                             class="option-input">
                      <label [for]="question._id + '_radio_' + j" class="option-label">
                        <span class="option-indicator"></span>
                        <span class="option-text">{{option}}</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <!-- Checkboxes -->
                <div *ngIf="question.inputType === 'checkbox'" [formArrayName]="question._id" class="options-container">
                  <div class="options-grid checkbox-grid">
                    <div *ngFor="let option of question.options; let j = index" class="option-item checkbox-option">
                      <input type="checkbox" 
                             [formControlName]="j" 
                             [id]="question._id + '_check_' + j"
                             class="option-input">
                      <label [for]="question._id + '_check_' + j" class="option-label">
                        <span class="option-indicator"></span>
                        <span class="option-text">{{option}}</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <!-- Error Message -->
                <div *ngIf="getFieldError(question._id)" class="field-error">
                  <span class="error-icon">⚠</span>
                  {{getFieldError(question._id)}}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Remarks Section -->
        <div class="remarks-section">
          <h3 class="remarks-title">Add Remarks</h3>
          <div formGroupName="remarksGroup">
            <div class="form-grid">
              <div class="form-group">
                <label>Rating (1-10) <span class="required">*</span></label>
                <input type="number" formControlName="rating" min="1" max="10" placeholder="Rate from 1 to 10">
                <div *ngIf="remarksForm.get('rating')?.invalid && remarksForm.get('rating')?.touched" class="error">
                  Rating must be between 1 and 10
                </div>
              </div>
              
              <div class="form-group">
                <label>Attended By <span class="required">*</span></label>
                <input type="text" formControlName="attendedBy" placeholder="Enter staff member name">
                <div *ngIf="remarksForm.get('attendedBy')?.invalid && remarksForm.get('attendedBy')?.touched" class="error">
                  Attended By is required
                </div>
              </div>
              
              <div class="form-group full-width">
                <label>Remark <span class="required">*</span></label>
                <textarea formControlName="remark" rows="4" placeholder="Enter your feedback or comments"></textarea>
                <div *ngIf="remarksForm.get('remark')?.invalid && remarksForm.get('remark')?.touched" class="error">
                  Remark is required
                </div>
              </div>
            </div>
          </div>
          
          <!-- Previous Remarks (only in edit mode) -->
          <div *ngIf="isEditMode && previousRemarks.length > 0" class="previous-remarks">
            <h4 class="remarks-title">Previous Remarks</h4>
            <div *ngFor="let remark of previousRemarks" class="remark-item">
              <div class="remark-header">
                <span><strong>{{remark.attendedBy}}</strong></span>
                <span class="rating-badge">{{remark.rating}}/10</span>
              </div>
              <p>{{remark.remark}}</p>
              <small style="color: var(--text-secondary);">{{remark.createdAt | date:'medium'}}</small>
            </div>
          </div>
        </div>
        
        <div class="alert alert-success" *ngIf="successMessage">
          {{successMessage}}
        </div>
        
        <div class="btn-group" style="margin-top: 2rem;">
          <button type="submit" class="btn btn-primary" [disabled]="dynamicForm.invalid">
            {{isEditMode ? 'Update Response' : 'Submit Response'}}
          </button>
          <button *ngIf="isEditMode" type="button" class="btn btn-outline" (click)="cancelEdit()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `
})
export class UserComponent implements OnInit {
  dynamicForm: FormGroup = this.fb.group({});
  questions: any[] = [];
  successMessage = '';
  isEditMode = false;
  editResponseData: any = null;
  originalMobileValue: string = '';
  previousRemarks: any[] = [];
  
  // Getter for remarks form
  get remarksForm(): FormGroup {
    return this.dynamicForm.get('remarksGroup') as FormGroup;
  }

  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadQuestions();
    this.checkForEditMode();
  }

  loadQuestions() {
    this.questionService.getUserQuestions().subscribe(questions => {
      this.questions = questions;
      this.buildForm();
    });
  }

  buildForm() {
    const formControls: any = {};
    
    this.questions.forEach(question => {
      console.log('Building form for question:', question.text, 'Type:', question.inputType, 'Validation:', question.validation);
      
      if (question.inputType === 'checkbox') {
        const checkboxArray = this.fb.array(
          question.options.map(() => this.fb.control(false))
        );
        formControls[question._id] = checkboxArray;
      } else {
        const validators = [];
        
        // Required validation
        if (question.required) {
          validators.push(Validators.required);
        }
        
        // Email validation by default
        if (question.inputType === 'email') {
          validators.push(Validators.email);
        }
        
        // Phone validation - improved for mobile numbers
        if (question.inputType === 'phone') {
          validators.push(Validators.minLength(10)); // Minimum 10 digits
          validators.push(Validators.maxLength(10)); // Maximum 10 digits for mobile
          validators.push(Validators.pattern('^[6-9][0-9]{9}$')); // Indian mobile pattern
          console.log('Applied phone validation: exactly 10 digits, starts with 6-9');
        }
        
        // Custom validations based on question settings
        if (question.validation) {
          if (question.validation.pattern && question.inputType !== 'phone') {
            validators.push(Validators.pattern(question.validation.pattern));
          }
          if (question.validation.minLength && question.inputType !== 'phone') {
            validators.push(Validators.minLength(question.validation.minLength));
          }
          if (question.validation.maxLength && question.inputType !== 'phone') {
            validators.push(Validators.maxLength(question.validation.maxLength));
          }
          if (question.validation.min !== undefined) {
            validators.push(Validators.min(question.validation.min));
          }
          if (question.validation.max !== undefined) {
            validators.push(Validators.max(question.validation.max));
          }
        }
        
        console.log('Validators for', question.text, ':', validators);
        formControls[question._id] = ['', validators];
      }
    });
    
    // Add remarks group for all forms
    formControls.remarksGroup = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(10)]],
      attendedBy: ['', Validators.required],
      remark: ['', Validators.required]
    });
    
    this.dynamicForm = this.fb.group(formControls);
    
    // If in edit mode, populate the form with the response data
    if (this.isEditMode && this.editResponseData) {
      this.populateFormWithResponseData();
    }
  }

  markFieldTouched(fieldId: string) {
    const field = this.dynamicForm.get(fieldId);
    field?.markAsTouched();
    if (fieldId.includes('phone') || this.questions.find(q => q._id === fieldId)?.inputType === 'phone') {
      console.log('Phone field touched:', fieldId, 'Value:', field?.value, 'Errors:', field?.errors, 'Valid:', field?.valid);
    }
  }
  
  onPhoneInput(event: any, fieldId: string) {
    const value = event.target.value;
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits
    if (numericValue.length <= 10) {
      this.dynamicForm.get(fieldId)?.setValue(numericValue);
    }
    
    this.markFieldTouched(fieldId);
  }

  getFieldError(fieldId: string): string {
    const field = this.dynamicForm.get(fieldId);
    const question = this.questions.find(q => q._id === fieldId);
    
    if (field && field.invalid && (field.touched || field.dirty)) {
      if (field.errors?.['required']) return 'This field is required';
      if (field.errors?.['email']) return 'Please enter a valid email address';
      if (field.errors?.['pattern']) {
        if (question?.inputType === 'email') return 'Please enter a valid email address';
        if (question?.inputType === 'phone') return 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
        return 'Invalid format';
      }
      if (field.errors?.['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        const actualLength = field.errors['minlength'].actualLength;
        if (question?.inputType === 'phone') {
          return `Mobile number must be exactly ${requiredLength} digits (entered ${actualLength})`;
        }
        return `Minimum ${requiredLength} characters required`;
      }
      if (field.errors?.['maxlength']) {
        const requiredLength = field.errors['maxlength'].requiredLength;
        if (question?.inputType === 'phone') {
          return `Mobile number must be exactly ${requiredLength} digits`;
        }
        return `Maximum ${requiredLength} characters allowed`;
      }
      if (field.errors?.['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors?.['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }

  submitForm() {
    if (this.dynamicForm.invalid) {
      Object.keys(this.dynamicForm.controls).forEach(key => {
        this.dynamicForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Start with a copy of the original response data if in edit mode
    const responseData: any = this.isEditMode ? {...this.editResponseData} : {};
    
    // If not in edit mode, add user ID and timestamp
    if (!this.isEditMode) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      responseData.userId = currentUser.userId;
      responseData.submittedAt = new Date();
      responseData.remarks = [];
    }
    
    // Add new remark
    if (this.remarksForm.valid) {
      const newRemark = {
        ...this.remarksForm.value,
        createdAt: new Date()
      };
      
      // Initialize remarks array if it doesn't exist
      if (!responseData.remarks) {
        responseData.remarks = [];
      }
      
      // Add the new remark
      responseData.remarks.push(newRemark);
      
      // Calculate and update client rating (average of all ratings, converted to 5-point scale)
      this.calculateClientRating(responseData);
    }
    
    // Update with form values
    this.questions.forEach(question => {
      const control = this.dynamicForm.get(question._id);
      
      // Skip disabled controls (mobile field) - keep original value
      if (control?.disabled) return;
      
      if (question.inputType === 'checkbox') {
        const selectedOptions: any = {};
        question.options.forEach((option: string, index: number) => {
          selectedOptions[option] = control?.value[index] || false;
        });
        responseData[question.text] = selectedOptions;
      } else {
        responseData[question.text] = control?.value;
      }
    });

    console.log('Submitting response data:', responseData);
    
    const submitObservable = this.isEditMode ? 
      this.questionService.updateResponse(responseData._id, responseData) : 
      this.questionService.submitResponse(responseData);
    
    submitObservable.subscribe({
      next: (result) => {
        console.log('Response submitted successfully:', result);
        this.successMessage = this.isEditMode ? 'Response updated successfully!' : 'Response submitted successfully!';
        
        if (this.isEditMode) {
          // Clear edit mode
          localStorage.removeItem('editResponse');
          this.isEditMode = false;
          this.editResponseData = null;
        }
        
        this.dynamicForm.reset();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        this.successMessage = 'Error submitting response';
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  goToSearch() {
    this.router.navigate(['/search']);
  }
  
  getQuestionCardClass(question: any): string {
    const baseClass = 'question-card';
    const typeClass = `question-${question.inputType}`;
    const statusClass = this.dynamicForm.get(question._id)?.valid ? 'completed' : 'pending';
    return `${baseClass} ${typeClass} ${statusClass}`;
  }
  
  getInputTypeLabel(inputType: string): string {
    const labels: {[key: string]: string} = {
      'text': 'Text Input',
      'number': 'Number',
      'email': 'Email Address',
      'phone': 'Mobile Number',
      'textarea': 'Long Text',
      'select': 'Single Choice',
      'radio': 'Single Selection',
      'checkbox': 'Multiple Selection'
    };
    return labels[inputType] || inputType;
  }
  
  getInputType(questionType: string): string {
    return questionType === 'phone' ? 'tel' : questionType;
  }
  
  getPlaceholder(question: any): string {
    const placeholders: {[key: string]: string} = {
      'text': `Enter ${question.text.toLowerCase()}`,
      'number': 'Enter a number',
      'email': 'Enter your email address',
      'phone': 'Enter 10-digit mobile number',
      'textarea': `Provide details for ${question.text.toLowerCase()}`
    };
    return placeholders[question.inputType] || `Enter ${question.text.toLowerCase()}`;
  }
  
  getFormProgress(): number {
    const totalFields = this.questions.length;
    const completedFields = this.getCompletedFields();
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }
  
  getCompletedFields(): number {
    return this.questions.filter(q => {
      const control = this.dynamicForm.get(q._id);
      return control && control.valid && control.value;
    }).length;
  }
  
  checkForEditMode() {
    const editResponseStr = localStorage.getItem('editResponse');
    if (editResponseStr) {
      try {
        this.editResponseData = JSON.parse(editResponseStr);
        this.isEditMode = true;
        console.log('Edit mode activated with data:', this.editResponseData);
      } catch (e) {
        console.error('Error parsing edit response data:', e);
        localStorage.removeItem('editResponse');
      }
    }
  }
  
  populateFormWithResponseData() {
    if (!this.editResponseData || !this.questions.length) return;
    
    // Find mobile field first to store its value
    const mobileField = this.questions.find(q => 
      q.inputType === 'phone' || 
      q.text === 'Mobile' || 
      q.text.toLowerCase().includes('mobile')
    );
    
    if (mobileField && this.editResponseData[mobileField.text]) {
      this.originalMobileValue = this.editResponseData[mobileField.text].toString();
    }
    
    // Load previous remarks if available
    if (this.editResponseData.remarks && Array.isArray(this.editResponseData.remarks)) {
      this.previousRemarks = [...this.editResponseData.remarks];
    }
    
    // Calculate client rating if not already set
    if (this.previousRemarks.length > 0 && !this.editResponseData.clientRating) {
      this.calculateClientRating();
    }
    
    // Populate all fields
    this.questions.forEach(question => {
      const value = this.editResponseData[question.text];
      if (value === undefined) return;
      
      // For mobile field, disable it
      if (question === mobileField || 
          (question.text === 'Mobile') || 
          (question.inputType === 'phone' && this.isEditMode)) {
        const control = this.dynamicForm.get(question._id);
        if (control) {
          control.setValue(value);
          control.disable();
        }
        return;
      }
      
      // For other fields
      if (question.inputType === 'checkbox' && Array.isArray(question.options)) {
        const checkboxArray = this.dynamicForm.get(question._id) as FormArray;
        if (checkboxArray) {
          if (typeof value === 'object') {
            question.options.forEach((option: string, index: number) => {
              checkboxArray.at(index).setValue(value[option] || false);
            });
          } else if (typeof value === 'string') {
            const selectedValues = value.split(',').map(v => v.trim());
            question.options.forEach((option: string, index: number) => {
              checkboxArray.at(index).setValue(selectedValues.includes(option));
            });
          }
        }
      } else {
        this.dynamicForm.get(question._id)?.setValue(value);
      }
    });
  }
  
  // Helper method to check if a field is the mobile field
  isMobileField(question: any): boolean {
    return question.inputType === 'phone' || 
           question.text === 'Mobile' || 
           question.text.toLowerCase().includes('mobile');
  }
  
  // Calculate client rating (average of all ratings, converted to 5-point scale)
  calculateClientRating(responseData?: any) {
    const data = responseData || this.editResponseData;
    if (!data || !data.remarks || !data.remarks.length) return;
    
    // Calculate average rating (out of 10)
    const totalRating = data.remarks.reduce((sum: number, remark: any) => sum + remark.rating, 0);
    const averageRating = totalRating / data.remarks.length;
    
    // Convert to 5-point scale and round to whole number
    const clientRating = Math.min(5, Math.round((averageRating / 10) * 5));
    
    // Set the client rating
    data.clientRating = clientRating;
    
    console.log(`Calculated client rating: ${data.clientRating}/5 from ${data.remarks.length} remarks`);
  }
  
  cancelEdit() {
    localStorage.removeItem('editResponse');
    this.isEditMode = false;
    this.editResponseData = null;
    this.originalMobileValue = '';
    this.previousRemarks = [];
    this.dynamicForm.reset();
    this.router.navigate(['/search']);
  }
}