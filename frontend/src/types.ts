export interface Flashcard {
  id: string;
  front: string;
  back: string;
  language_id: number;
  language?: {
    id: number;
    name: string;
    code: string;
  };
  owner_id: number;
  authorName?: string;
  isOwner?: boolean;
  lastReviewed?: Date;
  nextReview?: Date;
  memoryStrength?: number;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface UserStats {
  totalCards: number;
  cardsToReview: number;
  averageLevel: number;
  streak: number;
}

export interface Catalog {
  id: number;
  name: string;
  description?: string;
  visibility: string;
  created_at: string;
  flashcards: Flashcard[];
  notification?: {
    type: string;
    message: string;
  };
}

export interface Language {
  id: number;
  name: string;
  code: string;
}