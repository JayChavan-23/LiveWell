export const QUIZZES = {
  generalKnowledge: {
    id: 'generalKnowledge',
    title: 'General Knowledge Quiz',
    icon: 'fi fi-sr-brain',
    description: 'Test your knowledge about the world around you',
    questions: [
      {
        id: 1,
        question: 'What is the capital city of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
        correctAnswer: 2,
        explanation: 'Canberra is the capital city of Australia, not Sydney or Melbourne.'
      },
      {
        id: 2,
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
        explanation: 'Mars is called the Red Planet due to its reddish appearance.'
      },
      {
        id: 3,
        question: 'Who painted the Mona Lisa?',
        options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
        correctAnswer: 2,
        explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.'
      },
      {
        id: 4,
        question: 'How many continents are there in the world?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 2,
        explanation: 'There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.'
      },
      {
        id: 5,
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswer: 3,
        explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.'
      },
      {
        id: 6,
        question: 'Which animal is known as the "King of the Jungle"?',
        options: ['Tiger', 'Lion', 'Elephant', 'Gorilla'],
        correctAnswer: 1,
        explanation: 'The lion is often called the "King of the Jungle" due to its majestic appearance and roar.'
      },
      {
        id: 7,
        question: 'What is the smallest prime number?',
        options: ['0', '1', '2', '3'],
        correctAnswer: 2,
        explanation: '2 is the smallest prime number and the only even prime number.'
      },
      {
        id: 8,
        question: 'Who wrote Romeo and Juliet?',
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        correctAnswer: 1,
        explanation: 'William Shakespeare wrote the famous tragedy Romeo and Juliet.'
      },
      {
        id: 9,
        question: 'Which is the fastest land animal?',
        options: ['Lion', 'Cheetah', 'Leopard', 'Gazelle'],
        correctAnswer: 1,
        explanation: 'The cheetah is the fastest land animal, capable of reaching speeds up to 70 mph.'
      },
      {
        id: 10,
        question: 'In which country would you find the Great Pyramid of Giza?',
        options: ['Iraq', 'Egypt', 'Sudan', 'Libya'],
        correctAnswer: 1,
        explanation: 'The Great Pyramid of Giza is located in Egypt and is one of the Seven Wonders of the Ancient World.'
      }
    ]
  },
  
  worldPlaces: {
    id: 'worldPlaces',
    title: 'World Places & Cities',
    icon: 'fi fi-sr-globe',
    description: 'Explore famous landmarks and cities around the world',
    questions: [
      {
        id: 1,
        question: 'The Eiffel Tower is in which city?',
        options: ['London', 'Berlin', 'Paris', 'Rome'],
        correctAnswer: 2,
        explanation: 'The Eiffel Tower is located in Paris, France.'
      },
      {
        id: 2,
        question: 'Which country is known as the "Land of the Rising Sun"?',
        options: ['China', 'Japan', 'South Korea', 'Thailand'],
        correctAnswer: 1,
        explanation: 'Japan is known as the "Land of the Rising Sun" due to its location east of Asia.'
      },
      {
        id: 3,
        question: 'Which city is famous for the Opera House and Harbour Bridge?',
        options: ['Melbourne', 'Sydney', 'Brisbane', 'Perth'],
        correctAnswer: 1,
        explanation: 'Sydney is famous for its iconic Opera House and Harbour Bridge.'
      },
      {
        id: 4,
        question: 'In which country is the Taj Mahal located?',
        options: ['Pakistan', 'India', 'Bangladesh', 'Nepal'],
        correctAnswer: 1,
        explanation: 'The Taj Mahal is located in Agra, India.'
      },
      {
        id: 5,
        question: 'What is the capital city of Canada?',
        options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
        correctAnswer: 3,
        explanation: 'Ottawa is the capital city of Canada.'
      },
      {
        id: 6,
        question: 'Mount Everest is located between Nepal and which other country?',
        options: ['India', 'China', 'Bhutan', 'Tibet'],
        correctAnswer: 1,
        explanation: 'Mount Everest is located on the border between Nepal and China (Tibet).'
      },
      {
        id: 7,
        question: 'Which US city is called "The Big Apple"?',
        options: ['Los Angeles', 'Chicago', 'New York', 'Boston'],
        correctAnswer: 2,
        explanation: 'New York City is nicknamed "The Big Apple."'
      },
      {
        id: 8,
        question: 'Which desert is the largest in the world?',
        options: ['Gobi Desert', 'Sahara Desert', 'Arabian Desert', 'Antarctic Desert'],
        correctAnswer: 1,
        explanation: 'The Sahara Desert in Africa is the largest hot desert in the world.'
      },
      {
        id: 9,
        question: 'Where is the Colosseum located?',
        options: ['Athens', 'Rome', 'Florence', 'Venice'],
        correctAnswer: 1,
        explanation: 'The Colosseum is located in Rome, Italy.'
      },
      {
        id: 10,
        question: 'Which river flows through London?',
        options: ['Thames', 'Seine', 'Rhine', 'Danube'],
        correctAnswer: 0,
        explanation: 'The River Thames flows through London, England.'
      }
    ]
  },
  
  mathLogic: {
    id: 'mathLogic',
    title: 'Simple Math & Logic',
    icon: 'fi fi-sr-calculator',
    description: 'Test your basic math skills and logical thinking',
    questions: [
      {
        id: 1,
        question: 'What is 25 + 37?',
        options: ['60', '61', '62', '63'],
        correctAnswer: 2,
        explanation: '25 + 37 = 62'
      },
      {
        id: 2,
        question: 'If you buy 3 apples at $2 each, how much will it cost?',
        options: ['$5', '$6', '$7', '$8'],
        correctAnswer: 1,
        explanation: '3 apples × $2 each = $6'
      },
      {
        id: 3,
        question: 'What is 100 ÷ 4?',
        options: ['20', '25', '30', '35'],
        correctAnswer: 1,
        explanation: '100 ÷ 4 = 25'
      },
      {
        id: 4,
        question: 'Which number comes next in the sequence: 2, 4, 6, 8, ?',
        options: ['9', '10', '11', '12'],
        correctAnswer: 1,
        explanation: 'The sequence adds 2 each time: 2, 4, 6, 8, 10'
      },
      {
        id: 5,
        question: 'If a train leaves at 3:00 PM and arrives at 6:30 PM, how long is the journey?',
        options: ['2.5 hours', '3 hours', '3.5 hours', '4 hours'],
        correctAnswer: 2,
        explanation: 'From 3:00 PM to 6:30 PM is 3.5 hours'
      },
      {
        id: 6,
        question: 'What is 12 × 12?',
        options: ['120', '132', '144', '156'],
        correctAnswer: 2,
        explanation: '12 × 12 = 144'
      },
      {
        id: 7,
        question: 'If you have 50 and spend 20, how much is left?',
        options: ['25', '30', '35', '40'],
        correctAnswer: 1,
        explanation: '50 - 20 = 30'
      },
      {
        id: 8,
        question: 'Which is larger: ¾ or ⅔?',
        options: ['¾', '⅔', 'They are equal', 'Cannot compare'],
        correctAnswer: 0,
        explanation: '¾ = 0.75, ⅔ = 0.67, so ¾ is larger'
      },
      {
        id: 9,
        question: 'How many sides does a hexagon have?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 1,
        explanation: 'A hexagon has 6 sides (hex = six)'
      },
      {
        id: 10,
        question: 'If today is Monday, what day will it be in 3 days?',
        options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        correctAnswer: 2,
        explanation: 'Monday + 3 days = Thursday'
      }
    ]
  },
  
  healthLifestyle: {
    id: 'healthLifestyle',
    title: 'Health & Lifestyle',
    icon: 'fi fi-sr-heart',
    description: 'Learn about healthy living and wellness practices',
    questions: [
      {
        id: 1,
        question: 'How many glasses of water are recommended per day for good hydration?',
        options: ['4-6 glasses', '6-8 glasses', '8-10 glasses', '10-12 glasses'],
        correctAnswer: 1,
        explanation: '6-8 glasses of water per day is the general recommendation for good hydration.'
      },
      {
        id: 2,
        question: 'Which vitamin do we get from sunlight?',
        options: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E'],
        correctAnswer: 2,
        explanation: 'Vitamin D is produced in the skin when exposed to sunlight.'
      },
      {
        id: 3,
        question: 'What kind of exercise is best for strengthening bones?',
        options: ['Swimming', 'Weight-bearing exercises', 'Cycling', 'Yoga'],
        correctAnswer: 1,
        explanation: 'Weight-bearing exercises like walking, running, and strength training help strengthen bones.'
      },
      {
        id: 4,
        question: 'Which fruit is known as a good source of potassium?',
        options: ['Apple', 'Banana', 'Orange', 'Grape'],
        correctAnswer: 1,
        explanation: 'Bananas are an excellent source of potassium, which helps maintain healthy blood pressure.'
      },
      {
        id: 5,
        question: 'How many minutes of moderate activity are recommended per week for older adults?',
        options: ['75 minutes', '150 minutes', '225 minutes', '300 minutes'],
        correctAnswer: 1,
        explanation: '150 minutes of moderate activity per week is recommended for older adults.'
      },
      {
        id: 6,
        question: 'What is the normal human body temperature in Celsius?',
        options: ['35°C', '36°C', '37°C', '38°C'],
        correctAnswer: 2,
        explanation: 'The normal human body temperature is approximately 37°C (98.6°F).'
      },
      {
        id: 7,
        question: 'Which food group is a source of protein?',
        options: ['Fruits', 'Vegetables', 'Meat and fish', 'Grains'],
        correctAnswer: 2,
        explanation: 'Meat, fish, eggs, dairy, legumes, and nuts are good sources of protein.'
      },
      {
        id: 8,
        question: 'Which organ does high blood pressure mainly affect?',
        options: ['Liver', 'Heart', 'Kidneys', 'All of the above'],
        correctAnswer: 3,
        explanation: 'High blood pressure can affect the heart, kidneys, brain, and other organs.'
      },
      {
        id: 9,
        question: 'What is the best time of day to take a brisk walk?',
        options: ['Early morning', 'Midday', 'Late afternoon', 'Any time that fits your schedule'],
        correctAnswer: 3,
        explanation: 'The best time to exercise is when it fits your schedule and you can be consistent.'
      },
      {
        id: 10,
        question: 'Why is sleep important for overall health?',
        options: ['It helps with weight loss', 'It improves memory and learning', 'It reduces stress', 'All of the above'],
        correctAnswer: 3,
        explanation: 'Sleep is crucial for physical health, mental health, memory, learning, and stress reduction.'
      }
    ]
  }
};

export const getQuizById = (id) => {
  return QUIZZES[id] || null;
};

export const getAllQuizIds = () => {
  return Object.keys(QUIZZES);
};

export const getQuizCount = () => {
  return Object.keys(QUIZZES).length;
};
