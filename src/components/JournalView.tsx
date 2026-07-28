import React, { useState } from 'react';
import { Production, FilterState } from '../types';
import { Search, Star, Calendar, MapPin, Filter, SlidersHorizontal, Grid, List, Plus, Ticket, Trash2 } from 'lucide-react';

interface JournalViewProps {
  productions: Production[];
  onSelectProduction: (production: Production) => void;
  onOpenAddModal: () => void;
  onDeleteProduction: (id: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  productions,
  onSelectProduction,
  onOpenAddModal,
  onDeleteProduction,
}) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'All',
    minRating: 0,
    year: 'All',
    venue: 'All',
    sortBy: 'date-desc',
  });

  // Extract unique venues & years for filter dropdowns
  const uniqueVenues = Array.from(new Set(productions.map((p) => p.venue))).filter(Boolean);
  const uniqueYears = Array.from(
    new Set(productions.map((p) => p.date ? p.date.substring(0, 4) : '2026'))
  ).sort().reverse();

  // Filter & Sort productions
  const filteredProductions = productions.filter((p) => {
    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchVenue = p.venue.toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      const matchTag = (p.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchVenue && !matchNotes && !matchTag) {
        return false;
      }
    }

    // Category
    if (filters.category !== 'All' && p.category !== filters.category) {
      return false;
    }

    // Min Rating
    if (filters.minRating > 0 && p.rating < filters.minRating) {
      return false;
    }

    // Year
    if (filters.year !== 'All' && p.date && !p.date.startsWith(filters.year)) {
      return false;
    }

    // Venue
    if (filters.venue !== 'All' && p.venue !== filters.venue) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (filters.sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (filters.sortBy === 'rating-desc') {
      return b.rating - a.rating;
    }
    if (filters.sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Top Header & Search Filter Bar */}
      <div className="bg-white border-2 border-[#111113] p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#111113]/50" />
            <input
              id="input-journal-search"
              type="text"
              placeholder="Search by show title, venue, cast member, song or tag..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] placeholder-[#111113]/50 pl-11 pr-4 py-3 text-sm font-medium outline-none transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters({ ...filters, searchQuery: '' })}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 label bg-[#111113] hover:bg-[#2A5AEE] text-white px-2 py-0.5 cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort & Layout Toggles */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#EEECE7] px-4 py-2 border border-[#111113] text-xs font-mono text-[#111113]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#111113]" />
              <span className="label text-[10px]">Sort:</span>
              <select
                id="select-journal-sort"
                value={filters.sortBy}
                onChange={(e: any) => setFilters({ ...filters, sortBy: e.target.value })}
                className="bg-transparent text-[#111113] font-bold outline-none cursor-pointer text-xs font-mono"
              >
                <option value="date-desc">Latest Date First</option>
                <option value="date-asc">Earliest Date First</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="title-asc">Title A-Z</option>
              </select>
            </div>

            {/* Grid / List Layout Switcher */}
            <div className="flex items-center bg-[#EEECE7] p-1 border border-[#111113]">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 transition-colors cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-[#111113] text-white' : 'text-[#111113]/60 hover:text-[#111113]'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 transition-colors cursor-pointer ${
                  layoutMode === 'list' ? 'bg-[#111113] text-white' : 'text-[#111113]/60 hover:text-[#111113]'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#111113]/20 text-xs font-mono">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label text-[10px] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#111113]" /> Type:
            </span>
            {['All', 'Musical', 'Play', 'Opera', 'Dance', 'Concert', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilters({ ...filters, category: cat })}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  filters.category === cat
                    ? 'bg-[#111113] text-white border-[#111113]'
                    : 'bg-[#F8F7F4] text-[#111113]/70 hover:text-[#111113] border-[#111113]/20 hover:border-[#111113]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rating filter dropdown */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="label text-[10px]">Rating:</span>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                className="bg-[#F8F7F4] border border-[#111113] text-[#111113] px-3 py-1 text-xs outline-none font-bold font-mono cursor-pointer"
              >
                <option value={0}>All Ratings</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars Only</option>
                <option value={4}>⭐⭐⭐⭐ 4+ Stars</option>
                <option value={3}>⭐⭐⭐ 3+ Stars</option>
              </select>
            </div>

            {/* Year filter */}
            {uniqueYears.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="label text-[10px]">Year:</span>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="bg-[#F8F7F4] border border-[#111113] text-[#111113] px-3 py-1 text-xs outline-none font-bold font-mono cursor-pointer"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Production Cards Grid or List */}
      {filteredProductions.length > 0 ? (
        <div
          className={
            layoutMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredProductions.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onSelectProduction(prod)}
              className={`group cursor-pointer bg-white border-2 border-[#111113] hover:border-[#2A5AEE] overflow-hidden transition-all duration-200 flex ${
                layoutMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row items-stretch'
              }`}
            >
              {/* Show Poster Image */}
              <div
                className={`relative overflow-hidden bg-[#111113] ${
                  layoutMode === 'grid'
                    ? 'h-64 sm:h-72 w-full'
                    : 'h-48 sm:h-auto sm:w-56 shrink-0'
                }`}
              >
                <img
                  src={prod.posterUrl}
                  alt={prod.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Category Pill Tag */}
                <div className="absolute top-3 left-3 bg-[#EEECE7] border border-[#111113] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#111113]">
                  {prod.category}
                </div>

                {/* Theatre Type badge */}
                {prod.theatreType && (
                  <div
                    className="absolute top-3 right-3 bg-[#2A5AEE] text-white border border-[#111113] text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5"
                  >
                    {prod.theatreType}
                  </div>
                )}

                {/* Date overlay on grid poster bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-mono">
                  <span className="flex items-center gap-1.5 bg-[#111113] border border-white/20 px-2.5 py-0.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#2A5AEE]" />
                    {prod.date}
                  </span>
                  {prod.ticketPrice && (
                    <span className="bg-[#2A5AEE] border border-[#111113] text-white font-bold px-2.5 py-0.5 text-[11px]">
                      {prod.currency || '$'}{prod.ticketPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Content Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Rating Stars & Title */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-oswald text-3xl font-bold uppercase text-[#111113] group-hover:text-[#2A5AEE] transition-colors line-clamp-1 leading-tight">
                      {prod.title}
                    </h3>

                    {/* Star Rating Display & Quick Delete */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center space-x-1 bg-[#EEECE7] border border-[#111113] px-2 py-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="text-xs font-mono font-bold text-[#111113]">{prod.rating}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmingDeleteId === prod.id) {
                            onDeleteProduction(prod.id);
                            setConfirmingDeleteId(null);
                          } else {
                            setConfirmingDeleteId(prod.id);
                          }
                        }}
                        className={`p-1.5 border border-[#111113] transition-all cursor-pointer ${
                          confirmingDeleteId === prod.id
                            ? 'bg-red-600 text-white border-red-700 px-2'
                            : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-red-600 hover:bg-red-50 hover:border-red-300'
                        }`}
                        title={confirmingDeleteId === prod.id ? "Click to confirm delete" : "Delete entry"}
                      >
                        {confirmingDeleteId === prod.id ? (
                          <span className="text-[10px] font-mono font-bold uppercase">Confirm?</span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Venue & City */}
                  <div className="flex items-center space-x-1.5 text-xs text-[#111113]/80 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-[#2A5AEE] shrink-0" />
                    <span className="truncate uppercase">{prod.venue}</span>
                    {prod.city && <span className="text-[#111113]/50">• {prod.city}</span>}
                  </div>

                  {/* Notes or Synopsis excerpt */}
                  {prod.notes ? (
                    <p className="mt-3 text-xs text-[#111113]/90 line-clamp-2 italic border-l-2 border-[#2A5AEE] pl-3 py-1 bg-[#F8F7F4] font-normal leading-relaxed">
                      "{prod.notes}"
                    </p>
                  ) : prod.synopsis ? (
                    <p className="mt-3 text-xs text-[#111113]/80 line-clamp-2 border-l-2 border-[#111113]/40 pl-3 py-1 bg-[#F8F7F4] font-normal leading-relaxed">
                      {prod.synopsis}
                    </p>
                  ) : null}
                </div>

                {/* Bottom Tags & Theatre Type */}
                <div className="pt-3 border-t border-[#111113]/15 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  {prod.theatreType ? (
                    <span className="text-[#111113]/70 truncate max-w-[180px]">
                      Production: <strong className="text-[#111113]">{prod.theatreType}</strong>
                    </span>
                  ) : (
                    <span className="text-[#111113]/40 italic">Broadway</span>
                  )}

                  {/* Tags */}
                  {prod.tags && prod.tags.length > 0 && (
                    <div className="flex items-center space-x-1 overflow-hidden">
                      {prod.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#EEECE7] border border-[#111113]/20 text-[#111113] px-2 py-0.5 text-[10px] uppercase font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                      {prod.tags.length > 2 && (
                        <span className="text-[#111113]/50 text-[10px]">+{prod.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Search/Filter State */
        <div className="bg-white border-2 border-[#111113] p-12 text-center text-[#111113]/70 space-y-4">
          <div className="w-16 h-16 bg-[#2A5AEE]/10 border border-[#111113] flex items-center justify-center mx-auto text-[#2A5AEE]">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="font-oswald text-3xl font-bold uppercase text-[#111113]">No Productions Found</h3>
          <p className="font-mono text-xs uppercase tracking-wider text-[#111113]/70 max-w-md mx-auto">
            No show logs matched your current filters or search query. Try clearing filters or logging your first theatre experience!
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-2 bg-[#2A5AEE] hover:bg-[#1f47c9] text-white border-2 border-[#111113] font-oswald text-base uppercase font-bold px-6 py-3 tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_#111113]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log a Show Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

