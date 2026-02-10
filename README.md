# LiveWell Website

## Overview
The LiveWell-N website is a React.js + Tailwind CSS application designed for older adults to track health data, interact with a chatbot, view frailty scores, and manage reminders.  
It shares the backend with the mobile app for consistency.

### Key Features
- User authentication (login and signup with Firebase)
- Multi-step onboarding flow
- Personal health dashboard
- Interactive health chatbot
- Medicine and vaccination reminders
- Health quizzes and achievements
- Goals tracking
- Social events
- User profile management

---

## Tech Stack
| Component | Technology |
|------------|-------------|
| Framework | React.js (Vite) |
| Styling | Tailwind CSS |
| Backend | Express.js API |
| Authentication | Firebase Auth |
| Database | Firebase Firestore |

---

## Implemented Features

### Authentication & Onboarding
- Login/Signup using Firebase Auth with email/password and phone number.
- Error handling for duplicate emails/phones and invalid credentials.
- Multi-step onboarding flow:
  - User Details: Name, phone number, date of birth
  - Health Information: Allergies, dietary preferences, medical conditions
  - Frailty Assessment: Activity frequency questions that calculate frailty score

---

### Dashboard
- Frailty score display showing current score out of 100 with status indicators.
- Achievement notifications for completed achievements.
- Quick actions providing direct access to dashboard, chatbot, and goals.
- Reminders section displaying medicine and vaccination reminders.
- Dynamic data fetched from backend APIs showing real-time health metrics.

---

### Health Dashboard
#### Health Metrics Cards
- Frailty Score: Current frailty score with clickable history.
- Steps Today: Steps completed with progress toward daily goal.
- Water Intake: Glasses consumed with progress tracking.
- Medicine Reminder: Next scheduled medicine time.

#### Historical Data
Click any metric card to see the past 7 days:
- Steps history with percentage of goal achieved
- Water intake trends
- Frailty changes

#### Data Handling
- Data fetched from backend APIs
- Proper empty state handling

---

### Medicine & Vaccination Reminders
#### Medicine Schedule Modal
- Add or update medicine schedules with:
  - Period selection (Morning, Afternoon, Evening, Night)
  - Time setting
  - Description for each medicine
  - Before/after meal timing
  - Ability to add multiple medicines
- White background for readability.

#### Vaccination Schedule Modal
- Schedule vaccinations with:
  - Vaccination type selection (Flu shot, COVID-19 booster, etc.)
  - Scheduled date picker
  - Description field
- Designed with white backgrounds for accessibility.

---

### Health Quizzes
- Interactive quizzes to test health knowledge.
- Features include:
  - Score tracking and best score display
  - Multiple quiz attempts support
  - Achievement badges on completion
  - Visual quiz cards with status indicators

---

### Social Events
- Integrated social events section showing community activities.
- Encourages social engagement and participation.

---

### Chatbot Interface
- Chat history to view all past conversations.
- New chat option to start fresh conversations at any time.
- Conversation summarization categorized into:
  - Physical health (exercise, fitness)
  - Social interactions
  - Nutritional advice
  - Mental health discussions
- Goal creation: Chatbot can detect when users want to set goals and create them directly.
- Message formatting supports headings, bullet points, and emphasis.
- Real-time responses integrated with backend AI (Gemini) for personalized health advice.

---

### Goals Management
- Goals dashboard for viewing and tracking various goal types:
  - Physical goals (steps, running)
  - Vaccination reminders
  - Diet goals
  - Social activity goals
  - Quiz completion goals
- Goal progress visualization for each goal.
- Goal status indicators for active, completed, or overdue goals.

---

### User Profile
- Profile section for managing user account information.
- Health information updates: Edit allergies, dietary preferences, and medical conditions.
- User details: Update name, phone number, and personal information.

---

## UI/UX Features
- Modern, clean interface with gradients and glass effects.
- Responsive layout for desktop and tablet devices.
- Accessibility: Large fonts, clear contrast, and easy-to-read colors.
- Navigation: Floating navigation bar for easy access to main sections.
- Loading states: Visual feedback during data fetching.
- Error handling: User-friendly messages throughout the application.
- White modal backgrounds for better readability.

---

## Backend Integration
| API | Function |
|-----|-----------|
| Weekly Summary API | Fetches past 7 days of steps and hydration data |
| Frailty Score API | Calculates and retrieves current frailty score |
| Medicine Schedule API | Saves and retrieves medicine schedules |
| Quiz API | Fetches quizzes, submits answers, and tracks scores |
| Chat API | Sends messages and receives AI-generated responses |
| Goals API | Creates, updates, and tracks user goals |
| Achievements API | Unlocks and displays achievement notifications |

---

## Screens Implemented
- Home Page: Landing page with welcome information.
- Login/Signup: Authentication pages integrated with Firebase.
- Multi-step Onboarding: User Details → Health Info → Frailty Info.
- Dashboard: Main dashboard with health overview.
- Health Dashboard: Detailed health metrics and history views.
- Chatbot Screen: Interactive chat interface with history and summarization.
- Goals Page: Goals tracking and management.
- Profile Page: User profile and settings.
- Modals:
  - Medicine Schedule Update Modal
  - Vaccination Schedule Update Modal
  - Health Metric History Modals (Steps, Water, Frailty, Medicine)

---

## Technical Highlights
- All health data dynamically fetched from the backend.
- Real-time updates for frailty scores and health metrics.
- Proper error handling and loading states throughout.
- Consistent API integration patterns.
- Responsive design using Tailwind CSS.
- Firebase authentication for secure user management.
- Empty state handling for missing data.
- Clean, maintainable code structure with separated components.

---

## Next Goals
All planned features have been successfully implemented.  
The application is fully functional with all core features complete.

This documentation reflects the current state of the LiveWell-N website as of the latest implementation.
