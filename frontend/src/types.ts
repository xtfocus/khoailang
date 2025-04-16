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
  ownedCards: number;
  sharedCards: number;
  cardsToReview: number;
  averageLevel: number;
  streak: number;
  totalCatalogs: number;
  ownedCatalogs: number;
  sharedCatalogs: number;
}

export interface CatalogOwner {
  username: string | null;
  email: string;
}

export interface Catalog {
  id: number;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  created_at: string;
  flashcards: Flashcard[];
  notification?: {
    type: string;
    message: string;
  };
  is_owner?: boolean;
  owner: CatalogOwner;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}