import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const AuthPages: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  
  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // UI Status
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    setErrorMsg(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register Call
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const data = await apiClient('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, confirmPassword })
        });
        
        login(data.token, data.user);
      } else {
        // Login Call
        const data = await apiClient('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        
        login(data.token, data.user);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      {/* Brand Header */}
      <div className="flex items-center space-x-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-outfit font-extrabold text-2xl">H</span>
        </div>
        <span className="font-outfit font-extrabold text-3xl tracking-tight text-secondary-dark">
          HireLens<span className="text-primary">AI</span>
        </span>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl p-8 transition-all duration-300">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-secondary-dark font-outfit tracking-tight">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-secondary-light mt-1.5 leading-relaxed">
            {isRegister 
              ? 'Get started on optimizing your career tools' 
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-error/10 border border-error/20 text-xs font-semibold text-error leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary-light tracking-wide block">FULL NAME</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary-light tracking-wide block">EMAIL ADDRESS</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary-light tracking-wide block">PASSWORD</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary-light tracking-wide block">CONFIRM PASSWORD</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all duration-200"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-sm shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/15 flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-6"
          >
            <span>{loading ? 'Processing session...' : (isRegister ? 'Register Account' : 'Sign In')}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <span className="relative bg-white px-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">OR</span>
        </div>

        <button
          onClick={toggleAuthMode}
          className="w-full py-2 rounded-lg text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 transition-all duration-200 cursor-pointer"
        >
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register Now'}
        </button>
      </div>

      {/* Trust badging footer */}
      <div className="mt-8 flex items-center space-x-2 text-xs text-slate-400 font-medium">
        <ShieldCheck className="w-4 h-4" />
        <span>SSL Secured & JWT Authentication Authorized</span>
      </div>
    </div>
  );
};
export default AuthPages;
