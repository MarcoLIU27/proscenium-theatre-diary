import React, { useState, useRef } from 'react';
import { Production, AIReportInsight } from '../types';
import { computeWatchStats } from '../utils/stats';
import { toPng } from 'html-to-image';
import { Download, Sparkles, Star, Ticket, Trophy, DollarSign, Award, FileJson, CheckCircle2 } from 'lucide-react';

interface StatsReportViewProps {
  productions: Production[];
  onExportJSON: () => void;
  onResetData: () => void;
}

export const StatsReportView: React.FC<StatsReportViewProps> = ({
  productions,
  onExportJSON,
  onResetData,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIReportInsight | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const stats = computeWatchStats(productions);

  // Fetch AI Critic Analysis report from Express backend
  const fetchAiReport = async () => {
    if (productions.length === 0) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productions }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data);
      }
    } catch (err) {
      console.error('Failed to load AI insights', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Export report card to PNG image
  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        quality: 0.95,
        backgroundColor: '#f8f7f4',
      });

      const link = document.createElement('a');
      link.download = `Proscenium-Report-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export image report', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="bg-white border-2 border-[#111113] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald text-4xl font-bold uppercase text-[#111113] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#2A5AEE]" />
            <span>Season Watch Statistics</span>
          </h2>
          <p className="label mt-1">
            Interactive analytical report card & visual infographic
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* AI Critic Insights Button */}
          <button
            id="btn-generate-ai-insight"
            onClick={fetchAiReport}
            disabled={loadingAi || productions.length === 0}
            className="flex items-center space-x-2 bg-white border-2 border-[#111113] hover:bg-[#EEECE7] text-[#111113] font-oswald text-sm font-bold uppercase tracking-wider px-4 py-2.5 disabled:opacity-50 cursor-pointer transition-all"
          >
            <Sparkles className={`w-4 h-4 text-[#2A5AEE] ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'Analyzing...' : 'AI Critic Review'}</span>
          </button>

          {/* Export PNG Button */}
          <button
            id="btn-export-report-png"
            onClick={handleExportPNG}
            disabled={isExporting || productions.length === 0}
            className="flex items-center space-x-2 bg-[#2A5AEE] hover:bg-[#1f47c9] text-white font-oswald text-sm font-bold uppercase tracking-wider border-2 border-[#111113] px-5 py-2.5 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_0px_#111113] transition-all"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                <span>Report Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white stroke-[3]" />
                <span>{isExporting ? 'Generating...' : 'Export Visual Report'}</span>
              </>
            )}
          </button>

          {/* Export JSON backup button */}
          <button
            onClick={onExportJSON}
            className="p-2.5 bg-[#EEECE7] border-2 border-[#111113] hover:bg-[#111113] hover:text-white text-[#111113] transition-colors cursor-pointer"
            title="Download JSON Backup"
          >
            <FileJson className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Exportable Infographic Canvas Container */}
      <div
        ref={reportRef}
        className="bg-[#F8F7F4] border-2 border-[#111113] p-6 sm:p-10 space-y-8 relative overflow-hidden text-[#111113]"
      >
        {/* Decorative Accent Border Top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#2A5AEE]" />

        {/* Report Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#111113] pb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#2A5AEE] border-2 border-[#111113] flex items-center justify-center text-white">
              <Ticket className="w-7 h-7 transform -rotate-12 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-oswald text-4xl sm:text-5xl font-bold uppercase tracking-tight text-[#111113]">
                Proscenium Season Report
              </h1>
              <p className="label mt-0.5">
                Personal Viewing History • {new Date().getFullYear()} Season
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-[#111113] px-5 py-2.5 text-right">
            <p className="label">Total Shows Logged</p>
            <p className="font-oswald text-4xl font-bold text-[#2A5AEE]">{stats.totalShows}</p>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Average Rating */}
          <div className="bg-white border-2 border-[#111113] p-4 space-y-1">
            <div className="flex items-center justify-between label">
              <span>Avg Rating</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <p className="font-oswald text-4xl font-bold text-[#111113]">{stats.averageRating} <span className="text-xs font-mono font-normal text-amber-600">/ 5.0</span></p>
            <p className="text-[10px] font-mono text-[#111113]/60">Based on {stats.totalShows} logs</p>
          </div>

          {/* Musicals vs Plays */}
          <div className="bg-white border-2 border-[#111113] p-4 space-y-1">
            <div className="flex items-center justify-between label">
              <span>Musicals / Plays</span>
              <Award className="w-4 h-4 text-[#2A5AEE]" />
            </div>
            <p className="font-oswald text-4xl font-bold text-[#111113]">{stats.totalMusicals} <span className="text-xs font-mono text-[#111113]/50">M</span> / {stats.totalPlays} <span className="text-xs font-mono text-[#111113]/50">P</span></p>
            <p className="text-[10px] font-mono text-[#111113]/60">Stage genre split</p>
          </div>

          {/* Top Venue */}
          <div className="bg-white border-2 border-[#111113] p-4 space-y-1">
            <div className="flex items-center justify-between label">
              <span>Top Venue</span>
              <Award className="w-4 h-4 text-[#2A5AEE]" />
            </div>
            <p className="font-oswald text-xl sm:text-2xl font-bold text-[#2A5AEE] truncate">{stats.topVenue}</p>
            <p className="text-[10px] font-mono text-[#111113]/60">Most visited stage</p>
          </div>

          {/* Total Investment */}
          <div className="bg-white border-2 border-[#111113] p-4 space-y-1">
            <div className="flex items-center justify-between label">
              <span>Ticket Spend</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-oswald text-4xl font-bold text-[#111113]">{stats.currencySymbol}{stats.totalSpent}</p>
            <p className="text-[10px] font-mono text-[#111113]/60">Estimated tickets</p>
          </div>
        </div>

        {/* AI Critic Insights Banner if available */}
        {aiInsight && (
          <div className="bg-white border-2 border-[#111113] p-6 space-y-3 relative overflow-hidden shadow-[2px_2px_0px_0px_#2A5AEE]">
            <div className="flex items-center space-x-2 text-[#2A5AEE] label font-bold">
              <Sparkles className="w-4 h-4 text-[#2A5AEE]" />
              <span>AI Theatre Critic Review</span>
            </div>
            <h3 className="font-oswald text-3xl font-bold uppercase text-[#111113]">{aiInsight.title}</h3>
            <p className="text-xs sm:text-sm text-[#111113]/80 leading-relaxed italic font-mono">
              "{aiInsight.summary}"
            </p>
            <div className="pt-3 border-t border-[#111113]/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[#111113] font-medium">✨ {aiInsight.personalizedQuote}</span>
              <span className="bg-[#2A5AEE] text-white border border-[#111113] px-3 py-1 font-bold uppercase text-[10px]">
                Recommended: {aiInsight.recommendations.slice(0, 2).join(' • ')}
              </span>
            </div>
          </div>
        )}

        {/* Analytics Breakdown Grid: Categories & Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution Bars */}
          <div className="bg-white border-2 border-[#111113] p-6 space-y-4">
            <h3 className="label flex items-center justify-between">
              <span>Category Breakdown</span>
              <span className="text-xs font-mono text-[#111113]/60">{stats.categories.length} Types</span>
            </h3>

            <div className="space-y-3.5">
              {stats.categories.map((cat) => (
                <div key={cat.name} className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#111113] flex items-center gap-2 uppercase">
                      <span className="w-2.5 h-2.5 border border-[#111113]" style={{ backgroundColor: cat.color || '#2A5AEE' }} />
                      {cat.name}
                    </span>
                    <span className="text-[#111113]/60">
                      {cat.count} {cat.count === 1 ? 'show' : 'shows'} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#EEECE7] border border-[#111113] h-3 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color || '#2A5AEE',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white border-2 border-[#111113] p-6 space-y-4">
            <h3 className="label flex items-center justify-between">
              <span>Rating Distribution</span>
              <span className="text-xs font-mono text-[#111113]/60">Star Ratings</span>
            </h3>

            <div className="space-y-3">
              {stats.ratingDistribution.map((rd) => {
                const percent = stats.totalShows > 0 ? Math.round((rd.count / stats.totalShows) * 100) : 0;
                return (
                  <div key={rd.stars} className="flex items-center space-x-3 text-xs font-mono">
                    <div className="flex items-center space-x-0.5 w-20 text-amber-500 font-bold shrink-0">
                      <span>{rd.stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </div>
                    <div className="flex-1 bg-[#EEECE7] border border-[#111113] h-3 overflow-hidden">
                      <div
                        className="bg-[#2A5AEE] h-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-[#111113]/60 font-mono text-[11px] shrink-0 font-bold">
                      {rd.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Rated Productions Poster Gallery Showcase */}
        {stats.topRatedShows.length > 0 && (
          <div className="space-y-4 pt-4 border-t-2 border-[#111113]">
            <h3 className="label flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>Highest Rated Highlights</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.topRatedShows.map((show) => (
                <div
                  key={show.id}
                  className="bg-white border-2 border-[#111113] overflow-hidden space-y-2 pb-3 group"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-black">
                    <img
                      src={show.posterUrl}
                      alt={show.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-[#111113] border border-amber-400 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{show.rating}</span>
                    </div>
                  </div>
                  <div className="px-3">
                    <p className="font-oswald font-bold text-lg uppercase text-[#111113] truncate leading-tight">{show.title}</p>
                    <p className="label truncate mt-0.5">{show.venue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="pt-6 border-t-2 border-[#111113] flex items-center justify-between label">
          <span>Proscenium Theatre Diary</span>
          <span>Generated {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

