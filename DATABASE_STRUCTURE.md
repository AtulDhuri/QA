# Multi-Tenant MongoDB Database Structure

## Overview
This database structure supports multiple admins, each with their own form and associated users. Each admin can create only one form, and users are linked to specific admins.

## Collections Structure

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'user']),
  adminId: ObjectId (ref: User, required for users only),
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features:**
- Admins don't have `adminId`
- Users must have `adminId` linking them to their admin
- Username is globally unique

### 2. Forms Collection
```javascript
{
  _id: ObjectId,
  title: String (default: 'Dynamic Form'),
  description: String,
  adminId: ObjectId (ref: User, required, unique),
  questions: [ObjectId] (ref: Question),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features:**
- Each admin can create only ONE form (unique index on adminId)
- Form contains references to questions
- Can be activated/deactivated

### 3. Questions Collection
```javascript
{
  _id: ObjectId,
  text: String (required),
  inputType: String (enum: ['text', 'number', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'rating']),
  options: [String], // For select, radio, checkbox
  required: Boolean (default: false),
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    min: Number,
    max: Number
  },
  order: Number (default: 0),
  isRemarkField: Boolean (default: false),
  formId: ObjectId (ref: Form, required),
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features:**
- Questions belong to specific forms
- Support various input types
- Validation rules per question

### 4. Responses Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  formId: ObjectId (ref: Form, required),
  adminId: ObjectId (ref: User, required),
  remarks: [{
    rating: Number (1-10),
    attendedBy: String,
    remark: String,
    createdAt: Date
  }],
  clientRating: Number (0-5), // Calculated average
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date,
  // Dynamic fields based on form questions
  [questionId]: Mixed // Actual form responses
}
```

**Key Features:**
- Responses linked to user, form, and admin
- Dynamic fields for form answers
- Remarks system with ratings
- Calculated client rating

## Data Relationships

```
Admin (User) 1:1 Form
Admin (User) 1:N Users
Form 1:N Questions
User N:N Responses (through Form)
Admin 1:N Responses (through Form)
```

## Access Control Logic

### Admin Access:
- Can create/edit questions in their form
- Can view all responses for their form
- Cannot see other admins' data

### User Access:
- Can only see their admin's form
- Can submit responses to their admin's form
- Can view/edit their own responses

## Database Indexes

```javascript
// Users
{ username: 1 } // unique
{ adminId: 1 }
{ role: 1 }

// Forms
{ adminId: 1 } // unique
{ isActive: 1 }

// Questions
{ formId: 1 }
{ order: 1 }

// Responses
{ userId: 1 }
{ formId: 1 }
{ adminId: 1 }
{ submittedAt: -1 }
```

## Sample Data Structure

### Sample Admin User:
```javascript
{
  _id: ObjectId("admin1_id"),
  username: "admin_company_a",
  password: "hashed_password",
  role: "admin",
  // No adminId for admins
}
```

### Sample Regular User:
```javascript
{
  _id: ObjectId("user1_id"),
  username: "john_doe",
  password: "hashed_password", 
  role: "user",
  adminId: ObjectId("admin1_id")
}
```

### Sample Form:
```javascript
{
  _id: ObjectId("form1_id"),
  title: "Company A Registration Form",
  description: "Please fill out your details",
  adminId: ObjectId("admin1_id"),
  questions: [ObjectId("q1_id"), ObjectId("q2_id")],
  isActive: true
}
```

### Sample Question:
```javascript
{
  _id: ObjectId("q1_id"),
  text: "Enter your Full Name",
  inputType: "text",
  required: true,
  validation: {
    minLength: 2,
    maxLength: 50
  },
  order: 1,
  formId: ObjectId("form1_id")
}
```

### Sample Response:
```javascript
{
  _id: ObjectId("response1_id"),
  userId: ObjectId("user1_id"),
  formId: ObjectId("form1_id"),
  adminId: ObjectId("admin1_id"),
  submittedAt: ISODate("2024-01-15T10:30:00Z"),
  clientRating: 4,
  remarks: [{
    rating: 8,
    attendedBy: "Support Team",
    remark: "Good response quality",
    createdAt: ISODate("2024-01-15T11:00:00Z")
  }],
  // Dynamic form fields
  "Enter your Full Name": "John Doe",
  "Mobile Number": "9876543210",
  "Email Address": "john@example.com",
  "Interested In": {
    "2BHK": true,
    "3BHK": false,
    "Villa": true
  }
}
```

## Migration Strategy

If migrating from existing single-tenant structure:

1. **Add adminId to existing users** (set to null for admins)
2. **Create Form documents** for each existing admin
3. **Update Questions** to reference formId
4. **Update Responses** to include formId and adminId
5. **Update application logic** to filter by tenant

## Security Considerations

1. **Data Isolation**: All queries must include tenant filtering
2. **Authentication**: JWT tokens include user role and adminId
3. **Authorization**: Middleware checks user access to resources
4. **API Endpoints**: All endpoints validate tenant access

## Performance Optimization

1. **Compound Indexes**: Create indexes on frequently queried combinations
2. **Data Partitioning**: Consider sharding by adminId for large datasets
3. **Caching**: Cache form structures per admin
4. **Aggregation**: Use MongoDB aggregation for complex reports