# NEU Library Digital Visitor Log

This is a Next.js starter project for a digital visitor logging system for the NEU Library, built using Firebase Studio. It features separate user flows for visitors (students/faculty) and administrators, real-time data synchronization with Firebase, and AI-powered tools.

---

## Project Overview

The application is designed to replace a manual paper-based visitor log. It allows students and faculty to log their library visits digitally and provides an administrative dashboard for staff to monitor library usage statistics in real-time.

**Key Features:**
-   **Visitor Login:** Visitors can sign in using their student number or institutional Google account.
-   **Visitor Signup:** A streamlined process for new users to create an account.
-   **Visit Logging:** After signing in, users log their reason for visiting.
-   **Admin Dashboard:** A secure section for administrators to view real-time analytics, including total visits, unique visitors, peak hours, and visit reasons.
-   **User Management:** Administrators can view, add, edit, delete, and manage user accounts.
-   **AI Integration:** An AI-powered tool helps categorize free-text visit reasons into standardized categories.

---

## Folder Structure

The project follows a structure common for Next.js applications, with clear separation of concerns.

```
.
├── src
│   ├── app/                # Next.js App Router: Pages and Layouts
│   │   ├── admin/          # Admin-only section
│   │   │   ├── dashboard/  # Admin analytics dashboard
│   │   │   ├── login/      # Admin login page
│   │   │   └── users/      # User management pages
│   │   ├── login/          # Visitor login page
│   │   ├── signup/         # Visitor registration page
│   │   └── welcome/        # Page for logging visit details
│   │
│   ├── components/         # Reusable React components
│   │   ├── ui/             # ShadCN UI components (Button, Card, etc.)
│   │   ├── admin/          # Components specific to the admin panel
│   │   └── (reusable components like Logo, VisitDetailsForm)
│   │
│   ├── firebase/           # Firebase configuration and hooks
│   │   ├── firestore/      # Firestore-specific hooks (useCollection, useDoc)
│   │   ├── config.ts       # Firebase config object (reads from .env)
│   │   ├── index.ts        # Initializes Firebase and exports services/hooks
│   │   └── provider.tsx    # Core Firebase Context provider
│   │
│   ├── hooks/              # Custom reusable React hooks
│   │   ├── use-google-auth.ts # Logic for Google Sign-In
│   │   └── use-toast.ts    # Toast notification system
│   │
│   ├── lib/                # Core application logic, types, and server actions
│   │   ├── actions.ts      # Next.js Server Actions (wraps Genkit flows)
│   │   ├── types.ts        # TypeScript type definitions (User, VisitLog)
│   │   └── utils.ts        # Utility functions
│   │
│   └── ai/                 # Genkit (Generative AI) files
│       ├── flows/          # Definitions of AI flows (e.g., reason categorization)
│       └── genkit.ts       # Genkit initialization
│
├── docs/
│   └── backend.json        # Defines the app's data models and Firestore structure
│
├── firestore.rules         # Security rules for the Firestore database
│
└── next.config.ts          # Next.js configuration
```

---

## Core User Flows

### 1. Visitor Journey (Login & Log Visit)

1.  **Start at `/login`**: A visitor arrives at the login page.
2.  **Authentication Choice**: They can either:
    *   **Enter Student Number**:
        *   The system checks Firestore for a user with a matching `qrCodeIdentifier`.
        *   If found, the user is considered authenticated and is redirected to `/welcome`.
        *   If not found, they are redirected to `/signup` with their student number pre-filled to create an account.
    *   **Sign in with Google**:
        *   Uses the `useGoogleAuth` hook, restricted to `@neu.edu.ph` accounts.
        *   If the user's account exists in Firestore, they are redirected to `/welcome`.
        *   If not, they are redirected to `/signup`.
3.  **Signup (if new)**: On the `/signup` page, the user completes their profile (name, college). A new `User` document is created in the `users` collection in Firestore.
4.  **Log Visit at `/welcome`**:
    *   The authenticated user is presented with a form (`VisitDetailsForm`) to select their reason for visiting.
    *   Upon submission, a new `LibraryVisit` document is created in a subcollection under their user document (`/users/{userId}/libraryVisits/{visitId}`).
    *   A "Thank you" message is displayed, and the user is redirected back to the login page after a few seconds.

### 2. Administrator Journey

1.  **Start at `/admin/login`**: An administrator navigates to the admin login page.
2.  **Authentication Choice**: They have two secure options:
    *   **Sign in with Google**: The system verifies that the Google account (`@neu.edu.ph`) corresponds to a user in Firestore with `role: 'admin'`.
    *   **Secure Email Link**: The admin enters their email, receives a one-time sign-in link, and clicks it to log in. The system again verifies their `role` is `admin`.
3.  **Admin Layout Protection**: All pages under `/admin/` are wrapped by `src/app/admin/layout.tsx`. This layout component acts as a guard, ensuring that only authenticated users with an `admin` role can access these pages.
4.  **Dashboard & Management**:
    *   **/admin/dashboard**: The admin can view real-time statistics on library usage, powered by live queries to Firestore.
    *   **/admin/users**: The admin can perform CRUD (Create, Read, Update, Delete) operations on user accounts. They can also view the complete visit history for any specific user.

---

## Key Technologies

-   **Framework**: Next.js 15 (App Router)
-   **Database**: Firebase Firestore (for all user and application data)
-   **Authentication**: Firebase Authentication (Google Sign-In & Email Link)
-   **UI**: React, Tailwind CSS, ShadCN UI
-   **Generative AI**: Google Genkit
