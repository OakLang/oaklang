export const APP_NAME = "Oaklang";
export const APP_URL = "https://oaklang.com";
export const AUTH_REQUEST_EMAIL = "auth_request@oaklang.com";
export const CONTACT_EMAIL = "auth_request@oaklang.com";
export const SUPPORT_EMAIL = "support@oaklang.com";

export const COMPLEXITY_LIST = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const INTERLINEAR_LINE_DESCRIPTION_AVAILABLE_KEYS = [
  "{PRACTICE_LANGUAGE}",
  "{NATIVE_LANGUAGE}",
];

export const TTS_SPEED_OPTIONS: number[] = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

export const NO_REPLY_EMAIL = `${APP_NAME} <no_reply@oaklang.com>`;

export const TRAINING_SESSION_TOPICS: {
  name: string;
  topic: string;
}[] = [
  {
    name: "Travel and Tourism",
    topic:
      "Sentences about exploring new cities, landmarks, and travel experiences.",
  },
  {
    name: "Food and Cooking",
    topic:
      "Conversations around recipes, cooking techniques, and favorite dishes.",
  },
  {
    name: "Sports and Fitness",
    topic: "Training, sports events, workouts, and fitness goals.",
  },
  {
    name: "Technology and Gadgets",
    topic: "Tech trends, gadgets, and innovations in the tech world.",
  },
  {
    name: "Daily Life and Routines",
    topic:
      "Common daily tasks like waking up, going to work, and running errands.",
  },
  {
    name: "Entertainment and Movies",
    topic: "Discussions on favorite movies, TV shows, and entertainment news.",
  },
  {
    name: "Nature and Environment",
    topic:
      "Sentences about landscapes, animals, climate change, and sustainability.",
  },
  {
    name: "Fashion and Style",
    topic: "Conversations on fashion trends, outfits, and personal style.",
  },
  {
    name: "Music and Arts",
    topic: "Exploring musical genres, instruments, and art forms.",
  },
  {
    name: "Work and Careers",
    topic: "Topics about professions, job hunting, and office life.",
  },
  {
    name: "Hobbies and Interests",
    topic:
      "Sentences about various hobbies like reading, painting, or gardening.",
  },
  {
    name: "Social Media and Influencers",
    topic: "Conversations about online trends and content creators.",
  },
  {
    name: "Science and Space",
    topic:
      "Exploring topics related to space exploration, experiments, and discoveries.",
  },
  {
    name: "Health and Wellness",
    topic: "Sentences about diet, mental health, and exercise routines.",
  },
  {
    name: "Relationships and Family",
    topic: "Conversations on friendships, family dynamics, and relationships.",
  },
  {
    name: "Shopping and Retail",
    topic: "Buying clothes, groceries, or online shopping.",
  },
  {
    name: "Education and Learning",
    topic:
      "Sentences focused on schools, universities, and learning new skills.",
  },
  {
    name: "History and Culture",
    topic: "Sentences about historical events, cultures, and traditions.",
  },
  {
    name: "Politics and News",
    topic:
      "Discussions on current events, policies, and international relations.",
  },
  {
    name: "Fantasy and Adventure",
    topic:
      "Fun sentences involving imaginary worlds, mythical creatures, or heroic quests.",
  },
];

export * from "./interlinear-lines";
export * from "./spaced-repetition-stages";
export * from "./expercises";
export * from "./session-recommendations";
