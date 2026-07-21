import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Settings as SettingsIcon, User, Moon, ShieldAlert, Cpu, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Latency & Health states
  const [backendHealth, setBackendHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkServicesHealth = async () => {
    setCheckingHealth(true);
    setBackendHealth(null);
    try {
      const start = Date.now();
      const res = await api.get('/health');
      const latency = Date.now() - start;
      
      if (res.status === 200) {
        setBackendHealth({
          status: 'Operational',
          latency: `${latency}ms`,
          version: res.data.version || '1.0.0',
          healthy: true
        });
      }
    } catch (err) {
      console.error(err);
      setBackendHealth({
        status: 'Offline',
        latency: 'N/A',
        healthy: false
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkServicesHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">Profile & Settings</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-medium">
          Manage your credentials, theme options, and review service health status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Profile Card & Appearance (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* User profile detail card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center">
              <User className="w-4.5 h-4.5 mr-2 text-indigo-500" />
              <span>User Profile Details</span>
            </h3>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-full text-white font-bold flex items-center justify-center text-lg uppercase">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div>
                <h4 className="font-bold text-base text-zinc-905 dark:text-zinc-100">{user?.name}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-450">{user?.role} Account</p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Registered Email</span>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full mt-1.5 px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Role Permissions</span>
                <input
                  type="text"
                  disabled
                  value={user?.role === 'Admin' ? 'Administrator permissions (Full CRUD)' : 'Recruiter permissions (Jobs/Applicants evaluation)'}
                  className="w-full mt-1.5 px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Theme switcher card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center mb-4">
              <Moon className="w-4.5 h-4.5 mr-2 text-indigo-500" />
              <span>Appearance Customization</span>
            </h3>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Toggle Dark Mode</h4>
                <p className="text-xs text-zinc-500 mt-0.5">Toggle interface colors between light and dark themes</p>
              </div>
              <button
                onClick={() => {
                  toggleTheme();
                  toast.success(`Theme switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
                }}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {theme === 'dark' ? 'Enable Light Mode' : 'Enable Dark Mode'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: API Service Health (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center">
              <Heart className="w-4.5 h-4.5 mr-2 text-indigo-500" />
              <span>Service Health Monitor</span>
            </h3>

            <p className="text-xs text-zinc-550 dark:text-zinc-400">
              Run check-ups on underlying Rest endpoints and FastAPI microservices.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Express Node Backend</h4>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">REST API gatekeeper</p>
                </div>
                {backendHealth?.healthy ? (
                  <span className="flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-55/20 px-2.5 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{backendHealth.latency}</span>
                  </span>
                ) : backendHealth ? (
                  <span className="flex items-center space-x-1 text-xs text-red-650 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded-full font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Offline</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">Checking...</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">FastAPI LangChain Service</h4>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">Gemini vector processing</p>
                </div>
                {backendHealth?.healthy ? (
                  <span className="flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-55/20 px-2.5 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </span>
                ) : backendHealth ? (
                  <span className="flex items-center space-x-1 text-xs text-red-655 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded-full font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Not Connected</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">Checking...</span>
                )}
              </div>
            </div>

            <button
              onClick={checkServicesHealth}
              disabled={checkingHealth}
              className="w-full py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {checkingHealth ? 'Testing latency...' : 'Check Status'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
