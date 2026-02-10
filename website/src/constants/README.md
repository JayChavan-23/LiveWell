# Quiz System Documentation

## Overview
The quiz system is designed to be easily extensible. All quiz data is stored in the `quizzes.js` constants file, making it simple to add new quizzes without modifying other components.

## Adding a New Quiz

### 1. Add Quiz Data to `quizzes.js`
Add a new quiz object to the `QUIZZES` object:

```javascript
export const QUIZZES = {
  // ... existing quizzes ...
  
  newQuiz: {
    id: 'newQuiz',
    title: 'New Quiz Title',
    icon: 'fi fi-sr-icon-name', // Use Flaticon icons
    description: 'Brief description of the quiz',
    questions: [
      {
        id: 1,
        question: 'Your question here?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 2, // Index of correct answer (0-3)
        explanation: 'Explanation of why this answer is correct.'
      },
      // ... add 10 questions total
    ]
  }
};
```

### 2. Quiz Structure Requirements
Each quiz must have:
- **id**: Unique identifier (lowercase, no spaces)
- **title**: Display name for the quiz
- **icon**: Flaticon icon class (e.g., `fi fi-sr-brain`)
- **description**: Brief description shown in the quiz grid
- **questions**: Array of exactly 10 questions

### 3. Question Structure Requirements
Each question must have:
- **id**: Sequential number (1-10)
- **question**: The question text
- **options**: Array of exactly 4 answer options
- **correctAnswer**: Index of correct answer (0-3)
- **explanation**: Brief explanation of the correct answer

### 4. Icons
Use Flaticon icons from the `uicons-regular-rounded` set:
- Brain: `fi fi-sr-brain`
- Globe: `fi fi-sr-globe`
- Calculator: `fi fi-sr-calculator`
- Heart: `fi fi-sr-heart`
- And many more available at: https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css

## Automatic Integration
Once you add a quiz to the constants file:
- It automatically appears in the Health Dashboard quiz section
- Users can click to start the quiz
- Quiz completion is tracked and scores are displayed
- Achievements are automatically generated
- No other code changes are needed!

## Example Quiz Addition
```javascript
// Add this to quizzes.js
scienceQuiz: {
  id: 'scienceQuiz',
  title: 'Science Quiz',
  icon: 'fi fi-sr-atom',
  description: 'Test your knowledge of basic science concepts',
  questions: [
    {
      id: 1,
      question: 'What is the chemical symbol for gold?',
      options: ['Ag', 'Au', 'Fe', 'Cu'],
      correctAnswer: 1,
      explanation: 'Au is the chemical symbol for gold, from the Latin word "aurum".'
    },
    // ... 9 more questions
  ]
}
```

## Best Practices
1. **Keep questions clear and concise**
2. **Ensure all options are plausible**
3. **Provide helpful explanations**
4. **Use consistent formatting**
5. **Test the quiz before deploying**
6. **Keep explanations educational and encouraging**

## Current Quizzes
1. **General Knowledge Quiz** - World facts and trivia
2. **World Places & Cities** - Geography and landmarks
3. **Simple Math & Logic** - Basic mathematics and reasoning
4. **Health & Lifestyle** - Wellness and health knowledge

## Future Enhancements
- Quiz difficulty levels
- Time-based scoring
- Progressive difficulty
- Category-based organization
- User-generated quizzes
