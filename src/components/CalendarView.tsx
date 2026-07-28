import React, { useState } from 'react';
import { Production } from '../types';
import { Plus, Star, Download, LayoutGrid } from 'lucide-react';
import { MonthlyShowDetailsExportModal } from './MonthlyShowDetailsExportModal';
import { CalendarExportModal } from './CalendarExportModal';
import { getProxiedImageUrl } from '../utils/imageUtils';

interface CalendarViewProps {
  productions: Production[];
  onSelectProduction: (production: Production) => void;
  onAddOnDate: (dateString: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  productions,
  onSelectProduction,
  onAddOnDate,
}) => {
  const [isCalendarExportModalOpen, setIsCalendarExportModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Current calendar view month (default to latest show date or current date)
  const defaultDate = productions.length > 0 
    ? new Date(productions[0].date) 
    : new Date();

  const [currentDate, setCurrentDate] = useState<Date>(
    isNaN(defaultDate.getTime()) ? new Date() : defaultDate
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map productions by YYYY-MM-DD
  const productionsByDate: Record<string, Production[]> = {};
  productions.forEach((prod) => {
    if (categoryFilter !== 'All' && prod.category !== categoryFilter) return;
    if (!productionsByDate[prod.date]) {
      productionsByDate[prod.date] = [];
    }
    productionsByDate[prod.date].push(prod);
  });

  const categoriesList = ['All', 'Musical', 'Play', 'Opera', 'Dance', 'Concert', 'Other'];

  // Helper for formatting pad date
  const formatDateString = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // Build cells array and group into 7-cell weeks
  type CalendarCell =
    | { type: 'lead'; key: string }
    | { type: 'day'; key: string; dayNum: number; dateStr: string; showsOnDate: Production[]; isToday: boolean }
    | { type: 'trail'; key: string };

  const leadCount = (firstDayOfMonth + 6) % 7;
  const trailCount = (7 - ((leadCount + daysInMonth) % 7)) % 7;

  const allCells: CalendarCell[] = [];

  for (let i = 0; i < leadCount; i++) {
    allCells.push({ type: 'lead', key: `empty-lead-${i}` });
  }

  for (let i = 0; i < daysInMonth; i++) {
    const dayNum = i + 1;
    const dateStr = formatDateString(dayNum);
    const showsOnDate = productionsByDate[dateStr] || [];
    const isToday = dateStr === todayStr;
    allCells.push({
      type: 'day',
      key: `day-${dayNum}`,
      dayNum,
      dateStr,
      showsOnDate,
      isToday,
    });
  }

  for (let i = 0; i < trailCount; i++) {
    allCells.push({ type: 'trail', key: `empty-trail-${i}` });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b-2 border-[#111113] pb-4 gap-4">
        <div>
          <h2 className="font-oswald text-5xl sm:text-7xl font-bold uppercase leading-none tracking-tight text-[#111113]">
            {monthName} {year}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-white border border-[#111113] p-1">
            <button
              id="btn-calendar-prev"
              onClick={handlePrevMonth}
              className="px-2.5 py-1 hover:bg-[#EEECE7] text-[#111113] font-mono text-sm cursor-pointer transition-colors"
              title="Previous Month"
            >
              ←
            </button>
            <span className="text-[#111113]/40 font-mono text-xs">/</span>
            <button
              id="btn-calendar-next"
              onClick={handleNextMonth}
              className="px-2.5 py-1 hover:bg-[#EEECE7] text-[#111113] font-mono text-sm cursor-pointer transition-colors"
              title="Next Month"
            >
              →
            </button>
            <button
              id="btn-calendar-today"
              onClick={handleToday}
              className="ml-1 px-2.5 py-1 bg-[#EEECE7] hover:bg-[#111113] hover:text-white text-[#111113] font-mono text-xs uppercase cursor-pointer transition-colors font-bold"
            >
              Today
            </button>
          </div>

          {/* Export Calendar View as Image Button */}
          <button
            onClick={() => setIsCalendarExportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-[#2A5AEE] hover:bg-[#1f47c9] text-white border border-[#111113] font-mono text-xs font-bold uppercase px-3 py-2 cursor-pointer shadow-[2px_2px_0px_0px_#111113] transition-all"
            title={`Export ${monthName} ${year} Calendar view as PNG`}
          >
            <Download className="w-3.5 h-3.5 stroke-[3]" />
            <span>Export Calendar Image</span>
          </button>

          {/* Export Monthly Show Cards Button */}
          <button
            onClick={() => setIsDetailsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-white hover:bg-[#EEECE7] text-[#111113] border border-[#111113] font-mono text-xs font-bold uppercase px-3 py-2 cursor-pointer transition-all"
            title={`Export Show Detail Cards for ${monthName} ${year}`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#2A5AEE]" />
            <span>Show Details Image</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`cursor-pointer font-mono text-[0.7rem] uppercase px-2.5 py-1 border transition-all whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-[#111113] text-white border-[#111113] font-bold'
                : 'bg-transparent text-[#111113] border-[#111113]/20 hover:border-[#111113]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Calendar Grid Container (Homepage UI - Clean) */}
      <div className="border-2 border-[#111113] bg-white overflow-hidden shadow-[2px_2px_0px_0px_#111113]">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-0 border-b-2 border-[#111113] bg-[#EEECE7]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="font-mono text-[0.65rem] uppercase text-center py-2 border-r border-[#111113] last:border-r-0 font-bold text-[#111113]">
              {day}
            </div>
          ))}
        </div>

        {/* Poster Cell Grid */}
        <div className="grid grid-cols-7 gap-0 bg-[#111113]">
          {weeks.map((week) => {
            const hasShowsInWeek = week.some((cell) => cell.type === 'day' && cell.showsOnDate.length > 0);
            const cellHeightClass = hasShowsInWeek ? 'aspect-[3/4]' : 'h-10 sm:h-12';

            return week.map((cell) => {
              if (cell.type === 'lead' || cell.type === 'trail') {
                return (
                  <div
                    key={cell.key}
                    className={`${cellHeightClass} border-r border-b border-[#111113] bg-[#F8F7F4] opacity-50 pointer-events-none`}
                  />
                );
              }

              const { dayNum, dateStr, showsOnDate, isToday } = cell;

              return (
                <div
                  key={cell.key}
                  className={`group relative ${cellHeightClass} p-1.5 sm:p-2 border-r border-b border-[#111113] bg-white flex flex-col justify-between overflow-hidden transition-all duration-200 hover:z-20 cursor-pointer`}
                  onClick={(e) => {
                    if (showsOnDate.length > 0 && (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG')) {
                      onSelectProduction(showsOnDate[0]);
                    }
                  }}
                >
                  {/* Full Cell Poster Background or Split Grid */}
                  {showsOnDate.length === 1 ? (
                    <img 
                      src={getProxiedImageUrl(showsOnDate[0].posterUrl)}
                      alt={showsOnDate[0].title}
                      crossOrigin="anonymous"
                      className="absolute inset-0 w-full h-full object-cover z-0 cursor-pointer"
                      onClick={() => onSelectProduction(showsOnDate[0])}
                    />
                  ) : showsOnDate.length >= 2 ? (
                    <div 
                      className={`absolute inset-0 w-full h-full flex flex-col gap-0.5 bg-[#111113] overflow-hidden z-0`}
                    >
                      {showsOnDate.slice(0, 4).map((prod) => (
                        <div
                          key={prod.id}
                          className="relative w-full flex-1 overflow-hidden cursor-pointer group/split flex items-end"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProduction(prod);
                          }}
                          title={`${prod.title} (${prod.rating}★)`}
                        >
                          <img
                            src={getProxiedImageUrl(prod.posterUrl)}
                            alt={prod.title}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover z-0"
                          />
                          <div className="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1.5 pb-1 pt-3 flex items-center justify-between gap-1">
                            <p className="font-oswald uppercase tracking-wider text-[0.55rem] sm:text-[0.6rem] font-bold text-white whitespace-normal break-words leading-tight drop-shadow-xs truncate">
                              {prod.title}
                            </p>
                            <span className="shrink-0 flex items-center gap-0.5 text-amber-400 text-[0.55rem] font-bold font-mono">
                              <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                              {prod.rating}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Day Header Label & Rating Badge */}
                  <div className="relative z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-mono text-xs font-bold ${
                          showsOnDate.length > 0
                            ? 'bg-[#111113] text-white px-1.5 py-0.5 text-[0.6rem]'
                            : isToday
                            ? 'bg-[#2A5AEE] text-white px-1.5 py-0.5 text-[0.6rem]'
                            : 'text-[#111113]'
                        }`}
                      >
                        {String(dayNum).padStart(2, '0')}
                      </span>

                      {/* Small add icon on right of date number if 1 or more shows exist */}
                      {showsOnDate.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddOnDate(dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 bg-[#111113] text-white hover:bg-[#2A5AEE] border border-white/20 transition-all pointer-events-auto cursor-pointer shadow-xs"
                          title={`Add another show on ${dateStr}`}
                        >
                          <Plus className="w-2.5 h-2.5 stroke-[3]" />
                        </button>
                      )}
                    </div>

                    {/* Single show top right rating badge */}
                    {showsOnDate.length === 1 && (
                      <div className="bg-[#111113]/90 text-amber-400 border border-amber-400/50 px-1.5 py-0.5 flex items-center gap-0.5 text-[0.6rem] font-bold font-mono shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{showsOnDate[0].rating}</span>
                      </div>
                    )}

                    {/* Add Button on hover if empty */}
                    {showsOnDate.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddOnDate(dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-[#111113] text-white hover:bg-[#2A5AEE] transition-all pointer-events-auto cursor-pointer"
                        title={`Log show on ${dateStr}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Full-width Title Banner for Single Show */}
                  {showsOnDate.length === 1 && (
                    <div 
                      className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-1.5 pt-5 text-left cursor-pointer pointer-events-auto"
                      onClick={() => onSelectProduction(showsOnDate[0])}
                    >
                      <p className="font-oswald uppercase tracking-wider text-[0.65rem] sm:text-[0.7rem] font-bold text-white whitespace-normal break-words leading-tight drop-shadow-xs">
                        {showsOnDate[0].title}
                      </p>
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* Calendar Export Modal */}
      <CalendarExportModal
        isOpen={isCalendarExportModalOpen}
        onClose={() => setIsCalendarExportModalOpen(false)}
        productions={productions}
        year={year}
        month={month}
        monthName={monthName}
      />

      {/* Monthly Show Details Export Modal */}
      <MonthlyShowDetailsExportModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        productions={productions}
        initialMonthKey={currentMonthKey}
      />
    </div>
  );
};

