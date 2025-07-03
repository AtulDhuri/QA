# Dynamic Form MEAN Application

A MEAN stack application where admins can create dynamic forms with various input types, and users can fill out these forms.

## Features

- **Admin Panel**: Create questions with different input types (text, number, email, textarea, select, radio, checkbox)
- **User Panel**: Dynamic form generation based on admin-created questions
- **Authentication**: Role-based access (admin/user)
- **Data Storage**: User responses saved to MongoDB

## Setup Instructions

1. **Install Backend Dependencies**:
   ```bash
   npm install
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Build Angular Frontend**:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

4. **Start MongoDB**:
   Make sure MongoDB is running on localhost:27017

5. **Run the Application**:
   ```bash
   npm start
   ```

6. **Access the Application**:
   Open http://localhost:3000 in your browser

## Development Mode

For development with live reload:

1. **Start Backend**:
   ```bash
   npm start
   ```

2. **Start Angular Dev Server** (in another terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Access**: http://localhost:4200 (Angular dev server with proxy to backend)

## Usage

1. **Register**: Create an admin account (select "Admin" role)
2. **Admin Login**: Login with admin credentials
3. **Create Questions**: Add questions with various input types
4. **User Registration**: Register as a regular user
5. **Fill Forms**: Users can see and submit the dynamic form
6. **View Responses**: Admins can view all submitted responses with questions and answers

## Input Types Supported

- Text
- Number  
- Email
- Textarea
- Select (dropdown)
- Radio buttons
- Checkboxes

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)
- `POST /api/responses` - Submit form response
- `GET /api/responses` - Get all responses with questions and answers (admin)