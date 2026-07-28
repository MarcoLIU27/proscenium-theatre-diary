import React, { useState, useEffect } from 'react';
import { Production } from '../types';
import { X, Star, MapPin, Music, Edit3, Trash2, User } from 'lucide-react';

interface ProductionDetailModalProps {
  production: Production | null;
  onClose: () => void;
  onEdit: (production: Production) => void;
  onDelete: (id: string) => void;
}

export const ProductionDetailModal: React.FC<ProductionDetailModalProps> = ({
  production,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [headerBgColor, setHeaderBgColor] = useState<string>('#111113');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [production?.id]);

  useEffect(() => {
    if (!production?.posterUrl) {
      setHeaderBgColor('#111113');
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 20;
        canvas.height = 20;
        ctx.drawImage(img, 0, 0, 20, 20);

        const imageData = ctx.getImageData(0, 0, 20, 20);
        const data = imageData.data;

        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];

          if (alpha > 128) {
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }

        if (count > 0 && isMounted) {
          const avgR = Math.round(rSum / count);
          const avgG = Math.round(gSum / count);
          const avgB = Math.round(bSum / count);
          setHeaderBgColor(`rgb(${avgR}, ${avgG}, ${avgB})`);
        }
      } catch {
        if (isMounted) setHeaderBgColor('#111113');
      }
    };

    img.onerror = () => {
      if (isMounted) setHeaderBgColor('#111113');
    };

    img.src = production.posterUrl;

    return () => {
      isMounted = false;
    };
  }, [production?.posterUrl]);

  if (!production) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-2 border-[#111113] max-w-2xl w-full my-8 shadow-2xl overflow-hidden text-[#111113] flex flex-col max-h-[90vh]">
        {/* Modal Header with 3:4 Vertical Poster and Dynamic Poster Main Color */}
        <div 
          className="p-5 sm:p-6 text-white relative shrink-0 border-b-2 border-[#111113] transition-colors duration-300"
          style={{ 
            backgroundColor: headerBgColor
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#2A5AEE] text-white transition-colors border border-white/30 cursor-pointer z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* 3:4 Vertical Poster Container */}
            <div className="w-32 sm:w-40 aspect-[3/4] shrink-0 border-2 border-white/30 bg-[#1c1c20] relative overflow-hidden shadow-xl">
              <img
                src={production.posterUrl}
                alt={production.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Title & Metadata Details */}
            <div className="flex-1 space-y-2 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#2A5AEE] border border-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider px-3 py-1">
                  {production.category}
                </span>

                {production.theatreType && (
                  <span className="bg-white/20 border border-white/30 text-white font-mono font-bold text-xs uppercase tracking-wider px-3 py-1">
                    {production.theatreType}
                  </span>
                )}

                {/* Star Rating Badge */}
                <div className="flex items-center space-x-1.5 bg-[#1c1c20] border border-amber-400 px-3 py-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-amber-400">{production.rating} / 5</span>
                </div>
              </div>

              <h1 className="font-oswald text-3xl sm:text-4xl font-bold uppercase text-white leading-none pt-1">
                {production.title}
              </h1>

              <p className="text-xs text-white/90 font-mono uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#2A5AEE] shrink-0" />
                <span>{production.venue}</span>
                {production.city && <span className="text-white/70">• {production.city}</span>}
              </p>

              {production.time && (
                <p className="text-xs text-white/70 font-mono">
                  Showtime: <span className="text-white font-bold">{production.time}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Key Facts Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8F7F4] p-4 border border-[#111113]">
            <div>
              <span className="label block">Date</span>
              <span className="font-bold text-[#111113]">{production.date}</span>
            </div>

            <div>
              <span className="label block">Showtime</span>
              <span className="font-bold text-[#111113]">
                {production.time === 'Matinee' ? '☀️ Matinee' : '🌙 Evening'}
              </span>
            </div>

            <div>
              <span className="label block">Production</span>
              <span className="font-bold text-[#111113]">{production.theatreType || 'Broadway'}</span>
            </div>

            <div>
              <span className="label block">Ticket Price</span>
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="font-bold text-emerald-700">
                  {production.ticketPrice ? `${production.currency || '$'}${production.ticketPrice}` : 'N/A'}
                </span>
                {production.isRushed && (
                  <span className="bg-amber-400 text-[#111113] border border-[#111113] text-[10px] font-mono font-bold uppercase px-1.5 py-0.5">
                    Rushed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Review Notes */}
          {production.notes && (
            <div className="space-y-1.5">
              <h3 className="label">Personal Review & Reflection</h3>
              <div className="bg-[#F8F7F4] p-4 border border-[#111113] text-[#111113] italic leading-relaxed text-xs">
                "{production.notes}"
              </div>
            </div>
          )}

          {/* Synopsis */}
          {production.synopsis ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="label">Show Plot & Synopsis</h3>
                <span className="text-[10px] font-mono font-bold text-[#2A5AEE] bg-[#2A5AEE]/10 px-2 py-0.5 border border-[#2A5AEE]/30">
                  ✨ Synopsis
                </span>
              </div>
              <p className="text-[#111113]/90 text-xs leading-relaxed bg-[#F8F7F4] p-4 border border-[#111113] font-normal">
                {production.synopsis}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <h3 className="label">Show Plot & Synopsis</h3>
              <p className="text-[#111113]/50 text-xs italic bg-[#F8F7F4] p-3 border border-dashed border-[#111113]/30">
                No plot synopsis added yet. Edit this show to add or click AI Auto-Fill to generate one.
              </p>
            </div>
          )}

          {/* Tags */}
          {production.tags && production.tags.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="label">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {production.tags.map((tag, idx) => (
                  <span key={idx} className="bg-[#EEECE7] border border-[#111113]/30 text-[#111113] px-3 py-1 text-xs font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t-2 border-[#111113] bg-[#EEECE7] flex flex-wrap items-center justify-between gap-3">
          {isConfirmingDelete ? (
            <div className="flex items-center space-x-2 bg-red-100 border border-red-400 p-1.5 px-3">
              <span className="text-xs text-red-700 font-bold font-mono">Delete this entry?</span>
              <button
                type="button"
                onClick={() => {
                  onDelete(production.id);
                  setIsConfirmingDelete(false);
                  onClose();
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase px-3 py-1 cursor-pointer transition-colors"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="bg-neutral-300 hover:bg-neutral-400 text-neutral-800 font-mono text-xs font-bold uppercase px-2 py-1 cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center space-x-1.5 text-red-600 hover:bg-red-100 px-3 py-2 border border-red-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Entry</span>
            </button>
          )}

          <div className="flex items-center space-x-3 font-mono">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#111113] text-[#111113] hover:bg-[#111113] hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(production);
              }}
              className="flex items-center space-x-1.5 bg-[#2A5AEE] hover:bg-[#1f47c9] text-white border-2 border-[#111113] font-oswald text-sm uppercase font-bold px-5 py-2 tracking-wider shadow-[2px_2px_0px_0px_#111113] transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Entry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

