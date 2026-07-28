import React from 'react';
import { Calendar, BookOpen, BarChart3, Plus, User as UserIcon, CloudCheck } from 'lucide-react';
import { User } from '../lib/firebase';

interface NavbarProps {
  activeTab: 'journal' | 'calendar' | 'stats';
  setActiveTab: (tab: 'journal' | 'calendar' | 'stats') => void;
  onOpenAddModal: () => void;
  productionCount: number;
  currentUser: User | null;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  productionCount,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-80 flex-col fixed inset-y-0 left-0 bg-white border-r-2 border-[#111113] p-8 z-20 justify-between">
        <div>
          {/* Brand Header */}
          <div className="mb-6">
            <h1 
              onClick={() => setActiveTab('calendar')}
              className="font-oswald text-5xl font-bold tracking-tight text-[#111113] uppercase cursor-pointer hover:text-[#2A5AEE] transition-colors leading-[0.9] mb-2"
            >
              Proscenium.
            </h1>
            <div className="flex items-center gap-2">
              <span className="badge">ARCHIVE // {new Date().getFullYear()}</span>
              <span className="badge font-bold text-[#2A5AEE]">{productionCount} LOGS</span>
            </div>
          </div>

          {/* User / Auth Status Box */}
          <button
            onClick={onOpenAuthModal}
            className="w-full text-left bg-[#F8F7F4] hover:bg-[#EEECE7] border border-[#111113] p-3 transition-all mb-8 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="p-1.5 bg-[#111113] text-white border border-[#111113] shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-mono text-xs font-bold text-[#111113] truncate group-hover:text-[#2A5AEE]">
                  {currentUser ? (currentUser.displayName || currentUser.email || 'Guest User') : 'Sign In / Sync'}
                </p>
                <p className="text-[10px] font-mono text-[#111113]/60 truncate">
                  {currentUser ? '✓ Cloud Saved' : 'Tap to enable cloud save'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#2A5AEE] shrink-0">
              {currentUser ? 'Account' : 'Login'}
            </span>
          </button>

          {/* Nav Links */}
          <nav className="flex flex-col gap-2">
            <button
              id="nav-tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`w-full text-left cursor-pointer p-3 text-xs uppercase tracking-wider font-mono border transition-all flex items-center gap-3 ${
                activeTab === 'calendar'
                  ? 'border-[#111113] bg-[#EEECE7] font-bold text-[#111113]'
                  : 'border-transparent hover:border-[#111113]/30 text-[#111113]/70'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#111113]" />
              <span>Calendar</span>
            </button>

            <button
              id="nav-tab-journal"
              onClick={() => setActiveTab('journal')}
              className={`w-full text-left cursor-pointer p-3 text-xs uppercase tracking-wider font-mono border transition-all flex items-center gap-3 ${
                activeTab === 'journal'
                  ? 'border-[#111113] bg-[#EEECE7] font-bold text-[#111113]'
                  : 'border-transparent hover:border-[#111113]/30 text-[#111113]/70'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#111113]" />
              <span>Journal</span>
            </button>

            <button
              id="nav-tab-stats"
              onClick={() => setActiveTab('stats')}
              className={`w-full text-left cursor-pointer p-3 text-xs uppercase tracking-wider font-mono border transition-all flex items-center gap-3 ${
                activeTab === 'stats'
                  ? 'border-[#111113] bg-[#EEECE7] font-bold text-[#111113]'
                  : 'border-transparent hover:border-[#111113]/30 text-[#111113]/70'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#111113]" />
              <span>Stats</span>
            </button>
          </nav>
        </div>

        {/* Log Production Button */}
        <button
          id="btn-log-production"
          onClick={onOpenAddModal}
          className="w-full cursor-pointer border-2 border-[#111113] text-center p-5 font-oswald text-xl font-semibold uppercase bg-[#2A5AEE] hover:bg-[#1f47c9] text-white transition-all tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#111113] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>LOG PRODUCTION</span>
        </button>
      </aside>

      {/* Mobile / Tablet Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b-2 border-[#111113] px-4 py-3">
        <div className="flex items-center justify-between">
          <div onClick={() => setActiveTab('calendar')} className="cursor-pointer flex items-baseline gap-2">
            <h1 className="font-oswald text-3xl font-bold uppercase tracking-tight text-[#111113]">Proscenium.</h1>
            <span className="badge text-[9px] font-bold bg-[#EEECE7]">
              {productionCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 bg-[#F8F7F4] p-1 border border-[#111113] text-xs">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`p-1.5 transition-colors ${
                  activeTab === 'calendar' ? 'bg-[#111113] text-white' : 'text-[#111113]/70'
                }`}
                title="Calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`p-1.5 transition-colors ${
                  activeTab === 'journal' ? 'bg-[#111113] text-white' : 'text-[#111113]/70'
                }`}
                title="Journal"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`p-1.5 transition-colors ${
                  activeTab === 'stats' ? 'bg-[#111113] text-white' : 'text-[#111113]/70'
                }`}
                title="Stats"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </nav>

            <button
              onClick={onOpenAuthModal}
              className="bg-[#F8F7F4] text-[#111113] border border-[#111113] p-1.5 font-mono text-xs flex items-center justify-center cursor-pointer"
              title={currentUser ? (currentUser.displayName || currentUser.email || 'User Account') : 'Sign In'}
            >
              <UserIcon className="w-4 h-4 text-[#2A5AEE]" />
            </button>

            <button
              onClick={onOpenAddModal}
              className="bg-[#2A5AEE] text-white border-2 border-[#111113] px-3 py-1.5 font-oswald text-sm font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

