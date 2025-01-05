import type { CreateTrainingSessoin } from "../validators";

type SessionRecommendation = CreateTrainingSessoin & {
  description: string;
};

const DE_LANGUAGE_RECOMMENDATIONS: SessionRecommendation[] = [
  {
    title: "Introduction to Simple Sentences",
    description: "Practice simple sentences on basic topics.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A1",
        learnFrom: "number-of-sentences",
        numberOfSentences: 3,
        topic: "Greetings and Introductions",
      },
    },
    languageCode: "de",
  },
  {
    title: "Daily Life Vocabulary",
    description: "Expand vocabulary with everyday topics.",
    exercise: {
      exercise: "exercise-2",

      data: {
        complexity: "A1",
        learnFrom: "list-of-words",
        words: ["essen", "trinken", "arbeiten", "schlafen"],
        eachWordPracticeCount: 3,
      },
    },
    languageCode: "de",
  },
  {
    title: "Basic Sentence Structure",
    description: "Learn basic sentence structure with short sentences.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A2",
        learnFrom: "number-of-sentences",
        numberOfSentences: 5,
        topic: "Family and Relationships",
      },
    },
    languageCode: "de",
  },
  {
    title: "Common Verbs Practice",
    description: "Practice common verbs used in daily conversations.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Essential Verbs",
        words: ["sein", "haben", "machen", "gehen"],
      },
    },
    languageCode: "de",
  },
  {
    title: "Basic Shopping Vocabulary",
    description: "Learn words commonly used in shopping contexts.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Shopping and Buying",
        words: ["kaufen", "bezahlen", "verkaufen", "preis"],
      },
    },
    languageCode: "de",
  },
  {
    title: "Practice with Numbers",
    description: "Get familiar with numbers and counting in sentences.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A1",
        learnFrom: "number-of-words",
        numberOfWords: 10,
        eachWordPracticeCount: 2,
        topic: "Numbers and Counting",
      },
    },
    languageCode: "de",
  },
  {
    title: "Travel and Directions",
    description: "Learn vocabulary and sentences for travel.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A2",
        learnFrom: "number-of-sentences",
        numberOfSentences: 3,
        topic: "Travel and Directions",
      },
    },
    languageCode: "de",
  },
  {
    title: "Food and Drink",
    description: "Practice sentences about ordering food and drinks.",
    exercise: {
      exercise: "exercise-3",
      data: {
        learnFrom: "ask-ai",
        topic: "Food and Beverages",
        complexity: "A2",
      },
    },
    languageCode: "de",
  },
  {
    title: "Household Vocabulary",
    description: "Build vocabulary related to household items and chores.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Household",
        words: ["küche", "wohnzimmer", "schlafen", "putzen"],
      },
    },
    languageCode: "de",
  },
  {
    title: "Social Media and Technology",
    description: "Learn terms related to social media and technology.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "B1",
        learnFrom: "number-of-words",
        numberOfWords: 8,
        eachWordPracticeCount: 2,
        topic: "Technology and Social Media",
      },
    },
    languageCode: "de",
  },
];

const CZ_LANGUAGE_RECOMMENDATIONS: SessionRecommendation[] = [
  {
    title: "Greetings and Basic Phrases",
    description: "Learn essential greetings and basic conversational phrases.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A1",
        learnFrom: "number-of-sentences",
        numberOfSentences: 3,
        topic: "Greetings and Introductions",
      },
    },
    languageCode: "cz",
  },
  {
    title: "Daily Activities Vocabulary",
    description: "Practice words related to daily activities.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Daily Routine",
        words: ["jíst", "pít", "pracovat", "spát"],
      },
    },
    languageCode: "cz",
  },
  {
    title: "Basic Sentence Structure",
    description: "Build simple sentences to describe daily life.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A2",
        learnFrom: "number-of-sentences",
        numberOfSentences: 5,
        topic: "Family and Friends",
      },
    },
    languageCode: "cz",
  },
  {
    title: "Essential Verbs Practice",
    description: "Master common verbs for daily conversations.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Common Verbs",
        words: ["být", "mít", "dělat", "jít"],
      },
    },
    languageCode: "cz",
  },
  {
    title: "Shopping Vocabulary",
    description: "Learn essential words for shopping situations.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Shopping",
        words: ["koupit", "platit", "prodávat", "cena"],
      },
    },
    languageCode: "cz",
  },
  {
    title: "Numbers and Counting",
    description: "Familiarize yourself with numbers and counting words.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A1",
        learnFrom: "number-of-words",
        numberOfWords: 10,
        eachWordPracticeCount: 2,
        topic: "Numbers",
      },
    },
    languageCode: "cz",
  },
  {
    title: "Travel Vocabulary",
    description: "Learn phrases useful for travel and directions.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "A2",
        learnFrom: "number-of-sentences",
        numberOfSentences: 3,
        topic: "Travel and Directions",
      },
    },
    languageCode: "cz",
  },
  {
    title: "Food and Drink Phrases",
    description: "Practice sentences related to ordering food and drinks.",
    exercise: {
      exercise: "exercise-3",
      data: {
        learnFrom: "ask-ai",
        topic: "Food and Beverages",
        complexity: "A2",
      },
    },
    languageCode: "cz",
  },
  {
    title: "Household Items Vocabulary",
    description: "Learn words for household items and chores.",
    exercise: {
      exercise: "exercise-1",
      data: {
        complexity: "A1",
        topic: "Household",
        words: ["kuchyně", "obývací pokoj", "spát", "čistit"],
      },
    },
    languageCode: "cz",
  },
  {
    title: "Technology Terms",
    description:
      "Expand your vocabulary with technology and social media terms.",
    exercise: {
      exercise: "exercise-2",
      data: {
        complexity: "B1",
        learnFrom: "number-of-words",
        numberOfWords: 8,
        eachWordPracticeCount: 2,
        topic: "Technology and Social Media",
      },
    },
    languageCode: "cz",
  },
];

export const SESSION_RECOMMENDATIONS: SessionRecommendation[] = [
  ...DE_LANGUAGE_RECOMMENDATIONS,
  ...CZ_LANGUAGE_RECOMMENDATIONS,
];
