export interface User {
  id: number | string;
  username: string;
  email: string;
  authProvider?: string;
  characters?: string[]; // List of Character IDs
  activeCharacterId?: string | number; // Currently selected character for posting
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  dateEarned: string;
}

export interface Pack {
  id: string;
  name: string;
  ranks: string[]; // Ordered list of ranks
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface Character {
  id: string;
  userId: string;
  username?: string;
  name: string;
  sex: 'Male' | 'Female' | 'Other';
  age: string; // e.g., "3 years"
  healthStatus: string; // e.g., "100%", "Injured"
  imageUrl: string;
  skillPoints: number;
  achievements: Achievement[];
  packId?: string;
  packName?: string;
  rank?: string;
  bio?: string;
  monthsAge?: number;
  healthStatusId?: number;
  height?: string;
  build?: string;
  experience?: number;
  physical?: number;
  knowledge?: number;
  totalSkill?: number;
  isOnline?: boolean;
}

export interface ForumSubarea {
  id: string;
  name: string;
  description?: string;
}

export interface ForumRegion {
  id: string;
  name: string;
  description: string;
  subareas: ForumSubarea[];
  imageUrl?: string; // For the region banner/map
}

export interface Reply {
  id: string;
  threadId: string;
  authorId: string; // Character ID
  content: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  title: string;
  authorId: string; // Character ID
  regionId: string;
  subareaId?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  replies: Reply[];
}
