import React, { useState, useEffect } from 'react';
import { TicketFollowup, VisaFollowup, ActivityComment, VisaStatus, TicketStatus, CompanyProfile, DEFAULT_COMPANY_PROFILE, VisaPaymentStatus } from './types';
import { INITIAL_TICKETS, INITIAL_VISAS, INITIAL_COMMENTS } from './data/initialData';
import { 
  subscribeToTickets, 
  subscribeToVisas, 
  subscribeToComments, 
  subscribeToCompanyProfile, 
  saveTicketToFirestore, 
  deleteTicketFromFirestore, 
  saveVisaToFirestore, 
  deleteVisaFromFirestore, 
  saveCommentToFirestore, 
  saveCompanyProfileToFirestore, 
  clearAllFirestoreData, 
  seedDemoFirestoreData,
  checkAndSeedInitialDataIfNeeded
} from './lib/firestoreService';
import { safeGetItem, safeSetItem, safeRemoveItem, sanitizeVisasForLocalCache } from './utils/safeStorage';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { TicketFollowupTable } from './components/TicketFollowupTable';
import { VisaFollowupTable } from './components/VisaFollowupTable';
import { TicketDetailModal } from './components/TicketDetailModal';
import { VisaDetailModal } from './components/VisaDetailModal';
import { CommentsModal } from './components/CommentsModal';
import { AddTicketModal } from './components/AddTicketModal';
import { AddVisaModal } from './components/AddVisaModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import { CompanySettingsModal } from './components/CompanySettingsModal';

export default function App() {
  // Auth state - session based login screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    safeRemoveItem('tf_is_authenticated');
    try {
      return sessionStorage.getItem('tf_is_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('tf_is_authenticated');
    } catch {
      // ignore
    }
    safeRemoveItem('tf_is_authenticated');
    setIsAuthenticated(false);
  };

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'visas'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Main Datasets with Safe Storage persistence
  const [tickets, setTickets] = useState<TicketFollowup[]>(() => {
    return safeGetItem<TicketFollowup[]>('tf_tickets', []);
  });

  const [visas, setVisas] = useState<VisaFollowup[]>(() => {
    return safeGetItem<VisaFollowup[]>('tf_visas', []);
  });

  const [comments, setComments] = useState<ActivityComment[]>(() => {
    return safeGetItem<ActivityComment[]>('tf_comments', []);
  });

  // Company Profile state with Safe Storage persistence
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = safeGetItem<CompanyProfile | null>('tf_company_profile', null);
    if (saved && typeof saved === 'object' && saved.companyName) {
      return saved;
    }
    return DEFAULT_COMPANY_PROFILE;
  });

  // Save changes to safe local storage as backup (sanitizing heavy attachments)
  useEffect(() => {
    safeSetItem('tf_tickets', tickets);
  }, [tickets]);

  useEffect(() => {
    // Strip large base64 attachments when writing to local browser cache
    const lightVisas = sanitizeVisasForLocalCache(visas);
    safeSetItem('tf_visas', lightVisas);
  }, [visas]);

  useEffect(() => {
    safeSetItem('tf_comments', comments);
  }, [comments]);

  useEffect(() => {
    safeSetItem('tf_company_profile', companyProfile);
  }, [companyProfile]);

  // Firestore Real-time Live Sync
  useEffect(() => {
    // Check if initial seeding is needed ONLY for brand-new uninitialized database
    checkAndSeedInitialDataIfNeeded(INITIAL_TICKETS, INITIAL_VISAS, INITIAL_COMMENTS);

    const unsubTickets = subscribeToTickets((fireTickets) => {
      setTickets(fireTickets);
    });

    const unsubVisas = subscribeToVisas((fireVisas) => {
      setVisas(fireVisas);
    });

    const unsubComments = subscribeToComments((fireComments) => {
      setComments(fireComments);
    });

    const unsubProfile = subscribeToCompanyProfile((fireProfile) => {
      if (fireProfile && fireProfile.companyName) {
        setCompanyProfile(fireProfile);
      }
    });

    return () => {
      unsubTickets();
      unsubVisas();
      unsubComments();
      unsubProfile();
    };
  }, []);

  // Dynamic list of recorded Agency / Customer names
  const recordedAgencies = React.useMemo(() => {
    const names = new Set<string>();
    if (companyProfile.companyName) names.add(companyProfile.companyName.trim());
    names.add('Royal Horizon Agency');
    names.add('Al Safa Travels');
    names.add('Skyline Tours');
    names.add('Global Travel Hub');
    names.add('Direct Customer (Walk-in)');

    visas.forEach(v => {
      if (v.customer && v.customer.trim()) names.add(v.customer.trim());
    });
    tickets.forEach(t => {
      if (t.customer && t.customer.trim()) names.add(t.customer.trim());
    });

    return Array.from(names).sort();
  }, [visas, tickets, companyProfile]);

  // Filters
  const [selectedTicketStatusFilter, setSelectedTicketStatusFilter] = useState<string>('ALL');
  const [selectedVisaStatusFilter, setSelectedVisaStatusFilter] = useState<string>('ALL');
  const [selectedVisaCategoryFilter, setSelectedVisaCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [detailModalTicket, setDetailModalTicket] = useState<TicketFollowup | null>(null);
  const [detailModalVisa, setDetailModalVisa] = useState<VisaFollowup | null>(null);
  
  const [commentsModalItem, setCommentsModalItem] = useState<TicketFollowup | VisaFollowup | null>(null);
  const [commentsTargetType, setCommentsTargetType] = useState<'ticket' | 'visa'>('ticket');

  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketFollowup | null>(null);
  
  const [isAddVisaOpen, setIsAddVisaOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaFollowup | null>(null);

  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Clear all data to start completely fresh
  const handleClearAllData = () => {
    setIsCompanySettingsOpen(false);
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Data & Start Fresh',
      message: 'Are you sure you want to delete ALL tickets, visas, and comment entries from the server database? This will give you a clean, empty dataset so you can feed your company details without any sample data.',
      confirmLabel: 'Clear Everything Now',
      onConfirm: async () => {
        setTickets([]);
        setVisas([]);
        setComments([]);
        safeRemoveItem('tf_tickets');
        safeRemoveItem('tf_visas');
        safeRemoveItem('tf_comments');
        await clearAllFirestoreData();
      }
    });
  };

  // Reset to clean dataset
  const handleResetToDemoData = handleClearAllData;
  const handleResetData = handleClearAllData;

  // Ticket CRUD operations
  const handleAddTicket = (newTicket: TicketFollowup) => {
    setTickets(prev => [newTicket, ...(Array.isArray(prev) ? prev : [])]);
    saveTicketToFirestore(newTicket);
  };

  const handleUpdateTicket = (updatedTicket: TicketFollowup) => {
    setTickets(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === updatedTicket.id ? updatedTicket : t));
    if (detailModalTicket?.id === updatedTicket.id) {
      setDetailModalTicket(updatedTicket);
    }
    saveTicketToFirestore(updatedTicket);
  };

  const handleDeleteTicket = (id: string) => {
    const targetTicket = (tickets || []).find(t => t.id === id);
    const label = targetTicket ? `PNR ${targetTicket.pnr}` : 'this ticket entry';
    setConfirmModal({
      isOpen: true,
      title: 'Delete Ticket Reissue Entry',
      message: `Are you sure you want to delete ${label}? This action cannot be undone.`,
      confirmLabel: 'Delete Ticket Entry',
      onConfirm: () => {
        setTickets(prev => (Array.isArray(prev) ? prev : []).filter(t => t.id !== id));
        deleteTicketFromFirestore(id);
      }
    });
  };

  const handleUpdateTicketStatus = (id: string, newStatus: TicketStatus) => {
    let targetUpdated: TicketFollowup | undefined;
    setTickets(prev => (Array.isArray(prev) ? prev : []).map(t => {
      if (t.id === id) {
        targetUpdated = { ...t, status: newStatus };
        return targetUpdated;
      }
      return t;
    }));
    if (targetUpdated) {
      saveTicketToFirestore(targetUpdated);
    }
  };

  // Visa CRUD operations
  const handleAddVisa = (newVisa: VisaFollowup) => {
    setVisas(prev => [newVisa, ...(Array.isArray(prev) ? prev : [])]);
    saveVisaToFirestore(newVisa);
  };

  const handleUpdateVisa = (updatedVisa: VisaFollowup) => {
    setVisas(prev => (Array.isArray(prev) ? prev : []).map(v => v.id === updatedVisa.id ? updatedVisa : v));
    if (detailModalVisa && detailModalVisa.id === updatedVisa.id) {
      setDetailModalVisa(updatedVisa);
    }
    setEditingVisa(null);
    saveVisaToFirestore(updatedVisa);
  };

  const handleDeleteVisa = (id: string) => {
    const targetVisa = visas.find(v => v.id === id);
    const nameLabel = targetVisa ? `${targetVisa.firstName} ${targetVisa.lastName}`.trim() : 'this visa record';
    const passportLabel = targetVisa?.passportNo ? ` (${targetVisa.passportNo})` : '';
    setConfirmModal({
      isOpen: true,
      title: 'Delete Visa Application',
      message: `Are you sure you want to delete the visa entry for ${nameLabel}${passportLabel}? This action cannot be undone.`,
      confirmLabel: 'Delete Visa Record',
      onConfirm: () => {
        setVisas(prev => prev.filter(v => v.id !== id));
        if (detailModalVisa && detailModalVisa.id === id) {
          setDetailModalVisa(null);
        }
        deleteVisaFromFirestore(id);
      }
    });
  };

  const handleUpdateVisaStatus = (
    id: string,
    newStatus: VisaStatus,
    icpFileNo?: string,
    lastCheckedAt?: string,
    expiryDate?: string,
    entryDate?: string
  ) => {
    let targetUpdated: VisaFollowup | undefined;
    setVisas(visas.map(v => {
      if (v.id === id) {
        targetUpdated = {
          ...v,
          status: newStatus,
          ...(icpFileNo ? { icpFileNo } : {}),
          ...(lastCheckedAt ? { lastCheckedAt } : {}),
          ...(expiryDate ? { expiryDate } : {}),
          ...(entryDate ? { entryDate } : {})
        };
        return targetUpdated;
      }
      return v;
    }));
    if (targetUpdated) {
      if (detailModalVisa && detailModalVisa.id === id) {
        setDetailModalVisa(targetUpdated);
      }
      saveVisaToFirestore(targetUpdated);
    }
  };

  const handleUpdateVisaPaymentStatus = (id: string, paymentStatus: VisaPaymentStatus) => {
    let targetUpdated: VisaFollowup | undefined;
    setVisas(visas.map(v => {
      if (v.id === id) {
        targetUpdated = {
          ...v,
          paymentStatus
        };
        return targetUpdated;
      }
      return v;
    }));
    if (targetUpdated) {
      if (detailModalVisa && detailModalVisa.id === id) {
        setDetailModalVisa(targetUpdated);
      }
      saveVisaToFirestore(targetUpdated);
    }
  };

  // Comment Handlers
  const handleAddComment = (text: string, author: string) => {
    if (!commentsModalItem) return;
    const newComment: ActivityComment = {
      id: `c-${Date.now()}`,
      targetType: commentsTargetType,
      targetId: commentsModalItem.id,
      author,
      text,
      timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
    setComments([newComment, ...comments]);
    saveCommentToFirestore(newComment);
  };

  // Map comment count
  const commentsCountMap = comments.reduce((acc, c) => {
    acc[c.targetId] = (acc[c.targetId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* Top Application Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddTicket={() => {
          setEditingTicket(null);
          setIsAddTicketOpen(true);
        }}
        onAddVisa={() => {
          setEditingVisa(null);
          setIsAddVisaOpen(true);
        }}
        onResetData={handleResetData}
        ticketCount={tickets.length}
        visaCount={visas.length}
        onLogout={handleLogout}
        onOpenCompanySettings={() => setIsCompanySettingsOpen(true)}
        companyProfile={companyProfile}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {activeTab === 'dashboard' && (
          <DashboardOverview
            tickets={tickets}
            visas={visas}
            onSelectVisaStatusFilter={(st) => setSelectedVisaStatusFilter(st)}
            onSelectTicketStatusFilter={(st) => setSelectedTicketStatusFilter(st)}
            onSelectVisaCategoryFilter={(cat) => setSelectedVisaCategoryFilter(cat)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenTicketDetails={(t) => setDetailModalTicket(t)}
            onOpenVisaDetails={(v) => setDetailModalVisa(v)}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketFollowupTable
            tickets={tickets}
            searchTerm={searchTerm}
            selectedStatusFilter={selectedTicketStatusFilter}
            setSelectedStatusFilter={setSelectedTicketStatusFilter}
            onOpenDetails={(t) => setDetailModalTicket(t)}
            onOpenComments={(t) => {
              setCommentsModalItem(t);
              setCommentsTargetType('ticket');
            }}
            onAddNewTicket={() => {
              setEditingTicket(null);
              setIsAddTicketOpen(true);
            }}
            onEditTicket={(t) => {
              setEditingTicket(t);
              setIsAddTicketOpen(true);
            }}
            onDeleteTicket={handleDeleteTicket}
            onUpdateStatus={handleUpdateTicketStatus}
            commentsCountMap={commentsCountMap}
          />
        )}

        {activeTab === 'visas' && (
          <VisaFollowupTable
            visas={visas}
            searchTerm={searchTerm}
            selectedStatusFilter={selectedVisaStatusFilter}
            setSelectedStatusFilter={setSelectedVisaStatusFilter}
            selectedCategoryFilter={selectedVisaCategoryFilter}
            setSelectedCategoryFilter={setSelectedVisaCategoryFilter}
            onOpenDetails={(v) => setDetailModalVisa(v)}
            onOpenComments={(v) => {
              setCommentsModalItem(v);
              setCommentsTargetType('visa');
            }}
            onAddNewVisa={() => {
              setEditingVisa(null);
              setIsAddVisaOpen(true);
            }}
            onEditVisa={(v) => {
              setEditingVisa(v);
              setIsAddVisaOpen(true);
            }}
            onDeleteVisa={handleDeleteVisa}
            onUpdateStatus={handleUpdateVisaStatus}
            onUpdatePaymentStatus={handleUpdateVisaPaymentStatus}
            commentsCountMap={commentsCountMap}
          />
        )}

      </main>

      {/* Modals */}
      {detailModalTicket && (
        <TicketDetailModal
          ticket={detailModalTicket}
          onClose={() => setDetailModalTicket(null)}
          onUpdateTicket={handleUpdateTicket}
          onEditTicket={(t) => {
            setDetailModalTicket(null);
            setEditingTicket(t);
            setIsAddTicketOpen(true);
          }}
          onDeleteTicket={(id) => {
            setDetailModalTicket(null);
            handleDeleteTicket(id);
          }}
          companyProfile={companyProfile}
        />
      )}

      {detailModalVisa && (
        <VisaDetailModal
          visa={detailModalVisa}
          onClose={() => setDetailModalVisa(null)}
          onUpdateVisa={handleUpdateVisa}
          onEditVisa={(v) => {
            setDetailModalVisa(null);
            setEditingVisa(v);
            setIsAddVisaOpen(true);
          }}
          onDeleteVisa={(id) => {
            setDetailModalVisa(null);
            handleDeleteVisa(id);
          }}
          onUpdateStatus={handleUpdateVisaStatus}
          onUpdatePaymentStatus={handleUpdateVisaPaymentStatus}
          comments={comments}
          onAddComment={(text, author) => {
            const newComment: ActivityComment = {
              id: `c-${Date.now()}`,
              targetType: 'visa',
              targetId: detailModalVisa.id,
              author,
              text,
              timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            };
            setComments([newComment, ...comments]);
            saveCommentToFirestore(newComment);
          }}
          companyProfile={companyProfile}
        />
      )}

      {commentsModalItem && (
        <CommentsModal
          item={commentsModalItem}
          targetType={commentsTargetType}
          comments={comments}
          onClose={() => setCommentsModalItem(null)}
          onAddComment={handleAddComment}
        />
      )}

      <AddTicketModal
        isOpen={isAddTicketOpen}
        onClose={() => {
          setIsAddTicketOpen(false);
          setEditingTicket(null);
        }}
        onAddTicket={handleAddTicket}
        editingTicket={editingTicket}
        onUpdateTicket={handleUpdateTicket}
        recordedAgencies={recordedAgencies}
        existingTickets={tickets}
        onOpenExistingTicket={(ticket) => {
          setIsAddTicketOpen(false);
          setActiveTab('tickets');
          setDetailModalTicket(ticket);
        }}
      />

      <AddVisaModal
        isOpen={isAddVisaOpen}
        onClose={() => {
          setIsAddVisaOpen(false);
          setEditingVisa(null);
        }}
        onAddVisa={handleAddVisa}
        editingVisa={editingVisa}
        onUpdateVisa={handleUpdateVisa}
        recordedAgencies={recordedAgencies}
        existingVisas={visas}
        onOpenExistingVisa={(visa) => {
          setIsAddVisaOpen(false);
          setActiveTab('visas');
          setCommentsModalItem(visa);
          setCommentsTargetType('visa');
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <CompanySettingsModal
        isOpen={isCompanySettingsOpen}
        onClose={() => setIsCompanySettingsOpen(false)}
        profile={companyProfile}
        onSaveProfile={(newProf) => {
          setCompanyProfile(newProf);
          saveCompanyProfileToFirestore(newProf);
        }}
        onClearAllData={handleClearAllData}
        onResetToDemoData={handleResetToDemoData}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
        Travel & Visa Followup Management System • Tailored to agency operational workflows
      </footer>

    </div>
  );
}
