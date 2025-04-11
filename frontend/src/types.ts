export interface FlashCard {
  id: string;
  front: string;
  back: string;
  lastReviewed: Date;
  nextReview: Date;
  level: number;
}

export interface UserStats {
  totalCards: number;
  cardsToReview: number;
  averageLevel: number;
  streak: number;
}