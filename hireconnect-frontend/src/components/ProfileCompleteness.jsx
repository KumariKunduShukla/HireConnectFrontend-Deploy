import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { calculateProfileCompleteness } from '../utils/profileUtils';
import { 
  Trophy, 
  ChevronRight, 
  PlusCircle, 
  Target, 
  Zap, 
  ArrowRight 
} from 'lucide-react';

export default function ProfileCompleteness({ profile, role }) {
  const { percentage, missingItems } = useMemo(
    () => calculateProfileCompleteness(profile, role),
    [profile, role]
  );

  const getStrengthText = (pct) => {
    if (pct === 100) return 'Professional Excellence';
    if (pct >= 80) return 'Almost Complete';
    if (pct >= 50) return 'Strong Progress';
    return 'Action Required';
  };

  const getStrengthColor = (pct) => {
    if (pct === 100) return 'text-emerald-500';
    if (pct >= 80) return 'text-blue-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (percentage === 100) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-700 rounded-[32px] p-6 text-white shadow-xl shadow-slate-200/50 dark:shadow-blue-600/20 animate-in fade-in duration-700">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Profile Perfected!</h3>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Global Ranking Ready</p>
          </div>
        </div>
        <p className="text-sm text-white/80 font-medium leading-relaxed mb-6">
          Your professional identity is fully optimized. Recruiters are now seeing your best self.
        </p>
        <Link to="/profile" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 group">
          <span className="text-xs font-bold">View Public Profile</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm animate-in fade-in duration-700">
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Profile Strength</h3>
          <p className={`text-xs font-bold uppercase tracking-widest ${getStrengthColor(percentage)}`}>
            {getStrengthText(percentage)}
          </p>
        </div>
        <div className="relative flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="32"
              cy="32"
            />
            <circle
              className="text-blue-600 transition-all duration-1000 ease-out"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - percentage / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="32"
              cy="32"
            />
          </svg>
          <span className="absolute text-sm font-extrabold text-slate-900 dark:text-white">{percentage}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <Target className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Next Steps</span>
        </div>
        
        <div className="space-y-2">
          {missingItems.slice(0, 3).map((item, idx) => (
            <Link 
              key={idx} 
              to="/profile" 
              className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-2xl transition-all border border-slate-100 dark:border-slate-800 group"
            >
              <div className="flex items-center space-x-3">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Add {item}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
          {missingItems.length > 3 && (
            <Link to="/profile" className="block text-center pt-2 text-xs font-bold text-blue-600 hover:underline">
              +{missingItems.length - 3} more optimizations
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 text-slate-400">
          <Zap className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] font-medium leading-relaxed">
            Profiles with 100% strength are <span className="font-bold text-slate-600 dark:text-slate-300">4x more likely</span> to be contacted by recruiters.
          </p>
        </div>
      </div>
    </div>
  );
}
