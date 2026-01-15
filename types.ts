
export enum UserRole {
  USER = 'user',
  IMAM = 'imam',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean; // For banning/activating
  location?: { lat: number; lng: number };
  image?: string; // optional avatar image
  followingMosques: string[]; // IDs of followed mosques
  registeredLessons: string[]; // IDs of registered lessons
  managedMosqueId?: string; // ID of the mosque managed by this user (if IMAM)
  preferences?: {
    largeFont: boolean;
    highContrast: boolean;
  };
  rankingScore?: number; // Global Challenge Ranking Score (Default 10)
}

export interface Mosque {
  id: string;
  name: string;
  imamName: string;
  address: string;
  phone?: string;
  location: { lat: number; lng: number };
  image: string;
  followersCount: number;
  amenities?: string[]; // e.g. ['AC', 'Women Section', 'Parking']
}

export interface Lesson {
  id: string;
  mosqueId: string;
  title: string;
  sheikhName: string;
  date: string; // ISO date string
  time: string;
  type: 'lecture' | 'course' | 'competition' | 'activity';
  description: string;
}

export interface Comment {
  id: string;
  userId?: string;
  userName: string;
  content: string;
  parentId?: string | null; // ID of parent comment for replies
  likes?: number;
  createdAt: string;
  pending?: boolean; // true if not yet persisted to server
}

export interface Post {
  id: string;
  mosqueId: string;
  userId: string;
  content: string;
  image?: string;
  videoUrl?: string; // For video posts
  likes: number;
  shares: number; // Number of shares
  comments: Comment[];
  createdAt: string;
  type: 'announcement' | 'lesson_alert' | 'general' | 'video';
  shareUrl?: string; // Shareable URL for this post
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface PrayerLog {
  userId: string;
  date: string; // YYYY-MM-DD
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface Khatma {
  id: string;
  title: string;
  completedParts: number[]; // Array of Juz numbers (1-30) that are taken/completed
  participants: { juz: number; userId?: string; userName: string }[];
}
