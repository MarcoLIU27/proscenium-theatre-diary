import { Production } from '../types';

export interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface MonthlyStat {
  monthKey: string; // "2026-07"
  label: string; // "Jul 2026"
  count: number;
}

export interface RatingCount {
  stars: number;
  count: number;
}

export function computeWatchStats(productions: Production[]) {
  const totalShows = productions.length;
  if (totalShows === 0) {
    return {
      totalShows: 0,
      totalMusicals: 0,
      totalPlays: 0,
      totalOther: 0,
      averageRating: 0,
      totalSpent: 0,
      currencySymbol: '$',
      stageDoorCount: 0,
      topVenue: 'N/A',
      categories: [],
      monthlyBreakdown: [],
      ratingDistribution: [],
      topRatedShows: []
    };
  }

  let totalMusicals = 0;
  let totalPlays = 0;
  let totalOther = 0;
  let ratingSum = 0;
  let totalSpent = 0;
  let stageDoorCount = 0;
  const currencySymbol = productions.find(p => p.currency)?.currency || '$';

  const categoryMap: Record<string, number> = {};
  const venueMap: Record<string, number> = {};
  const monthMap: Record<string, number> = {};
  const ratingMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  productions.forEach(p => {
    // Category count
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    if (p.category === 'Musical') totalMusicals++;
    else if (p.category === 'Play') totalPlays++;
    else totalOther++;

    // Ratings
    ratingSum += p.rating;
    const roundedRating = Math.min(5, Math.max(1, Math.floor(p.rating)));
    ratingMap[roundedRating] = (ratingMap[roundedRating] || 0) + 1;

    // Venue
    if (p.venue) {
      venueMap[p.venue] = (venueMap[p.venue] || 0) + 1;
    }

    // Money
    if (p.ticketPrice && !isNaN(p.ticketPrice)) {
      totalSpent += p.ticketPrice;
    }

    // Month
    if (p.date) {
      const monthKey = p.date.substring(0, 7); // "YYYY-MM"
      monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
    }
  });

  const averageRating = parseFloat((ratingSum / totalShows).toFixed(1));

  // Category breakdown list
  const categoryColors: Record<string, string> = {
    Musical: '#e11d48', // rose-600
    Play: '#2563eb', // blue-600
    Opera: '#9333ea', // purple-600
    Dance: '#d97706', // amber-600
    Concert: '#059669', // emerald-600
    Symphony: '#059669', // emerald-600 (legacy fallback)
    Other: '#6b7280', // gray-500
    Others: '#6b7280' // gray-500
  };

  const categories: CategoryStat[] = Object.keys(categoryMap).map(cat => ({
    name: cat,
    count: categoryMap[cat],
    percentage: Math.round((categoryMap[cat] / totalShows) * 100),
    color: categoryColors[cat] || '#6b7280'
  })).sort((a, b) => b.count - a.count);

  // Top venue
  let topVenue = 'N/A';
  let maxVenueCount = 0;
  Object.entries(venueMap).forEach(([v, count]) => {
    if (count > maxVenueCount) {
      maxVenueCount = count;
      topVenue = v;
    }
  });

  // Monthly breakdown sorted chronologically
  const sortedMonthKeys = Object.keys(monthMap).sort();
  const monthlyBreakdown: MonthlyStat[] = sortedMonthKeys.map(key => {
    const [year, month] = key.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const label = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return {
      monthKey: key,
      label,
      count: monthMap[key]
    };
  });

  // Rating distribution
  const ratingDistribution: RatingCount[] = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: ratingMap[stars] || 0
  }));

  // Top rated shows sorted by rating desc then date desc
  const topRatedShows = [...productions]
    .sort((a, b) => b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return {
    totalShows,
    totalMusicals,
    totalPlays,
    totalOther,
    averageRating,
    totalSpent,
    currencySymbol,
    stageDoorCount,
    topVenue,
    categories,
    monthlyBreakdown,
    ratingDistribution,
    topRatedShows
  };
}
