export type CategoryType = 
  | 'Musical'
  | 'Play'
  | 'Opera'
  | 'Dance'
  | 'Concert'
  | 'Other';

export type TheatreType =
  | 'Broadway'
  | 'Off-Broadway'
  | 'Touring'
  | 'Regional'
  | 'Community';

export type ShowtimeType = 'Matinee' | 'Evening';

export interface Production {
  id: string;
  title: string;
  category: CategoryType;
  theatreType?: TheatreType;
  date: string; // YYYY-MM-DD
  time?: ShowtimeType;
  venue: string;
  city?: string;
  rating: number; // 1 to 5
  posterUrl: string;
  notes?: string;
  ticketPrice?: number;
  currency?: string;
  playbillPhoto?: string;
  tags?: string[];
  synopsis?: string;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  theatreType?: string;
  minRating: number;
  year: string;
  venue: string;
  sortBy: 'date-desc' | 'date-asc' | 'rating-desc' | 'title-asc';
}

export interface AIReportInsight {
  title: string;
  summary: string;
  topGenre: string;
  personalizedQuote: string;
  recommendations: string[];
}
