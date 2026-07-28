import React, { useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInAnonymously,
  User 
} from '../lib/firebase';
import { X, LogIn, LogOut, User as UserIcon, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Guest sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border-4 border-[#111113] p-6 sm:p-8 shadow-[8px_8px_0px_0px_#111113] my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 border-2 border-[#111113] bg-[#F8F7F4] hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1 text-[#2A5AEE]">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">Cloud Data & Sync</span>
          </div>
          <h2 className="font-oswald text-3xl font-bold uppercase tracking-wide text-[#111113]">
            {currentUser ? 'Your Account' : isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-xs text-[#111113]/70 font-mono mt-1">
            {currentUser 
              ? 'Your theatre viewing history is securely synced to Firebase Cloud.'
              : 'Sign in to access your theatre diary across any device safely.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-500 text-red-800 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {currentUser ? (
          /* Logged In View */
          <div className="space-y-6">
            <div className="bg-[#F8F7F4] border-2 border-[#111113] p-4 flex items-center space-x-3">
              <div className="p-2 bg-[#2A5AEE] text-white border border-[#111113]">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-[#111113] truncate">
                  {currentUser.displayName || currentUser.email || 'Anonymous Guest'}
                </p>
                <p className="text-[10px] font-mono text-[#111113]/60 truncate">
                  UID: {currentUser.uid}
                </p>
                <span className="inline-block mt-1 text-[9px] font-mono font-bold bg-green-200 text-green-900 border border-green-600 px-1.5 py-0.5">
                  ✓ Cloud Sync Active
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full cursor-pointer border-2 border-[#111113] text-center p-3 font-oswald text-base font-bold uppercase bg-[#111113] text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-5">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full cursor-pointer border-2 border-[#111113] p-3 text-xs font-bold font-mono uppercase bg-white hover:bg-[#EEECE7] text-[#111113] transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#111113]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#111113]/20"></div>
              <span className="shrink mx-3 text-[10px] font-mono text-[#111113]/50 uppercase">or email</span>
              <div className="flex-grow border-t border-[#111113]/20"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase text-[#111113]">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#111113]/50" />
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] pl-9 pr-3 py-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase text-[#111113]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#111113]/50" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F8F7F4] border border-[#111113] focus:border-[#2A5AEE] text-[#111113] pl-9 pr-3 py-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer border-2 border-[#111113] p-3 text-sm font-oswald font-bold uppercase bg-[#2A5AEE] hover:bg-[#1f47c9] text-white transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#111113]"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSignUp ? 'Create Account' : 'Sign In with Email'}</span>
              </button>
            </form>

            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#111113]/10">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#2A5AEE] font-bold hover:underline cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>

              <button
                onClick={handleGuestSignIn}
                className="text-[#111113]/60 hover:text-[#111113] underline cursor-pointer"
              >
                Anonymous Guest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
