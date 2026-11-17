import React, { useState, useEffect } from 'react';
import {
  UserAccount,
  UserInvite,
  UserRole,
  UserBranchAccess,
  UserAccountStatus
} from '../types';
import {
  createUserAccountInvite,
  updateUserAccountByAdmin,
  updateOwnUserProfile,
  deleteUserInvite,
  deleteUserAccount,
  formatReadableFirestoreError
} from '../lib/firestoreService';
import {
  Users,
  X,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Trash2,
  Save,
  UserCheck,
  Ban,
  Search
} from 'lucide-react';

interface UserAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  users: UserAccount[];
  invites: UserInvite[];
}

export const UserAccountsModal: React.FC<UserAccountsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  invites,
}) => {
  const isAdmin = currentUser.role === 'Admin';
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'profile'>(isAdmin ? 'manage' : 'profile');
  const [searchQuery, setSearchQuery] = useState('');

  // Create User Account Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Staff');
  const [newBranch, setNewBranch] = useState<UserBranchAccess>('Negombo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Own profile edit state
  const [myName, setMyName] = useState(currentUser.displayName);
  const [myPhone, setMyPhone] = useState(currentUser.phone || '');
  const [myJobTitle, setMyJobTitle] = useState(currentUser.jobTitle || '');

  useEffect(() => {
    setMyName(currentUser.displayName);
    setMyPhone(currentUser.phone || '');
    setMyJobTitle(currentUser.jobTitle || '');
  }, [currentUser]);

  if (!isOpen) return null;

  const pendingUsers = users.filter(u => u.status === 'Pending');
  const pendingInvites = invites.filter(inv => inv.status === 'Pending');

  const filteredUsers = users
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.branchAccess.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return a.displayName.localeCompare(b.displayName);
    });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newName.trim();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid Full Name and Google Email Address.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // If user already registered in `users`, activate & update them directly
      const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        await updateUserAccountByAdmin(existingUser.uid, {
          displayName: cleanName,
          phone: newPhone.trim(),
          jobTitle: newJobTitle.trim(),
          role: newRole,
          branchAccess: newBranch,
          status: 'Active',
        });
        setFeedback({
          type: 'success',
          text: `Existing account for ${cleanEmail} updated and activated (${newRole} • ${newBranch} Branch).`
        });
      } else {
        await createUserAccountInvite({
          email: cleanEmail,
          displayName: cleanName,
          phone: newPhone.trim(),
          jobTitle: newJobTitle.trim(),
          role: newRole,
          branchAccess: newBranch,
          createdByUid: currentUser.uid,
        });
        setFeedback({
          type: 'success',
          text: `User account created for ${cleanEmail} (${newRole} • ${newBranch} Branch). They can now click "Sign In with Google" to access their account.`
        });
      }

      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewJobTitle('');
      setNewRole('Staff');
      setNewBranch('Negombo');
      setActiveTab('manage');
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: formatReadableFirestoreError(err) || 'Failed to create user account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAdminAction = async (fn: () => Promise<void>, successMessage?: string) => {
    setFeedback(null);
    try {
      await fn();
      if (successMessage) {
        setFeedback({ type: 'success', text: successMessage });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: formatReadableFirestoreError(err) || 'Action failed. Please try again.' });
    }
  };

  const handleSaveOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!myName.trim()) {
      setFeedback({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateOwnUserProfile(currentUser.uid, {
        displayName: myName.trim(),
        phone: myPhone.trim(),
        jobTitle: myJobTitle.trim(),
      });
      setFeedback({ type: 'success', text: 'Your profile details have been updated.' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: formatReadableFirestoreError(err) || 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                {isAdmin ? 'User Accounts & Access Management' : 'My User Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'Create staff accounts, approve new registrations, and manage Dubai / Negombo branch permissions'
                  : 'View your role, branch assignment, and update contact details'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => { setActiveTab('manage'); setFeedback(null); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activeTab === 'manage'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All Accounts ({users.length + pendingInvites.length})</span>
                  {pendingUsers.length > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      {pendingUsers.length} pending
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('create'); setFeedback(null); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create User Account</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setActiveTab('profile'); setFeedback(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: CREATE NEW USER ACCOUNT */}
          {isAdmin && activeTab === 'create' && (
            <form onSubmit={handleCreateAccount} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Create New Staff / Admin Account</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter the user's Google email and assign their role and branch office. They will be immediately active upon signing in with Google.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ayesha Fernando"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Google Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      maxLength={254}
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="staff@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={40}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+971 / +94..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={80}
                      value={newJobTitle}
                      onChange={(e) => setNewJobTitle(e.target.value)}
                      placeholder="e.g. Visa Processing Officer"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Staff">Staff (Operational Access)</option>
                    <option value="Manager">Manager (Branch Operations & Financials)</option>
                    <option value="Admin">Admin (Full Control & User Management)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branch Access *</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value as UserBranchAccess)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Negombo">🇱🇰 Negombo Branch Only (LKR)</option>
                    <option value="Dubai">🇦🇪 Dubai Branch Only (AED)</option>
                    <option value="All">🏢 All Branches (Dubai & Negombo)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-70"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create User Account'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE ALL ACCOUNTS */}
          {isAdmin && activeTab === 'manage' && (
            <div className="space-y-5">
              {/* Search & Quick Create */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search user by name, email, or branch..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Create User Account</span>
                </button>
              </div>

              {/* Pending Invites (Pre-created accounts awaiting first sign-in) */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pre-Created Accounts Awaiting First Sign-In ({pendingInvites.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">{inv.displayName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Ready for Google Sign-In
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-mono">{inv.email}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                            <span>Role: <strong>{inv.role}</strong></span>
                            <span>•</span>
                            <span>
                              Branch:{' '}
                              <strong>
                                {inv.branchAccess === 'Dubai' ? '🇦🇪 Dubai' : inv.branchAccess === 'Negombo' ? '🇱🇰 Negombo' : '🏢 All'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {confirmDeleteId === inv.id ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  runAdminAction(async () => {
                                    await deleteUserInvite(inv.id);
                                    setConfirmDeleteId(null);
                                  }, `Invite for ${inv.email} removed.`)
                                }
                                className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                              >
                                Confirm Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(inv.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Revoke invite"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registered Users */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Registered User Accounts ({filteredUsers.length})
                </h4>

                {filteredUsers.map((u) => {
                  const isSelf = u.uid === currentUser.uid;
                  const isPending = u.status === 'Pending';
                  const isSuspended = u.status === 'Suspended';

                  return (
                    <div
                      key={u.uid}
                      className={`rounded-xl border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isPending
                          ? 'bg-amber-50/70 border-amber-300'
                          : isSuspended
                          ? 'bg-red-50/40 border-red-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{u.displayName}</span>
                            {isSelf && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                                You
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPending
                                  ? 'bg-amber-200 text-amber-950'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {u.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-mono">{u.email}</div>
                          {(u.jobTitle || u.phone) && (
                            <div className="text-[11px] text-slate-500">
                              {[u.jobTitle, u.phone].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            runAdminAction(
                              () => updateUserAccountByAdmin(u.uid, { role: e.target.value as UserRole }),
                              `Updated role for ${u.displayName}.`
                            )
                          }
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer disabled:opacity-60"
                          title="Role"
                        >
                          <option value="Staff">Staff</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>

                        <select
                          value={u.branchAccess}
                          disabled={isSelf}
                          onChange={(e) =>
                            runAdminAction(
                              () => updateUserAccountByAdmin(u.uid, { branchAccess: e.target.value as UserBranchAccess }),
                              `Updated branch access for ${u.displayName}.`
                            )
                          }
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer disabled:opacity-60"
                          title="Branch Access"
                        >
                          <option value="Negombo">🇱🇰 Negombo</option>
                          <option value="Dubai">🇦🇪 Dubai</option>
                          <option value="All">🏢 All Branches</option>
                        </select>

                        {!isSelf && (
                          <>
                            {u.status !== 'Active' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  runAdminAction(
                                    () => updateUserAccountByAdmin(u.uid, { status: 'Active' as UserAccountStatus }),
                                    `Activated ${u.displayName}.`
                                  )
                                }
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{isPending ? 'Approve & Activate' : 'Reactivate'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  runAdminAction(
                                    () => updateUserAccountByAdmin(u.uid, { status: 'Suspended' as UserAccountStatus }),
                                    `Suspended ${u.displayName}.`
                                  )
                                }
                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </button>
                            )}

                            {confirmDeleteId === u.uid ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    runAdminAction(async () => {
                                      await deleteUserAccount(u.uid);
                                      setConfirmDeleteId(null);
                                    }, `Deleted user account for ${u.displayName}.`)
                                  }
                                  className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(u.uid)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete user account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MY PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveOwnProfile} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Your Account Profile</h3>
                  <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">
                    Role: {currentUser.role}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>
                      {currentUser.branchAccess === 'Dubai'
                        ? 'Dubai Branch'
                        : currentUser.branchAccess === 'Negombo'
                        ? 'Negombo Branch'
                        : 'All Branches'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={myPhone}
                    onChange={(e) => setMyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Title</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={myJobTitle}
                    onChange={(e) => setMyJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
