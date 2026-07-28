import React, { useState, useRef } from 'react';
import { Production } from '../types';
import { Download, CheckCircle2, X, Star } from 'lucide-react';
import { getProxiedImageUrl } from '../utils/imageUtils';
import { exportElementToPng } from '../utils/exportUtils';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productions: Production[];
  year: number;
  month: number;
  monthName: string;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  isOpen,
  onClose,
  productions,
  year,
  month,
  monthName,
}) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  // Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = (firstDayOfMonth + 6) % 7; // Mon = 0 offset

  // Group shows by date string YYYY-MM-DD
  const showsByDateMap: Record<string, Production[]> = {};
  productions.forEach((p) => {
    if (!p.date) return;
    const pDate = new Date(p.date);
    if (pDate.getFullYear() === year && pDate.getMonth() === month) {
      const dStr = p.date.substring(0, 10);
      if (!showsByDateMap[dStr]) showsByDateMap[dStr] = [];
      showsByDateMap[dStr].push(p);
    }
  });

  // Build grid weeks
  type CellType =
    | { type: 'lead'; key: string }
    | { type: 'trail'; key: string }
    | {
        type: 'day';
        key: string;
        dayNum: number;
        dateStr: string;
        showsOnDate: Production[];
      };

  const cells: CellType[] = [];

  for (let i = 0; i < leadingEmptyDays; i++) {
    cells.push({ type: 'lead', key: `lead-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const monthFormatted = String(month + 1).padStart(2, '0');
    const dayFormatted = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
    const showsOnDate = showsByDateMap[dateStr] || [];

    cells.push({
      type: 'day',
      key: `day-${day}`,
      dayNum: day,
      dateStr,
      showsOnDate,
    });
  }

  const trailingEmptyDays = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailingEmptyDays; i++) {
    cells.push({ type: 'trail', key: `trail-${i}` });
  }

  const weeks: CellType[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      await exportElementToPng(
        exportRef.current,
        `Proscenium-Calendar-${monthName}-${year}.png`,
        '#F8F7F4'
      );
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export calendar image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#F8F7F4] border-2 border-[#111113] p-6 space-y-6 shadow-[8px_8px_0px_0px_#111113] max-h-[90vh] flex flex-col">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between border-b-2 border-[#111113] pb-4">
          <div>
            <h3 className="font-oswald text-2xl sm:text-3xl font-bold uppercase text-[#111113]">
              Export {monthName} {year} Calendar Image
            </h3>
            <p className="font-mono text-xs text-[#111113]/60">
              Preview the styled 3:4 poster calendar image before downloading
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-[#2A5AEE] hover:bg-[#1f47c9] text-white border border-[#111113] font-mono text-xs font-bold uppercase px-4 py-2 cursor-pointer shadow-[2px_2px_0px_0px_#111113] transition-all disabled:opacity-50"
            >
              {exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>{isExporting ? 'Generating...' : 'Save Image (PNG)'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white hover:bg-[#EEECE7] text-[#111113] border border-[#111113] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area for Modal UI */}
        <div className="flex-1 overflow-auto p-4 bg-[#EEECE7] border border-[#111113]/20 flex justify-center items-start">
          <div className="w-full max-w-[950px] bg-[#F8F7F4] border-2 border-[#111113] p-4 sm:p-6 space-y-4 text-[#111113] shadow-lg">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b-2 border-[#111113] pb-3">
              <div className="flex items-center space-x-3">
                <span className="bg-[#2A5AEE] text-white text-xs font-oswald font-bold uppercase tracking-wider px-3 py-1 border border-[#111113] shrink-0">
                  Proscenium
                </span>
                <span className="font-oswald text-2xl sm:text-3xl font-bold uppercase text-[#111113] leading-none whitespace-nowrap">
                  {monthName} {year} Calendar
                </span>
              </div>
              <span className="font-mono text-xs text-[#111113]/60 font-bold uppercase shrink-0">
                Theatre Logs
              </span>
            </div>

            {/* Grid Preview */}
            <div className="border-2 border-[#111113] bg-white overflow-hidden shadow-[2px_2px_0px_0px_#111113]">
              <div className="grid grid-cols-7 gap-0 border-b-2 border-[#111113] bg-[#EEECE7]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div
                    key={day}
                    className="font-mono text-xs uppercase text-center py-2 border-r border-[#111113] last:border-r-0 font-bold text-[#111113]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0 bg-[#111113]">
                {weeks.map((week) => {
                  const hasShowsInWeek = week.some(
                    (cell) => cell.type === 'day' && cell.showsOnDate.length > 0
                  );
                  const cellHeightClass = hasShowsInWeek ? 'aspect-[3/4]' : 'h-10';

                  return week.map((cell) => {
                    if (cell.type === 'lead' || cell.type === 'trail') {
                      return (
                        <div
                          key={`prev-${cell.key}`}
                          className={`${cellHeightClass} border-r border-b border-[#111113] bg-[#F8F7F4] opacity-50`}
                        />
                      );
                    }

                    const { dayNum, showsOnDate } = cell;

                    return (
                      <div
                        key={`prev-${cell.key}`}
                        className={`relative ${cellHeightClass} p-1.5 border-r border-b border-[#111113] bg-white flex flex-col justify-between overflow-hidden`}
                      >
                        {showsOnDate.length === 1 ? (
                          <img
                            src={getProxiedImageUrl(showsOnDate[0].posterUrl)}
                            alt={showsOnDate[0].title}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover z-0"
                          />
                        ) : showsOnDate.length >= 2 ? (
                          <div className="absolute inset-0 w-full h-full flex flex-col gap-0.5 bg-[#111113] overflow-hidden z-0">
                            {showsOnDate.slice(0, 4).map((prod) => (
                              <div
                                key={`prev-prod-${prod.id}`}
                                className="relative w-full flex-1 overflow-hidden flex items-end"
                              >
                                <img
                                  src={getProxiedImageUrl(prod.posterUrl)}
                                  alt={prod.title}
                                  crossOrigin="anonymous"
                                  className="absolute inset-0 w-full h-full object-cover z-0"
                                />
                                <div className="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1 pb-0.5 pt-2 flex items-center justify-between gap-1">
                                  <p className="font-oswald uppercase tracking-wider text-[0.55rem] font-bold text-white leading-tight truncate">
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

                        <div className="relative z-10 flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-bold ${
                              showsOnDate.length > 0
                                ? 'bg-[#111113] text-white px-1.5 py-0.5 text-[0.6rem]'
                                : 'text-[#111113]'
                            }`}
                          >
                            {String(dayNum).padStart(2, '0')}
                          </span>

                          {showsOnDate.length === 1 && (
                            <div className="bg-[#111113]/90 text-amber-400 border border-amber-400/50 px-1 py-0.5 flex items-center gap-0.5 text-[0.6rem] font-bold font-mono shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{showsOnDate[0].rating}</span>
                            </div>
                          )}
                        </div>

                        {showsOnDate.length === 1 && (
                          <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-1.5 pt-4 text-left">
                            <p className="font-oswald uppercase tracking-wider text-[0.65rem] font-bold text-white leading-tight">
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

            <div className="pt-3 border-t-2 border-[#111113] flex items-center justify-between font-mono text-[11px] text-[#111113]/60 uppercase font-bold">
              <span>Proscenium Theatre Log Digest</span>
              <span>Captured {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen Fixed Export Target - Completely isolated position to prevent modal overflow */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0px', width: '1200px', pointerEvents: 'none', opacity: 0, zIndex: -9999 }}>
        <div
          ref={exportRef}
          className="w-[1200px] bg-[#F8F7F4] border-2 border-[#111113] p-8 space-y-6 text-[#111113]"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b-2 border-[#111113] pb-4">
            <div className="flex items-center space-x-4">
              <span className="bg-[#2A5AEE] text-white text-base font-oswald font-bold uppercase tracking-wider px-4 py-1.5 border border-[#111113] shrink-0">
                Proscenium
              </span>
              <span className="font-oswald text-4xl font-bold uppercase text-[#111113] leading-none whitespace-nowrap">
                {monthName} {year} Calendar
              </span>
            </div>
            <span className="font-mono text-sm text-[#111113]/60 font-bold uppercase shrink-0">
              Theatre Logs
            </span>
          </div>

          {/* Calendar Grid Container */}
          <div className="border-2 border-[#111113] bg-white shadow-[2px_2px_0px_0px_#111113]">
            <div className="grid grid-cols-7 gap-0 border-b-2 border-[#111113] bg-[#EEECE7]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="font-mono text-sm uppercase text-center py-2.5 border-r border-[#111113] last:border-r-0 font-bold text-[#111113]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0 bg-[#111113]">
              {weeks.map((week) => {
                const hasShowsInWeek = week.some(
                  (cell) => cell.type === 'day' && cell.showsOnDate.length > 0
                );
                const cellHeightClass = hasShowsInWeek ? 'aspect-[3/4]' : 'h-10';

                return week.map((cell) => {
                  if (cell.type === 'lead' || cell.type === 'trail') {
                    return (
                      <div
                        key={`export-${cell.key}`}
                        className={`${cellHeightClass} border-r border-b border-[#111113] bg-[#F8F7F4] opacity-50`}
                      />
                    );
                  }

                  const { dayNum, showsOnDate } = cell;

                  return (
                    <div
                      key={`export-${cell.key}`}
                      className={`relative ${cellHeightClass} p-2.5 border-r border-b border-[#111113] bg-white flex flex-col justify-between overflow-hidden`}
                    >
                      {showsOnDate.length === 1 ? (
                        <img
                          src={getProxiedImageUrl(showsOnDate[0].posterUrl)}
                          alt={showsOnDate[0].title}
                          crossOrigin="anonymous"
                          className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                      ) : showsOnDate.length >= 2 ? (
                        <div className="absolute inset-0 w-full h-full flex flex-col gap-0.5 bg-[#111113] overflow-hidden z-0">
                          {showsOnDate.slice(0, 4).map((prod) => (
                            <div
                              key={`export-prod-${prod.id}`}
                              className="relative w-full flex-1 overflow-hidden flex items-end"
                            >
                              <img
                                src={getProxiedImageUrl(prod.posterUrl)}
                                alt={prod.title}
                                crossOrigin="anonymous"
                                className="absolute inset-0 w-full h-full object-cover z-0"
                              />
                              <div className="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1.5 pb-1 pt-3 flex items-center justify-between gap-1">
                                <p className="font-oswald uppercase tracking-wider text-[0.65rem] font-bold text-white leading-tight truncate">
                                  {prod.title}
                                </p>
                                <span className="shrink-0 flex items-center gap-0.5 text-amber-400 text-[0.65rem] font-bold font-mono">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {prod.rating}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="relative z-10 flex items-center justify-between">
                        <span
                          className={`font-mono text-xs font-bold ${
                            showsOnDate.length > 0
                              ? 'bg-[#111113] text-white px-2 py-0.5 text-xs'
                              : 'text-[#111113]'
                          }`}
                        >
                          {String(dayNum).padStart(2, '0')}
                        </span>

                        {showsOnDate.length === 1 && (
                          <div className="bg-[#111113]/90 text-amber-400 border border-amber-400/50 px-1.5 py-0.5 flex items-center gap-0.5 text-xs font-bold font-mono shadow-xs">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{showsOnDate[0].rating}</span>
                          </div>
                        )}
                      </div>

                      {showsOnDate.length === 1 && (
                        <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 pt-8 text-left">
                          <p className="font-oswald uppercase tracking-wider text-xs sm:text-sm font-bold text-white whitespace-normal break-words leading-tight drop-shadow-xs">
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

          <div className="pt-4 border-t-2 border-[#111113] flex items-center justify-between font-mono text-xs text-[#111113]/60 uppercase font-bold">
            <span>Proscenium Theatre Log Digest</span>
            <span>Captured {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
