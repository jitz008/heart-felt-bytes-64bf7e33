import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, Mail, Lock, LogIn, UserPlus, Sparkles, 
  ArrowRight, Chrome, ShieldAlert, Check, HelpCircle, Loader2 
} from 'lucide-react';

interface LoginProps {
  signInWithGoogle: () => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string) => Promise<any>;
  continueAsGuest: () => void;
  darkMode: boolean;
}

export default function Login({
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  continueAsGuest,
  darkMode
}: LoginProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfigTips, setShowConfigTips] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setSuccess('Account created successfully! Logging you in...');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Authentication failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already in use.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Email/Password auth is not enabled yet in your Firebase console. Please use Google Login or continue as Guest.';
        setShowConfigTips(true);
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Google login failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'Login popup was closed before completion.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Google auth provider is not enabled in Firebase. Please continue as Guest or enable it.';
        setShowConfigTips(true);
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300"
      style={{
        backgroundColor: darkMode ? '#09090B' : '#F4F4F5',
        color: darkMode ? '#E4E4E7' : '#18181B'
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {/* APP ICON & TITLE */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#1a73e8] dark:bg-[#4285f4] flex items-center justify-center text-white shadow-xl mb-4 relative group">
            <CheckSquare className="w-8 h-8 stroke-[2.5]" />
            <span className="absolute -inset-0.5 rounded-2xl bg-[#4285f4] opacity-30 blur-sm group-hover:opacity-50 transition-all"></span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-sans">
            Pulse Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs text-neutral-500 dark:text-neutral-400">
            Sleek personal organizer synchronized securely across all your devices
          </p>
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full rounded-2xl border p-6 sm:p-8 shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: darkMode ? '#18181B' : '#FFFFFF',
            borderColor: darkMode ? '#27272A' : '#E4E4E7'
          }}
        >
          {/* Subtle neon gradient top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>

          {/* TAB SWITCHER */}
          <div className="flex border-b mb-6" style={{ borderColor: darkMode ? '#27272A' : '#E4E4E7' }}>
            <button
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 pb-3 text-sm font-medium transition-all relative ${
                !isSignUp 
                  ? 'text-blue-500 dark:text-blue-400' 
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Sign In
              {!isSignUp && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 pb-3 text-sm font-medium transition-all relative ${
                isSignUp 
                  ? 'text-blue-500 dark:text-blue-400' 
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Create Account
              {isSignUp && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: isSignUp ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -10 : 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* FEEDBACK NOTIFICATION */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs flex gap-2.5 items-start">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{error}</span>
                    {showConfigTips && (
                      <div className="mt-2 text-[10px] text-red-400 leading-relaxed font-sans">
                        To use Email/Password: Open your Firebase Console &gt; Authentication &gt; Sign-in method &gt; Add new provider &gt; Enable <strong>Email/Password</strong>.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex gap-2.5 items-start">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* FORM FIELDS */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 dark:text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-all"
                      style={{
                        backgroundColor: darkMode ? '#09090B' : '#F4F4F5',
                        borderColor: darkMode ? '#27272A' : '#E4E4E7'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 dark:text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-all"
                      style={{
                        backgroundColor: darkMode ? '#09090B' : '#F4F4F5',
                        borderColor: darkMode ? '#27272A' : '#E4E4E7'
                      }}
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 dark:text-neutral-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-all"
                        style={{
                          backgroundColor: darkMode ? '#09090B' : '#F4F4F5',
                          borderColor: darkMode ? '#27272A' : '#E4E4E7'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a73e8] hover:bg-blue-600 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register Account
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In with Email
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* DIVIDER */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: darkMode ? '#27272A' : '#E4E4E7' }}></div>
            </div>
            <span 
              className="relative px-3 text-xs font-medium uppercase tracking-widest text-neutral-500 bg-white dark:bg-[#18181B]"
            >
              Or
            </span>
          </div>

          {/* SOCIAL SIGN IN */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full border hover:bg-neutral-100/5 dark:hover:bg-neutral-800/50 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-3 cursor-pointer"
              style={{
                borderColor: darkMode ? '#27272A' : '#E4E4E7'
              }}
            >
              <Chrome className="w-4 h-4 text-red-500" />
              <span>Login with Google Account</span>
            </button>

            <button
              onClick={continueAsGuest}
              className="w-full border hover:bg-neutral-100/5 dark:hover:bg-neutral-800/50 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-3 cursor-pointer text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Continue offline as Guest</span>
            </button>
          </div>

          {/* TOGGLE CONFIGURATIONS HELP INFO */}
          <div className="mt-6 pt-4 border-t flex flex-col items-center" style={{ borderColor: darkMode ? '#27272A' : '#E4E4E7' }}>
            <button
              onClick={() => setShowConfigTips(!showConfigTips)}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Authentication configuration info</span>
            </button>
            
            <AnimatePresence>
              {showConfigTips && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3 text-[11px] text-neutral-400 leading-relaxed font-sans text-center max-w-xs space-y-2.5"
                >
                  <p>
                    <strong>Google Login:</strong> Enabled by default for all provisioned AI Studio projects.
                  </p>
                  <p>
                    <strong>Email/Password Login:</strong> Requires enabling the provider inside your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Firebase Console</a> under authentication settings.
                  </p>
                  <p>
                    <strong>Guest Mode:</strong> Employs high-speed Local Storage fallback to enable full app capabilities without any cloud configuration.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
