import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UploadCloud,
  Percent,
  Award,
  HelpCircle,
  BarChart3,
  Settings,
  LogOut,
  X,
  User,
  FileText,
  Calendar,
  Bell,
  Building
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const seekerNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Profile & Resume', href: '/profile', icon: User },
    { name: 'Find Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Applied Jobs', href: '/applications', icon: FileText },
    { name: 'Interview Schedule', href: '/interviews', icon: Calendar },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const recruiterNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Company Profile', href: '/company-profile', icon: Building },
    { name: 'Jobs Management', href: '/jobs', icon: Briefcase },
    { name: 'Applicants', href: '/candidates', icon: Users },
    { name: 'AI Matching', href: '/ai-matching', icon: Percent },
    { name: 'Candidate Rankings', href: '/rankings', icon: Award },
    { name: 'Interview Generator', href: '/interview', icon: VideoIcon },
    { name: 'Scheduled Interviews', href: '/interviews', icon: Calendar },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const navigation = user?.role === 'Job Seeker' ? seekerNavigation : recruiterNavigation;

  function VideoIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
      </svg>
    );
  }

  const activeClassName =
    'flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-sm font-medium transition-colors';
  const inactiveClassName =
    'flex items-center space-x-3 px-4 py-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-sm font-medium transition-colors';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
      {/* Brand Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            R
          </div>
          <span className="font-semibold text-base tracking-tight text-zinc-950 dark:text-zinc-50">
            Recruit<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={toggleSidebar ? () => toggleSidebar() : undefined}
            className={({ isActive }) => (isActive ? activeClassName : inactiveClassName)}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile footer */}
      {user && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm shrink-0 uppercase">
              {user.name ? user.name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">{user.name}</h4>
              <p className="text-[10px] text-zinc-500 truncate dark:text-zinc-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed inset-y-0 left-0 z-20 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay backdrop */}
          <div
            onClick={toggleSidebar}
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-xs transition-opacity"
          />
          {/* Drawer container */}
          <div className="relative w-64 max-w-xs flex flex-col h-full bg-white dark:bg-zinc-950 z-10 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
