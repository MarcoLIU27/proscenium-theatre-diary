import React, { useState, useEffect } from 'react';
import { Production } from './types';
import { loadProductions, saveProductions, exportBackupJSON, resetToSampleData } from './utils/storage';
import { Navbar } from './components/Navbar';
import { JournalView } from './components/JournalView';
import { CalendarView } from './components/CalendarView';
import { StatsReportView } from './components/StatsReportView';
import { AddEditProductionModal } from './components/AddEditProductionModal';
import { ProductionDetailModal } from './components/ProductionDetailModal';
import { AuthModal } from './components/AuthModal';
import { RefreshCw, FileJson } from 'lucide-react';
import { 
  auth, 
  onAuthStateChanged, 
  subscribeToUserProductions, 
  saveProductionToCloud, 
  deleteProductionFromCloud, 
  seedInitialDataToCloud,
  signInAnonymously,
  User 
} from './lib/firebase';

export default function App() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [activeTab, setActiveTab] = useState<'journal' | 'calendar' | 'stats'>('calendar');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [initialDateForAdd, setInitialDateForAdd] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Monitor Firebase Auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        // Auto sign-in anonymously if no user is logged in
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error('Anonymous sign-in error:', e);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync user's productions with Firestore in real-time
  useEffect(() => {
    if (!currentUser) return;

    let isSeeding = false;

    const unsubscribeSnapshot = subscribeToUserProductions(
      currentUser.uid,
      async (cloudProds) => {
        if (cloudProds.length === 0 && !isSeeding) {
          isSeeding = true;
          // First time cloud user: Seed Firestore with existing local data or samples
          const localInitial = loadProductions();
          await seedInitialDataToCloud(currentUser.uid, localInitial);
        } else {
          setProductions(cloudProds);
          saveProductions(cloudProds); // Cache locally
        }
      },
      (err) => {
        console.warn('Falling back to local data due to subscription error', err);
        setProductions(loadProductions());
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  // Save changes to state, Firestore, and LocalStorage
  const handleSaveProduction = async (prod: Production) => {
    let updated: Production[];
    const exists = productions.some((p) => p.id === prod.id);
    if (exists) {
      updated = productions.map((p) => (p.id === prod.id ? prod : p));
    } else {
      updated = [prod, ...productions];
    }
    setProductions(updated);
    saveProductions(updated);

    if (currentUser) {
      try {
        await saveProductionToCloud(currentUser.uid, prod);
      } catch (err) {
        console.error('Failed to save to Firestore:', err);
      }
    }
  };

  // Delete production
  const handleDeleteProduction = async (id: string) => {
    const updated = productions.filter((p) => p.id !== id);
    setProductions(updated);
    saveProductions(updated);

    if (currentUser) {
      try {
        await deleteProductionFromCloud(currentUser.uid, id);
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
      }
    }
  };

  // Reset to default sample data
  const handleResetData = async () => {
    if (confirm('Reset your theatre diary to initial sample productions? Custom entries will be replaced.')) {
      const samples = resetToSampleData();
      setProductions(samples);
      if (currentUser) {
        await seedInitialDataToCloud(currentUser.uid, samples);
      }
    }
  };

  // Open add modal for a specific calendar date
  const handleAddOnDate = (dateStr: string) => {
    setInitialDateForAdd(dateStr);
    setEditingProduction(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1a1a1a] font-sans selection:bg-[#c41e3a] selection:text-white flex flex-col">
      {/* Sidebar on Desktop / Header on Mobile */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setInitialDateForAdd('');
          setEditingProduction(null);
          setIsAddModalOpen(true);
        }}
        productionCount={productions.length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Container offset for desktop sidebar */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 p-6 sm:p-10 lg:p-12 max-w-7xl w-full mx-auto space-y-10">
          {/* Active Tab View rendering */}
          {activeTab === 'calendar' && (
            <CalendarView
              productions={productions}
              onSelectProduction={(prod) => setSelectedProduction(prod)}
              onAddOnDate={handleAddOnDate}
            />
          )}

          {activeTab === 'journal' && (
            <JournalView
              productions={productions}
              onSelectProduction={(prod) => setSelectedProduction(prod)}
              onOpenAddModal={() => {
                setInitialDateForAdd('');
                setEditingProduction(null);
                setIsAddModalOpen(true);
              }}
              onDeleteProduction={handleDeleteProduction}
            />
          )}

          {activeTab === 'stats' && (
            <StatsReportView
              productions={productions}
              onExportJSON={() => exportBackupJSON(productions)}
              onResetData={handleResetData}
            />
          )}

          {/* Footer */}
          <footer className="pt-10 mt-12 border-t border-[#1a1a1a]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#1a1a1a]/50 gap-4">
            <div>
              <p className="serif text-sm font-semibold text-[#1a1a1a]">Proscenium Theatre Diary</p>
              <p className="text-[10px] uppercase font-mono tracking-widest mt-0.5">
                {currentUser?.email ? `Synced as ${currentUser.email}` : 'Firebase Cloud Sync Active'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 hover:text-[#c41e3a] transition-colors"
                title="Reset sample productions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="label text-[10px]">Reset Samples</span>
              </button>
              <button
                onClick={() => exportBackupJSON(productions)}
                className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span className="label text-[10px]">Export JSON</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Log / Edit Modal */}
      <AddEditProductionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveProduction}
        editingProduction={editingProduction}
        initialDate={initialDateForAdd}
      />

      {/* Production Detail Modal */}
      <ProductionDetailModal
        production={selectedProduction}
        onClose={() => setSelectedProduction(null)}
        onEdit={(prod) => {
          setEditingProduction(prod);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteProduction}
      />

      {/* Firebase Cloud Sync & Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

