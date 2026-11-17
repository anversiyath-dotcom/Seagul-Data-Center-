import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { RegistrationFormData } from '../lib/firestoreService';
import { UserAccount, UserBranchAccess } from '../types';
import { SeagullLogo } from './SeagullLogo';
import {
  ShieldCheck,
  AlertCircle,
  UserPlus,
  LogIn,
  User,
  Phone,
  Briefcase,
  Building2,
  Clock,
  LogOut,
  CheckCircle2,
  Ban
} from 'lucide-react';

interface LoginScreenProps {
  pendingAccount?: UserAccount | null;
  authLoading?: boolean;
  authError?: string | null;
  signedInEmail?: string | null;
  onClearAuthError?: () => void;
  onPrepareRegistration?: (data: RegistrationFormData | null) => void;
  onRetryAccountSetup?: (data: RegistrationFormData | null) => Promise<void>;
}

function formatGoogleAuthError(err: any): string {
  const code = err?.code || '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completion. Please try again.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Another sign-in window was already open. Please wait a moment and click again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked by this browser. Please allow popups in your browser address bar and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return `This address (${hostname || 'current domain'}) is not listed in Firebase Authorized Domains yet. Add "${hostname}" under Firebase Console → Authentication → Settings → Authorized domains, or open the official preview link.`;
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error reaching Google Sign-In from this computer. Please check internet/firewall access and try again.';
  }
  if (code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/web-storage-unsupported') {
    return 'Browser privacy/cookie settings on this computer blocked sign-in. Please allow cookies/popups or open this link in a standard browser tab.';
  }
  return err?.message || 'Unable to sign in with Google. Please try again.';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  pendingAccount,
  authLoading = false,
  authError = null,
  signedInEmail = null,
  onClearAuthError,
  onPrepareRegistration,
  onRetryAccountSetup,
}) => {
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [branchAccess, setBranchAccess] = useState<UserBranchAccess>('Negombo');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const visibleError = errorMessage || authError || '';

  const handleGoogleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (onClearAuthError) onClearAuthError();

    let regData: RegistrationFormData | null = null;
    if (mode === 'create') {
      if (!displayName.trim()) {
        setErrorMessage('Please enter your Full Name to create your user account.');
        return;
      }
      regData = {
        displayName: displayName.trim().slice(0, 120),
        phone: phone.trim().slice(0, 40),
        jobTitle: jobTitle.trim().slice(0, 80),
        branchAccess,
      };
    }

    if (onPrepareRegistration) {
      onPrepareRegistration(regData);
    }

    const previousUid = auth.currentUser?.uid || null;
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (previousUid && cred.user.uid === previousUid && onRetryAccountSetup) {
        if (onPrepareRegistration) onPrepareRegistration(null);
        await onRetryAccountSetup(regData);
      }
    } catch (err: any) {
      setErrorMessage(formatGoogleAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMessage('');
    if (onClearAuthError) onClearAuthError();
    await signOut(auth);
  };

  // Pending approval or suspended screen for signed-in users awaiting activation
  if (pendingAccount && pendingAccount.status !== 'Active') {
    const isSuspended = pendingAccount.status === 'Suspended';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
          <div className={`p-7 text-center text-white ${isSuspended ? 'bg-gradient-to-r from-red-900 to-slate-900' : 'bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900'}`}>
            <div className="bg-white/95 inline-block p-3.5 rounded-2xl shadow-xl mb-3">
              <SeagullLogo size="lg" variant="stacked" allowUpload={false} />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">
              {isSuspended ? 'Account Suspended' : 'User Account Created'}
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              {isSuspended
                ? 'Your account access has been paused by an administrator'
                : 'Your registration is saved and awaiting administrator activation'}
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className={`p-4 rounded-xl border flex items-start space-x-3 ${isSuspended ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
              {isSuspended ? (
                <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  {isSuspended ? 'Access Restricted' : 'Pending Administrator Approval'}
                </p>
                <p className="leading-relaxed">
                  {isSuspended
                    ? 'Please contact your agency administrator to reactivate your account.'
                    : 'Your user profile has been created safely. Ask an administrator to open User Accounts and activate your access.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="font-bold text-slate-900">{pendingAccount.displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-mono font-semibold text-slate-800">{pendingAccount.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Requested Branch</span>
                <span className="font-bold text-slate-800">
                  {pendingAccount.branchAccess === 'Dubai'
                    ? '🇦🇪 Dubai Branch'
                    : pendingAccount.branchAccess === 'Negombo'
                    ? '🇱🇰 Negombo Branch'
                    : '🏢 All Branches'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                  {pendingAccount.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 p-7 text-center text-white relative">
          <div className="bg-white/95 inline-block p-3.5 rounded-2xl shadow-xl backdrop-blur-sm mb-3">
            <SeagullLogo size="lg" variant="stacked" allowUpload={false} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mt-1">
            {mode === 'signin' ? 'Staff Portal Sign In' : 'Create User Account'}
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Travel Ticket & Visa Application Workflow System
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
                if (onClearAuthError) onClearAuthError();
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setErrorMessage('');
                if (onClearAuthError) onClearAuthError();
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                mode === 'create'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {visibleError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-lg space-y-2 text-xs text-red-800">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Authentication Notice:</span> {visibleError}
                </div>
              </div>
              {signedInEmail && (
                <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                  {onRetryAccountSetup && (
                    <button
                      type="button"
                      onClick={async () => {
                        setErrorMessage('');
                        if (onClearAuthError) onClearAuthError();
                        await onRetryAccountSetup(
                          mode === 'create' && displayName.trim()
                            ? {
                                displayName: displayName.trim().slice(0, 120),
                                phone: phone.trim().slice(0, 40),
                                jobTitle: jobTitle.trim().slice(0, 80),
                                branchAccess,
                              }
                            : null
                        );
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                    >
                      Retry for {signedInEmail}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Switch Google Account
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'signin' ? (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-blue-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Secure Google Account Sign-In</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Sign in with your authorized Google account to access Dubai (AED) and Negombo (LKR) operations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                disabled={isLoading || authLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-70"
              >
                {isLoading || authLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-500">
                New staff member?{' '}
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Create a User Account
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleGoogleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Mohamed Ahamed"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={40}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+971 / +94..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={80}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Visa Coordinator"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Branch Office
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={branchAccess}
                    onChange={(e) => setBranchAccess(e.target.value as UserBranchAccess)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="Negombo">🇱🇰 Negombo Branch (Sri Lanka • LKR)</option>
                    <option value="Dubai">🇦🇪 Dubai Branch (UAE • AED)</option>
                    <option value="All">🏢 All Branches (Multi-Branch)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading || authLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account with Google</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <p className="text-[11px] font-medium text-slate-500">
            © 2026 <strong className="text-slate-800">Seagull Global</strong>. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};
