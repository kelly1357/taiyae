export type UserRole = 'admin' | 'moderator' | 'member';

export interface User {
  id: number | string;
  username: string;
  email: string;
  imageUrl?: string; // Avatar image URL
  authProvider?: string;
  characters?: string[]; // List of Character IDs
  activeCharacterId?: string | number; // Currently selected character for posting
  playerInfo?: string; // Player biography/description
  facebook?: string;
  instagram?: string;
  discord?: string;
  isModerator?: boolean; // Is_Moderator column - true if user is a moderator
  isAdmin?: boolean; // Is_Admin column - true if user is an admin
  role?: UserRole; // 'admin', 'moderator', or 'member'
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

export type CharacterStatus = 'Active' | 'Inactive' | 'Dead';

export interface Character {
  id: string;
  userId: string;
  odUserId?: number;
  username?: string;
  userCreatedAt?: string;
  name: string;
  surname?: string;
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
  heightId?: number;
  build?: string;
  buildId?: number;
  experience?: number;
  physical?: number;
  knowledge?: number;
  totalSkill?: number;
  isOnline?: boolean;
  icPostCount?: number;
  oocPostCount?: number;
  father?: string;
  mother?: string;
  birthplace?: string;
  siblings?: string;
  pups?: string;
  playerInfo?: string;
  facebook?: string;
  instagram?: string;
  discord?: string;
  spiritSymbol?: string;
  profileImages?: string[]; // Up to 4 profile images
  status?: CharacterStatus; // 'Active', 'Inactive', or 'Dead'
  deathDate?: string; // Horizon date of death (e.g., "HY0, Early Summer")
  showInDropdown?: boolean; // Whether to show in header dropdown (for inactive characters)
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
  imageUrl?: string; // For the region background
  headerImageUrl?: string; // For the homepage header above thread info
}

export interface OOCForum {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  activeThreads: number;
  totalReplies: number;
  latestThreadId?: string;
  latestThreadTitle?: string;
  latestThreadUpdatedAt?: string;
  latestThreadAuthorName?: string;
  latestThreadAuthorId?: string;
  latestThreadCharacterId?: string;
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

export interface ThreadlogEntry {
  threadId: number;
  threadTitle: string;
  threadCreated: string;
  replyCount: number;
  participants: string;
  participantIds: string;
  lastPosterId: number;
  lastPosterName: string;
  lastPostDate: string;
}
