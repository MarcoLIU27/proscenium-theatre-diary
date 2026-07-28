import React, { useState, useEffect } from 'react';
import { Production, CategoryType, TheatreType, ShowtimeType } from '../types';
import { X, Star, Sparkles, Ticket, Search, Image, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddEditProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (production: Production) => void;
  editingProduction?: Production | null;
  initialDate?: string;
}

const PRESET_POSTERS = [
  { name: 'Broadway Stage Lighting', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop' },
  { name: 'Emerald Velvet Curtain', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop' },
  { name: 'Gold Spotlight Drama', url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=800&auto=format&fit=crop' },
  { name: 'Red Vintage Opera House', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop' },
  { name: 'Classic Stage Play', url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop' },
  { name: 'Nightlife Cabaret', url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=800&auto=format&fit=crop' },
];

export const AddEditProductionModal: React.FC<AddEditProductionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduction,
  initialDate,
}) => {
  const [descriptionInput, setDescriptionInput] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Musical');
  const [theatreType, setTheatreType] = useState<TheatreType>('Broadway');
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<ShowtimeType>('Evening');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('New York');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [posterUrl, setPosterUrl] = useState(PRESET_POSTERS[0].url);
  const [notes, setNotes] = useState('');
  const [ticketPrice, setTicketPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('$');
  const [tagsInput, setTagsInput] = useState('');
  const [synopsis, setSynopsis] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [posterSearchKeyword, setPosterSearchKeyword] = useState('');
  const [posterSearchResults, setPosterSearchResults] = useState<Array<{ title: string; contentUrl: string; thumbnailUrl: string; hostPageUrl?: string }>>([]);
  const [isSearchingPosters, setIsSearchingPosters] = useState(false);

  useEffect(() => {
    if (editingProduction) {
      setDescriptionInput('');
      setTitle(editingProduction.title);
      setCategory(editingProduction.category);
      setTheatreType(editingProduction.theatreType || 'Broadway');
      setDate(editingProduction.date);
      setTime(editingProduction.time === 'Matinee' ? 'Matinee' : 'Evening');
      setVenue(editingProduction.venue);
      setCity(editingProduction.city || 'New York');
      setRating(editingProduction.rating);
      setPosterUrl(editingProduction.posterUrl);
      setNotes(editingProduction.notes || '');
      setTicketPrice(editingProduction.ticketPrice !== undefined ? editingProduction.ticketPrice : '');
      setCurrency(editingProduction.currency || '$');
      setTagsInput((editingProduction.tags || []).join(', '));
      setSynopsis(editingProduction.synopsis || '');
      setPosterSearchKeyword(`${editingProduction.title} ${editingProduction.venue || ''} poster`.trim());
      setPosterSearchResults([]);
    } else {
      // Reset defaults
      setDescriptionInput('');
      setTitle('');
      setCategory('Musical');
      setTheatreType('Broadway');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setTime('Evening');
      setVenue('');
      setCity('New York');
      setRating(5);
      setPosterUrl(PRESET_POSTERS[0].url);
      setNotes('');
      setTicketPrice('');
      setCurrency('$');
      setTagsInput('');
      setSynopsis('');
      setAiMessage('');
      setPosterSearchKeyword('');
      setPosterSearchResults([]);
    }
  }, [editingProduction, initialDate, isOpen]);

  // Execute Bing Poster Image Search
  const performPosterSearch = async (keywordsToSearch?: string, autoSelectFirst = false) => {
    const query = (keywordsToSearch || posterSearchKeyword || title + ' ' + (venue || theatreType) + ' poster').trim();
    if (!query) return;

    setIsSearchingPosters(true);
    try {
      const res = await fetch(`/api/poster-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).slice(0, 3);
        setPosterSearchResults(results);
        if (autoSelectFirst && results.length > 0 && results[0].contentUrl) {
          setPosterUrl(results[0].contentUrl);
        }
      }
    } catch (err) {
      console.error("Poster search failed:", err);
    } finally {
      setIsSearchingPosters(false);
    }
  };

  if (!isOpen) return null;

  // AI Autofill from Express Gemini endpoint
  const handleAiAutofill = async () => {
    const queryText = (descriptionInput || title || '').trim();
    if (!queryText) {
      setAiMessage('Please enter a description or show title first.');
      return;
    }
    setAiLoading(true);
    setAiMessage('Analyzing production details with AI...');

    try {
      const res = await fetch('/api/gemini/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionInput, title }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.category && ['Musical', 'Play', 'Opera', 'Dance', 'Concert', 'Other'].includes(data.category)) {
          setCategory(data.category as CategoryType);
        }
        if (data.theatreType && ['Broadway', 'Off-Broadway', 'Touring', 'Regional', 'Community', 'Other'].includes(data.theatreType)) {
          setTheatreType(data.theatreType as TheatreType);
        }
        if (data.venue) setVenue(data.venue);
        if (data.city) setCity(data.city);
        if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) setDate(data.date);
        if (data.time === 'Matinee' || data.time === 'Evening') setTime(data.time as ShowtimeType);
        if (typeof data.rating === 'number' && data.rating >= 1 && data.rating <= 5) setRating(data.rating);
        if (typeof data.ticketPrice === 'number') setTicketPrice(data.ticketPrice);
        if (data.currency) setCurrency(data.currency);
        if (data.notes) setNotes(data.notes);
        if (data.synopsis) setSynopsis(data.synopsis);
        if (data.tags && Array.isArray(data.tags)) setTagsInput(data.tags.join(', '));

        // Poster search query generated by Gemini
        const posterQuery = data.posterSearchQuery || `${data.title || title} ${data.venue || ''} poster`.trim();
        setPosterSearchKeyword(posterQuery);
        setAiMessage('✨ AI extracted show details & searching official posters...');

        // Auto search for top 3 Bing poster images & select top result
        await performPosterSearch(posterQuery, true);
        setAiMessage('✨ AI extracted details & updated poster artwork!');
      } else {
        setAiMessage('Could not extract show details via AI.');
      }
    } catch (err) {
      console.error(err);
      setAiMessage('Error analyzing show info.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim()) return;

    const parsedTags = tagsInput
      ? tagsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newProd: Production = {
      id: editingProduction ? editingProduction.id : `prod-${Date.now()}`,
      title: title.trim(),
      category,
      theatreType,
      date,
      time,
      venue: venue.trim(),
      city: city.trim(),
      rating,
      posterUrl: posterUrl.trim() || PRESET_POSTERS[0].url,
      notes: notes.trim(),
      ticketPrice: ticketPrice !== '' ? Number(ticketPrice) : undefined,
      currency,
      tags: parsedTags,
      synopsis: synopsis.trim(),
      createdAt: editingProduction ? editingProduction.createdAt : new Date().toISOString(),
    };

    onSave(newProd);

    // Trigger celebratory confetti on save
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    onClose();
  };

  const categories: CategoryType[] = ['Musical', 'Play', 'Opera', 'Dance', 'Concert', 'Other'];
  const theatreTypes: TheatreType[] = ['Broadway', 'Off-Broadway', 'Touring', 'Regional', 'Community', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-2 border-[#111113] max-w-2xl w-full my-8 shadow-2xl overflow-hidden text-[#111113] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b-2 border-[#111113] flex items-center justify-between bg-[#EEECE7]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#2A5AEE] border border-[#111113] text-white">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="font-oswald text-2xl font-bold uppercase text-[#111113]">
              {editingProduction ? 'Edit Theatre Diary Entry' : 'Log Production Attendance'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white border border-[#111113] hover:bg-[#111113] hover:text-white text-[#111113] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Describe this production (Natural Language Input) with AI Auto-Fill button on the right */}
          <div className="space-y-2 bg-[#F8F7F4] border-2 border-[#111113] p-4 shadow-[3px_3px_0px_0px_#111113]">
            <div className="flex items-center justify-between">
              <label className="block label text-[#111113] flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-[#2A5AEE]" />
                Describe this production
              </label>
              <span className="text-[10px] font-mono text-[#111113]/60 uppercase">
                Natural Language AI
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
              <textarea
                rows={2}
                placeholder="e.g. Saw Wicked yesterday night at Gershwin Theatre in NYC, Broadway show, paid $140, 5 stars rating, loved Defying Gravity!"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className="w-full sm:flex-1 bg-white border border-[#111113] focus:border-[#2A5AEE] text-[#111113] p-2.5 text-xs outline-none font-medium leading-relaxed"
              />
              <button
                type="button"
                onClick={handleAiAutofill}
                disabled={aiLoading || (!descriptionInput.trim() && !title.trim())}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#2A5AEE] text-white hover:bg-[#1e44c2] border-2 border-[#111113] px-5 py-2.5 font-oswald text-xs font-bold uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_0px_#111113]"
              >
                <Sparkles className={`w-4 h-4 text-white ${aiLoading ? 'animate-spin' : ''}`} />
                <div className="text-left leading-tight">
                  <div>{aiLoading ? 'Analyzing...' : 'AI Auto-Fill'}</div>
                  <div className="text-[9px] font-mono font-normal normal-case opacity-90">Extract details</div>
                </div>
              </button>
            </div>
            {aiMessage && <p className="text-xs text-[#2A5AEE] font-bold font-mono mt-1">{aiMessage}</p>}
          </div>

          {/* Production Title */}
          <div className="space-y-1.5">
            <label className="block label text-[#111113]">
              Production Title <span className="text-[#2A5AEE]">*</span>
            </label>
            <input
              id="input-modal-title"
              type="text"
              required
              placeholder="e.g. Wicked, Hamilton, Hadestown, Cabaret"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-4 py-2.5 text-sm outline-none font-medium"
            />
          </div>

          {/* Performance Type Selector Pills */}
          <div className="space-y-2">
            <label className="block label text-[#111113]">
              PERFORMANCE TYPE
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    category === cat
                      ? 'bg-[#111113] text-white border-[#111113]'
                      : 'bg-[#F8F7F4] text-[#111113]/70 hover:text-[#111113] border-[#111113]/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Production Type Selector Pills */}
          <div className="space-y-2">
            <label className="block label text-[#111113]">
              Production
            </label>
            <div className="flex flex-wrap gap-2">
              {theatreTypes.map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setTheatreType(th)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    theatreType === th
                      ? 'bg-[#2A5AEE] text-white border-[#111113]'
                      : 'bg-[#F8F7F4] text-[#111113]/70 hover:text-[#111113] border-[#111113]/30'
                  }`}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>

          {/* Date, Showtime, Venue, City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block label text-[#111113]">
                Performance Date <span className="text-[#2A5AEE]">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-3.5 py-2 text-xs outline-none font-mono"
              />
            </div>

            {/* Showtime Selection: Matinee / Evening */}
            <div className="space-y-1.5">
              <label className="block label text-[#111113]">
                Showtime
              </label>
              <div className="grid grid-cols-2 gap-2 h-[38px]">
                <button
                  type="button"
                  onClick={() => setTime('Matinee')}
                  className={`flex items-center justify-center font-mono text-xs font-bold uppercase transition-all cursor-pointer border ${
                    time === 'Matinee'
                      ? 'bg-[#111113] text-white border-[#111113]'
                      : 'bg-[#F8F7F4] text-[#111113]/70 hover:text-[#111113] border-[#111113]/30'
                  }`}
                >
                  ☀️ Matinee
                </button>
                <button
                  type="button"
                  onClick={() => setTime('Evening')}
                  className={`flex items-center justify-center font-mono text-xs font-bold uppercase transition-all cursor-pointer border ${
                    time === 'Evening'
                      ? 'bg-[#111113] text-white border-[#111113]'
                      : 'bg-[#F8F7F4] text-[#111113]/70 hover:text-[#111113] border-[#111113]/30'
                  }`}
                >
                  🌙 Evening
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block label text-[#111113]">
                Theatre / Venue <span className="text-[#2A5AEE]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gershwin Theatre, Sondheim Theatre"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-3.5 py-2 text-xs outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block label text-[#111113]">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. New York, London, Chicago"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-3.5 py-2 text-xs outline-none font-mono"
              />
            </div>
          </div>

          {/* Rating Selector */}
          <div className="space-y-2 bg-[#F8F7F4] p-4 border border-[#111113]">
            <label className="block label text-[#111113] flex items-center justify-between">
              <span>Overall Rating</span>
              <span className="text-amber-600 font-bold text-xs">{rating} / 5 Stars</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-neutral-300 fill-neutral-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Poster Artwork & Brave Image Search Integration */}
          <div className="space-y-3 bg-[#F8F7F4] border-2 border-[#111113] p-4 shadow-[3px_3px_0px_0px_#111113]">
            <div className="flex items-center justify-between">
              <label className="block label text-[#111113] font-bold flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[#2A5AEE]" />
                Production Poster Artwork
              </label>
              <span className="text-[10px] font-mono text-[#2A5AEE] font-bold uppercase bg-[#2A5AEE]/10 px-2 py-0.5 border border-[#2A5AEE]/30">
                Brave Search Integrated
              </span>
            </div>

            {/* Search Bar for Brave Image Keywords */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#111113]/80 font-medium">
                Search poster keywords (e.g. "the lunch box musical berkeley REP poster" or "Sound of music tour poster"):
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="e.g. Wicked Broadway poster, The Lunch Box musical Berkeley REP poster"
                    value={posterSearchKeyword}
                    onChange={(e) => setPosterSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        performPosterSearch();
                      }
                    }}
                    className="w-full bg-white border border-[#111113] focus:border-[#2A5AEE] text-[#111113] pl-8 pr-3 py-2 text-xs outline-none font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-[#111113]/50 absolute left-2.5 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() => performPosterSearch()}
                  disabled={isSearchingPosters || !posterSearchKeyword.trim()}
                  className="flex items-center space-x-1.5 bg-[#111113] text-white hover:bg-[#2A5AEE] px-3.5 py-2 font-oswald text-xs font-bold uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Search className={`w-3.5 h-3.5 ${isSearchingPosters ? 'animate-spin' : ''}`} />
                  <span>{isSearchingPosters ? 'Searching...' : 'Search Brave'}</span>
                </button>
              </div>
            </div>

            {/* Display Top 3 Image Results */}
            {posterSearchResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#111113]/15">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#111113] flex items-center gap-1">
                    ✨ Top 3 Poster Options:
                  </span>
                  <span className="text-[10px] text-[#111113]/60 italic">Click image to select & auto-fill link</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {posterSearchResults.map((result, idx) => {
                    const isSelected = posterUrl === result.contentUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPosterUrl(result.contentUrl)}
                        className={`group relative flex flex-col items-center bg-white border-2 text-left p-1.5 transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-[#2A5AEE] ring-2 ring-[#2A5AEE]/30 shadow-md scale-[1.02]'
                            : 'border-[#111113]/30 hover:border-[#111113] hover:shadow-sm'
                        }`}
                      >
                        <div className="relative w-full h-32 bg-neutral-100 overflow-hidden border border-[#111113]/20 mb-1.5">
                          <img
                            src={result.thumbnailUrl || result.contentUrl}
                            alt={result.title || `Poster ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-[#2A5AEE] text-white p-1 rounded-full shadow-md flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 truncate font-mono">
                            Result #{idx + 1}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#111113] font-medium line-clamp-2 leading-tight w-full">
                          {result.title || `Poster option ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Image Link Input */}
            <div className="space-y-1 pt-2 border-t border-[#111113]/10">
              <span className="text-[10px] text-[#111113]/70 font-mono block">Direct Image Link URL:</span>
              <input
                type="url"
                placeholder="Paste custom image URL (e.g. https://...)"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full bg-white border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-3 py-1.5 text-xs outline-none font-mono"
              />
            </div>

            {/* Classic Presets Gallery */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#111113]/60 font-mono block">Or select theatrical background preset:</span>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_POSTERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPosterUrl(preset.url)}
                    className={`relative h-12 border transition-all cursor-pointer ${
                      posterUrl === preset.url ? 'border-2 border-[#2A5AEE] scale-105 shadow-sm' : 'border-[#111113]/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Price & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block label text-[#111113]">
                Ticket Price
              </label>
              <div className="flex gap-1">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[#F8F7F4] border border-[#111113] text-[#111113] px-2 text-xs outline-none font-bold font-mono"
                >
                  <option value="$">$</option>
                  <option value="£">£</option>
                  <option value="€">€</option>
                </select>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-3 py-2 text-xs outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block label text-[#111113]">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Broadway, Front Row, Revival, Tony Winner"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] px-3 py-2 text-xs outline-none font-mono"
              />
            </div>
          </div>

          {/* Show Plot & Synopsis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block label text-[#111113]">
                Show Plot & Synopsis
              </label>
              <span className="text-[10px] font-mono text-[#2A5AEE] font-bold">
                ✨ Auto-filled by AI button
              </span>
            </div>
            <textarea
              rows={3}
              placeholder="Enter a brief plot summary, or click 'AI Auto-Fill Show Info' above..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] p-3 text-xs outline-none font-normal leading-relaxed"
            />
          </div>

          {/* Personal Review Notes */}
          <div className="space-y-1.5">
            <label className="block label text-[#111113]">
              Personal Review & Notes
            </label>
            <textarea
              rows={3}
              placeholder="What stood out? Vocals, set design, orchestra, memorable moments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] p-3 text-sm outline-none font-normal leading-relaxed"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t-2 border-[#111113] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#111113] text-[#111113] hover:bg-[#111113] hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-modal-submit"
              type="submit"
              className="bg-[#2A5AEE] hover:bg-[#1f47c9] text-white border-2 border-[#111113] font-oswald text-sm font-bold uppercase tracking-wider px-6 py-2.5 shadow-[2px_2px_0px_0px_#111113] transition-all cursor-pointer"
            >
              {editingProduction ? 'Save Changes' : 'Log Production Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

