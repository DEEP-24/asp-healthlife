# Application Route Structure

## Root Routes (`/app/routes/`)

### User/Patient Routes (`_app+/`)
Main routes for authenticated users/patients:

- `_index.tsx` - Root redirect to /bmi
- `_layout.tsx` - Main layout for user area with sidebar navigation
- **appointments+/**
  - `index.tsx` - Lists all patient appointments
  - `$appointmentId+/index.tsx` - Detailed view of a specific appointment
- **recipes+/**
  - `_index.tsx` - Lists all available diet recipes
  - `$id+/view.tsx` - Detailed view of a specific recipe
- `bmi.tsx` - BMI calculator tool
- **contact/**
  - `page.tsx` - Contact page to connect with dieticians

### Authentication Routes (`_auth+/`)
Handles all authentication-related functionality:

- `_layout.tsx` - Authentication pages layout
- `login.tsx` - User login with role selection
- `register.tsx` - New user registration
- `logout.tsx` - Handles user logout
- `forgot-password.tsx` - Password recovery request
- `reset-password.tsx` - Password reset with token

### Admin Routes (`admin+/`)
Administrative section for system management:

- `_index.tsx` - Admin dashboard redirect
- `_layout.tsx` - Admin area layout
- **doctors+/**
  - `index.tsx` - List all doctors
  - `new.tsx` - Add new doctor
  - `$id+/edit.tsx` - Edit doctor details
  - `$id+/delete.tsx` - Delete doctor
- **recipes+/**
  - `_index.tsx` - Manage recipes
  - `new.tsx` - Create new recipe
  - `$id+/edit.tsx` - Edit recipe
  - `$id+/delete.tsx` - Delete recipe
  - `$id+/view.tsx` - View recipe details

### Doctor Routes (`doctor+/`)
Doctor-specific functionality:

- **appointments+/**
  - `index.tsx` - Doctor's appointment dashboard

## Route Naming Conventions

### Prefix Meanings
- `_app+/` - User/patient routes requiring authentication
- `_auth+/` - Public authentication routes
- `admin+/` - Admin-only routes
- `doctor+/` - Doctor-only routes

### Special Characters
- `+` - Route grouping (nested routes)
- `$` - Dynamic parameters (e.g., `$appointmentId`)
- `_` - Special handling (layouts, indexes)

## Data Flow Examples

1. **Appointment Booking Flow**
   - User navigates to `/contact`
   - Views available doctors
   - Books appointment through form
   - Views booking at `/appointments/$appointmentId`

2. **Recipe Management Flow**
   - Admin accesses `/admin/recipes`
   - Creates new recipe at `/admin/recipes/new`
   - Edits at `/admin/recipes/$id/edit`
   - Users view at `/recipes/$id/view`

3. **Doctor Management Flow**
   - Admin manages doctors at `/admin/doctors`
   - Adds new doctors at `/admin/doctors/new`
   - Edits at `/admin/doctors/$id/edit`

# Data Flow and Feature Documentation

## Core Features & Data Flow

### 1. User Authentication System
**Flow: `_auth+/`**
- **Registration (`/register`)**
  - Multi-step form collecting:
    - Personal info (name, DOB)
    - Contact details (address, phone)
    - Account credentials (email, password)
  - Role selection (User/Doctor)
  - For patients: Additional health metrics (height, weight)
  - Data stored in User table with role-specific fields

- **Login (`/login`)**
  - Role-based authentication
  - Redirects based on user role:
    - Users → `/bmi`
    - Doctors → `/doctor/appointments`
    - Admins → `/admin/recipes`

### 2. Patient Health Management
**Flow: `_app+/`**

- **BMI Calculator (`/bmi`)**
  - Interactive calculator
  - Stores patient's:
    - Height
    - Weight
    - Calculated BMI
    - Health recommendations

- **Diet Recipes (`/recipes`)**
  - Browse diet recipes
  - Each recipe includes:
    - Nutritional information
    - Ingredients list
    - Step-by-step instructions
    - Price and cooking time
  - Detailed view at `/recipes/$id/view`

### 3. Appointment System
**Three-way interaction between Patient, Doctor, and System**

#### Patient Side (`_app+/appointments`)
1. **Booking Flow**
   - Starts at `/contact`
   - Shows available doctors with:
     - Specialties
     - Available time slots
     - Contact information
   - Books appointment with:
     - Selected date/time
     - Doctor preference
     - Health concerns

2. **Appointment Management**
   - List view (`/appointments`)
     - Upcoming appointments
     - Past appointments
     - Appointment status
   - Detailed view (`/appointments/$appointmentId`)
     - Doctor details
     - Prescribed meal plans
     - Health metrics
     - Appointment notes

#### Doctor Side (`doctor+/appointments`)
- Dashboard showing:
  - Today's appointments
  - Upcoming schedule
  - Patient history
  - Ability to:
    - Update appointment status
    - Add medical notes
    - Prescribe meal plans
    - Track patient progress

### 4. Admin Management System
**Flow: `admin+/`**

1. **Doctor Management**
   - CRUD operations for doctors
   - At `/admin/doctors`:
     - List all doctors
     - View doctor details
     - Manage specialties
     - Track appointment load
   - Doctor profile includes:
     - Professional details
     - Availability schedule
     - Patient load
     - Performance metrics

2. **Recipe Management**
   - At `/admin/recipes`:
     - Create/edit diet plans
     - Manage ingredients
     - Set pricing
     - Track recipe popularity
   - Recipe data structure:     ```typescript
     Recipe {
       title: string
       description: string
       ingredients: Ingredient[]
       steps: Step[]
       nutritionalInfo: NutritionalValue
       price: number
       cookingTime: string
     }     ```

## Database Relationships

### Core Tables
1. **Users**
   - Common fields: id, name, email, role
   - Role-specific fields:
     - Patients: height, weight, healthMetrics
     - Doctors: specialty, availability

2. **Appointments**
   - Links: patientId, doctorId
   - Data: date, time, status, notes
   - Related: mealPlan, healthMetrics

3. **Recipes**
   - Core: title, description, price
   - Related: ingredients, steps, nutritionalInfo

### Data Protection
- Encrypted passwords
- Secure session management
- Role validation on all protected routes
- Data access restrictions based on user role

This comprehensive data flow shows how different parts of the application interact while maintaining clear boundaries between user roles and responsibilities. Each feature is built with scalability and security in mind, ensuring a robust healthcare management system.