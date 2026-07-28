import React, { useState, useRef } from 'react';
import { Production } from '../types';
import { Download, CheckCircle2, X, Star, Calendar, MapPin, Tag, Sparkles, Ticket, Eye, EyeOff } from 'lucide-react';
import { getProxiedImageUrl } from '../utils/imageUtils';
import { exportElementToPng } from '../utils/exportUtils';

interface MonthlyShowDetailsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productions: Production[];
  initialMonthKey?: string; // e.g. "2026-07"
}

export const MonthlyShowDetailsExportModal: React.FC<MonthlyShowDetailsExportModalProps> = ({
  isOpen,
  onClose,
  productions,
  initialMonthKey,
}) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [includeTicketPrice, setIncludeTicketPrice] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Extract all unique months available in productions (sorted descending)
  const availableMonths: string[] = [
    ...new Set<string>(
      productions
        .map((p) => (p.date ? p.date.substring(0, 7) : ''))
        .filter((d): d is string => Boolean(d))
    )
  ].sort().reverse();

  const currentYearMonthStr = new Date().toISOString().substring(0, 7);
  const defaultSelectedMonth = initialMonthKey || availableMonths[0] || currentYearMonthStr;

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(defaultSelectedMonth);

  // Synchronize when initialMonthKey changes upon opening
  React.useEffect(() => {
    if (initialMonthKey) {
      setSelectedMonthKey(initialMonthKey);
    } else if (availableMonths.length > 0) {
      setSelectedMonthKey(availableMonths[0]);
    }
  }, [initialMonthKey, isOpen]);

  if (!isOpen) return null;

  // Filter shows for selected month
  const monthlyShows = productions
    .filter((p) => p.date && p.date.startsWith(selectedMonthKey))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format month label (e.g., "July 2026")
  const formatMonthLabel = (key: string) => {
    if (!key) return '';
    const [y, m] = key.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    return dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthTitle = formatMonthLabel(selectedMonthKey);

  // Total spend calculation if price included
  const totalSpentInMonth = monthlyShows.reduce((sum, p) => sum + (p.ticketPrice || 0), 0);
  const currencySymbol = monthlyShows.find((p) => p.currency)?.currency || '$';

  // Columns for 2-column masonry layout where cards take flexible independent heights
  const leftColumnShows = monthlyShows.filter((_, i) => i % 2 === 0);
  const rightColumnShows = monthlyShows.filter((_, i) => i % 2 === 1);

  // Export to PNG function
  const handleExportPNG = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      await exportElementToPng(
        exportRef.current,
        `Proscenium-Shows-${monthTitle.replace(/\s+/g, '-')}.png`,
        '#F8F7F4'
      );
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export show details image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#F8F7F4] border-2 border-[#111113] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[8px_8px_0px_0px_#111113] overflow-hidden my-auto">
        
        {/* Modal Controls Header */}
        <div className="bg-white border-b-2 border-[#111113] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h3 className="font-oswald text-2xl font-bold uppercase text-[#111113] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2A5AEE]" />
              <span>Export Monthly Show Details Poster</span>
            </h3>
            <p className="label text-xs mt-0.5">
              Generates a visual summary image of all shows in {monthTitle || 'selected month'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 border border-[#111113] text-[#111113] hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar: Month Selector, Price Toggle, Export Button */}
        <div className="bg-[#EEECE7] border-b-2 border-[#111113] p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Select Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase text-[#111113]">Month:</span>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-white border border-[#111113] text-xs font-mono font-bold px-3 py-1.5 outline-none cursor-pointer"
              >
                {availableMonths.length > 0 ? (
                  availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)}
                    </option>
                  ))
                ) : (
                  <option value={selectedMonthKey}>{monthTitle}</option>
                )}
              </select>
            </div>

            {/* Ticket Price Toggle Button */}
            <button
              type="button"
              onClick={() => setIncludeTicketPrice(!includeTicketPrice)}
              className={`flex items-center space-x-2 border border-[#111113] px-3 py-1.5 text-xs font-sans font-bold cursor-pointer transition-all ${
                includeTicketPrice
                  ? 'bg-emerald-600 text-white shadow-[1px_1px_0px_0px_#111113]'
                  : 'bg-white text-[#111113]/70 hover:bg-gray-100'
              }`}
            >
              {includeTicketPrice ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ticket Prices: Included</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ticket Prices: Hidden</span>
                </>
              )}
            </button>
          </div>

          {/* Export Action Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting || monthlyShows.length === 0}
            className="flex items-center space-x-2 bg-[#2A5AEE] hover:bg-[#1f47c9] text-white font-oswald text-sm font-bold uppercase tracking-wider border-2 border-[#111113] px-5 py-2 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_0px_#111113] transition-all"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                <span>Image Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white stroke-[3]" />
                <span>{isExporting ? 'Generating Image...' : 'Save as Image (PNG)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Preview Area inside Modal UI */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-200">
          <div className="max-w-5xl mx-auto shadow-lg bg-[#F8F7F4] border-2 border-[#111113] p-6 sm:p-8 space-y-6 text-[#111113]">
            {/* Header Banner */}
            <div className="border-b-2 border-[#111113] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#2A5AEE] border-2 border-[#111113] flex items-center justify-center text-white shrink-0">
                  <Ticket className="w-6 h-6 transform -rotate-12 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#111113]">
                    {monthTitle || 'Monthly Show Summary'}
                  </h2>
                  <p className="label mt-0.5">
                    Proscenium Theatre Log Digest • {monthlyShows.length} {monthlyShows.length === 1 ? 'Show' : 'Shows'} Attended
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#111113] px-4 py-2 text-right">
                <p className="label">Month Summary</p>
                <p className="font-oswald text-2xl font-bold text-[#2A5AEE]">
                  {monthlyShows.length} {monthlyShows.length === 1 ? 'Production' : 'Productions'}
                </p>
                {includeTicketPrice && totalSpentInMonth > 0 && (
                  <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                    Total: {currencySymbol}{totalSpentInMonth}
                  </p>
                )}
              </div>
            </div>

            {/* Show Cards Grid */}
            {monthlyShows.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#111113]/30 p-12 text-center space-y-2">
                <Ticket className="w-10 h-10 text-[#111113]/30 mx-auto" />
                <p className="font-oswald text-xl uppercase font-bold text-[#111113]">No Shows Logged For {monthTitle}</p>
                <p className="text-xs text-[#111113]/60 font-mono">Select another month or log shows for this month to generate an export card.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Left Column */}
                <div className="flex flex-col gap-5">
                  {leftColumnShows.map((prod) => (
                    <div
                      key={`modal-prod-${prod.id}`}
                      className="bg-white border-2 border-[#111113] p-5 flex flex-col space-y-4 relative overflow-hidden shadow-[2px_2px_0px_0px_#111113] h-auto"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-36 bg-[#111113] border border-[#111113] shrink-0 overflow-hidden relative">
                          {prod.posterUrl ? (
                            <img
                              src={getProxiedImageUrl(prod.posterUrl)}
                              alt={prod.title}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#111113] flex flex-col items-center justify-center p-2 text-center text-white">
                              <Ticket className="w-6 h-6 text-amber-400 mb-1" />
                              <span className="font-oswald text-[10px] uppercase font-bold leading-tight">{prod.title}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="font-oswald text-2xl font-bold uppercase text-[#111113] leading-tight">
                              {prod.title}
                            </h4>

                            <div className="flex items-center space-x-1 shrink-0 bg-[#EEECE7] border border-[#111113] px-2 py-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span className="text-xs font-mono font-bold text-[#111113]">{prod.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="bg-[#111113] text-white text-[10px] font-mono uppercase px-2 py-0.5 font-bold">
                              {prod.category}
                            </span>
                            {prod.theatreType && (
                              <span className="bg-[#EEECE7] border border-[#111113] text-[#111113] text-[10px] font-mono uppercase px-2 py-0.5 font-bold">
                                {prod.theatreType}
                              </span>
                            )}
                            {prod.isRushed && (
                              <span className="bg-amber-400 text-[#111113] border border-[#111113] text-[10px] font-mono font-bold uppercase px-2 py-0.5">
                                ⚡ Rushed
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[#111113]/80">
                              <Calendar className="w-3.5 h-3.5 text-[#2A5AEE] shrink-0" />
                              <span>{prod.date}</span>
                            </div>
                            {prod.venue && (
                              <div className="flex items-start gap-1.5 font-sans font-medium text-xs text-[#111113]/90">
                                <MapPin className="w-3.5 h-3.5 text-[#2A5AEE] shrink-0 mt-0.5" />
                                <span className="leading-snug">{prod.venue}{prod.city ? `, ${prod.city}` : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {prod.notes && (
                        <div className="bg-[#F8F7F4] p-3 border border-[#111113]/20">
                          <p className="text-xs text-[#111113]/90 font-sans italic leading-relaxed whitespace-pre-wrap">
                            "{prod.notes}"
                          </p>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-[#111113]/15 flex items-start justify-between text-xs gap-2 mt-auto">
                        <div>
                          {includeTicketPrice && (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                              {prod.ticketPrice ? `${prod.currency || '$'}${prod.ticketPrice}` : 'N/A'}
                            </span>
                          )}
                        </div>

                        {prod.tags && prod.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 justify-end">
                            <Tag className="w-3.5 h-3.5 text-[#111113]/50 shrink-0 mr-0.5" />
                            {prod.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="font-sans font-medium text-[11px] text-[#111113]/80 bg-[#EEECE7] border border-[#111113]/20 px-1.5 py-0.5"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-5">
                  {rightColumnShows.map((prod) => (
                    <div
                      key={`modal-prod-${prod.id}`}
                      className="bg-white border-2 border-[#111113] p-5 flex flex-col space-y-4 relative overflow-hidden shadow-[2px_2px_0px_0px_#111113] h-auto"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-36 bg-[#111113] border border-[#111113] shrink-0 overflow-hidden relative">
                          {prod.posterUrl ? (
                            <img
                              src={getProxiedImageUrl(prod.posterUrl)}
                              alt={prod.title}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#111113] flex flex-col items-center justify-center p-2 text-center text-white">
                              <Ticket className="w-6 h-6 text-amber-400 mb-1" />
                              <span className="font-oswald text-[10px] uppercase font-bold leading-tight">{prod.title}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="font-oswald text-2xl font-bold uppercase text-[#111113] leading-tight">
                              {prod.title}
                            </h4>

                            <div className="flex items-center space-x-1 shrink-0 bg-[#EEECE7] border border-[#111113] px-2 py-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span className="text-xs font-mono font-bold text-[#111113]">{prod.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="bg-[#111113] text-white text-[10px] font-mono uppercase px-2 py-0.5 font-bold">
                              {prod.category}
                            </span>
                            {prod.theatreType && (
                              <span className="bg-[#EEECE7] border border-[#111113] text-[#111113] text-[10px] font-mono uppercase px-2 py-0.5 font-bold">
                                {prod.theatreType}
                              </span>
                            )}
                            {prod.isRushed && (
                              <span className="bg-amber-400 text-[#111113] border border-[#111113] text-[10px] font-mono font-bold uppercase px-2 py-0.5">
                                ⚡ Rushed
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[#111113]/80">
                              <Calendar className="w-3.5 h-3.5 text-[#2A5AEE] shrink-0" />
                              <span>{prod.date}</span>
                            </div>
                            {prod.venue && (
                              <div className="flex items-start gap-1.5 font-sans font-medium text-xs text-[#111113]/90">
                                <MapPin className="w-3.5 h-3.5 text-[#2A5AEE] shrink-0 mt-0.5" />
                                <span className="leading-snug">{prod.venue}{prod.city ? `, ${prod.city}` : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {prod.notes && (
                        <div className="bg-[#F8F7F4] p-3 border border-[#111113]/20">
                          <p className="text-xs text-[#111113]/90 font-sans italic leading-relaxed whitespace-pre-wrap">
                            "{prod.notes}"
                          </p>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-[#111113]/15 flex items-start justify-between text-xs gap-2 mt-auto">
                        <div>
                          {includeTicketPrice && (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                              {prod.ticketPrice ? `${prod.currency || '$'}${prod.ticketPrice}` : 'N/A'}
                            </span>
                          )}
                        </div>

                        {prod.tags && prod.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 justify-end">
                            <Tag className="w-3.5 h-3.5 text-[#111113]/50 shrink-0 mr-0.5" />
                            {prod.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="font-sans font-medium text-[11px] text-[#111113]/80 bg-[#EEECE7] border border-[#111113]/20 px-1.5 py-0.5"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Offscreen Fixed Export Target - Unconstrained height & width for guaranteed full capture */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0px', width: '1250px', pointerEvents: 'none', opacity: 0, zIndex: -9999 }}>
        <div
          ref={exportRef}
          className="w-[1250px] bg-[#F8F7F4] border-2 border-[#111113] p-10 space-y-8 text-[#111113]"
        >
          {/* Header Banner */}
          <div className="border-b-2 border-[#111113] pb-6 flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-[#2A5AEE] border-2 border-[#111113] flex items-center justify-center text-white shrink-0">
                <Ticket className="w-8 h-8 transform -rotate-12 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-oswald text-5xl font-bold uppercase tracking-tight text-[#111113]">
                  {monthTitle || 'Monthly Show Summary'}
                </h2>
                <p className="label text-sm mt-1">
                  Proscenium Theatre Log Digest • {monthlyShows.length} {monthlyShows.length === 1 ? 'Show' : 'Shows'} Attended
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-[#111113] px-6 py-3 text-right">
              <p className="label">Month Summary</p>
              <p className="font-oswald text-4xl font-bold text-[#2A5AEE]">
                {monthlyShows.length} {monthlyShows.length === 1 ? 'Production' : 'Productions'}
              </p>
              {includeTicketPrice && totalSpentInMonth > 0 && (
                <p className="text-base font-mono font-bold text-emerald-700 mt-0.5">
                  Total Spent: {currencySymbol}{totalSpentInMonth}
                </p>
              )}
            </div>
          </div>

          {/* Show Cards Grid */}
          {monthlyShows.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#111113]/30 p-16 text-center space-y-3">
              <Ticket className="w-14 h-14 text-[#111113]/30 mx-auto" />
              <p className="font-oswald text-3xl uppercase font-bold text-[#111113]">No Shows Logged For {monthTitle}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 items-start">
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                {leftColumnShows.map((prod) => (
                  <div
                    key={`export-prod-${prod.id}`}
                    className="bg-white border-2 border-[#111113] p-6 flex flex-col space-y-5 relative overflow-hidden shadow-[3px_3px_0px_0px_#111113] h-auto"
                  >
                    <div className="flex gap-5">
                      <div className="w-28 h-40 bg-[#111113] border border-[#111113] shrink-0 overflow-hidden relative">
                        {prod.posterUrl ? (
                          <img
                            src={getProxiedImageUrl(prod.posterUrl)}
                            alt={prod.title}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#111113] flex flex-col items-center justify-center p-3 text-center text-white">
                            <Ticket className="w-10 h-10 text-amber-400 mb-1.5" />
                            <span className="font-oswald text-xs uppercase font-bold leading-tight">{prod.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-oswald text-3xl font-bold uppercase text-[#111113] leading-tight">
                            {prod.title}
                          </h4>

                          <div className="flex items-center space-x-1 shrink-0 bg-[#EEECE7] border border-[#111113] px-2.5 py-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            <span className="text-base font-mono font-bold text-[#111113]">{prod.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="bg-[#111113] text-white text-xs font-mono uppercase px-2.5 py-0.5 font-bold">
                            {prod.category}
                          </span>
                          {prod.theatreType && (
                            <span className="bg-[#EEECE7] border border-[#111113] text-[#111113] text-xs font-mono uppercase px-2.5 py-0.5 font-bold">
                              {prod.theatreType}
                            </span>
                          )}
                          {prod.isRushed && (
                            <span className="bg-amber-400 text-[#111113] border border-[#111113] text-xs font-mono font-bold uppercase px-2.5 py-0.5">
                              ⚡ Rushed
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 font-mono text-sm text-[#111113]/80">
                            <Calendar className="w-4 h-4 text-[#2A5AEE] shrink-0" />
                            <span>{prod.date}</span>
                          </div>
                          {prod.venue && (
                            <div className="flex items-start gap-2 font-sans font-semibold text-sm text-[#111113]/90">
                              <MapPin className="w-4 h-4 text-[#2A5AEE] shrink-0 mt-0.5" />
                              <span className="leading-snug">{prod.venue}{prod.city ? `, ${prod.city}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {prod.notes && (
                      <div className="bg-[#F8F7F4] p-4 border border-[#111113]/20">
                        <p className="text-sm text-[#111113]/90 font-sans italic leading-relaxed whitespace-pre-wrap">
                          "{prod.notes}"
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#111113]/15 flex items-start justify-between text-xs gap-3 mt-auto">
                      <div>
                        {includeTicketPrice && (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-sm">
                            {prod.ticketPrice ? `${prod.currency || '$'}${prod.ticketPrice}` : 'N/A'}
                          </span>
                        )}
                      </div>

                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          <Tag className="w-4 h-4 text-[#111113]/50 shrink-0 mr-0.5" />
                          {prod.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="font-sans font-medium text-xs text-[#111113]/80 bg-[#EEECE7] border border-[#111113]/20 px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                {rightColumnShows.map((prod) => (
                  <div
                    key={`export-prod-${prod.id}`}
                    className="bg-white border-2 border-[#111113] p-6 flex flex-col space-y-5 relative overflow-hidden shadow-[3px_3px_0px_0px_#111113] h-auto"
                  >
                    <div className="flex gap-5">
                      <div className="w-28 h-40 bg-[#111113] border border-[#111113] shrink-0 overflow-hidden relative">
                        {prod.posterUrl ? (
                          <img
                            src={getProxiedImageUrl(prod.posterUrl)}
                            alt={prod.title}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#111113] flex flex-col items-center justify-center p-3 text-center text-white">
                            <Ticket className="w-10 h-10 text-amber-400 mb-1.5" />
                            <span className="font-oswald text-xs uppercase font-bold leading-tight">{prod.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-oswald text-3xl font-bold uppercase text-[#111113] leading-tight">
                            {prod.title}
                          </h4>

                          <div className="flex items-center space-x-1 shrink-0 bg-[#EEECE7] border border-[#111113] px-2.5 py-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            <span className="text-base font-mono font-bold text-[#111113]">{prod.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="bg-[#111113] text-white text-xs font-mono uppercase px-2.5 py-0.5 font-bold">
                            {prod.category}
                          </span>
                          {prod.theatreType && (
                            <span className="bg-[#EEECE7] border border-[#111113] text-[#111113] text-xs font-mono uppercase px-2.5 py-0.5 font-bold">
                              {prod.theatreType}
                            </span>
                          )}
                          {prod.isRushed && (
                            <span className="bg-amber-400 text-[#111113] border border-[#111113] text-xs font-mono font-bold uppercase px-2.5 py-0.5">
                              ⚡ Rushed
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 font-mono text-sm text-[#111113]/80">
                            <Calendar className="w-4 h-4 text-[#2A5AEE] shrink-0" />
                            <span>{prod.date}</span>
                          </div>
                          {prod.venue && (
                            <div className="flex items-start gap-2 font-sans font-semibold text-sm text-[#111113]/90">
                              <MapPin className="w-4 h-4 text-[#2A5AEE] shrink-0 mt-0.5" />
                              <span className="leading-snug">{prod.venue}{prod.city ? `, ${prod.city}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {prod.notes && (
                      <div className="bg-[#F8F7F4] p-4 border border-[#111113]/20">
                        <p className="text-sm text-[#111113]/90 font-sans italic leading-relaxed whitespace-pre-wrap">
                          "{prod.notes}"
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#111113]/15 flex items-start justify-between text-xs gap-3 mt-auto">
                      <div>
                        {includeTicketPrice && (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-sm">
                            {prod.ticketPrice ? `${prod.currency || '$'}${prod.ticketPrice}` : 'N/A'}
                          </span>
                        )}
                      </div>

                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          <Tag className="w-4 h-4 text-[#111113]/50 shrink-0 mr-0.5" />
                          {prod.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="font-sans font-medium text-xs text-[#111113]/80 bg-[#EEECE7] border border-[#111113]/20 px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-5 border-t-2 border-[#111113] flex items-center justify-between label text-sm">
            <span>Proscenium Theatre Diary Log</span>
            <span>Captured {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
