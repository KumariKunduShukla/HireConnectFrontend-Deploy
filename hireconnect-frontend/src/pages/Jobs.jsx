import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter, 
  RefreshCcw, 
  ChevronRight, 
  Building2, 
  DollarSign, 
  Clock, 
  Code,
  LayoutGrid,
  List,
  ArrowLeft
} from 'lucide-react';

const CATEGORIES = ['Engineering', 'Design', 'Marketing', 'Finance', 'Sales', 'Product', 'Operations', 'Data Science'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();

  const [filters, setFilters] = useState({
    title: searchParams.get('title') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    minSalary: 0,
    maxSalary: 0,
  });

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobAPI.getAllJobs();
      setJobs(res.data);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (filters.title || filters.category || filters.minSalary || filters.maxSalary) {
        const res = await jobAPI.searchJobs(filters.title, filters.category, filters.minSalary, filters.maxSalary);
        setJobs(res.data);
      } else if (filters.location) {
        const res = await jobAPI.getJobsByLocation(filters.location);
        setJobs(res.data);
      } else {
        fetchJobs();
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => s === 'OPEN' ? 'emerald' : 'red';
  const typeColor = (t) => ({ 
    'Remote': 'blue', 
    'Full-time': 'violet', 
    'Part-time': 'amber', 
    'Contract': 'slate', 
    'Internship': 'rose' 
  }[t] || 'slate');

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      {/* Search Header Section */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 overflow-hidden">
            <div className="space-y-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">Browse Opportunities</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium truncate">
                Showing {loading ? '...' : jobs.length} active roles across the network
              </p>
            </div>
            {isLoggedIn && (
              <Link to="/dashboard" className="flex items-center space-x-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Premium Search Bar */}
          {/* Premium Search Bar */}
          <form onSubmit={handleSearch} className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm max-w-full overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Job title, keyword…"
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium dark:text-white"
                />
              </div>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Location…"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium dark:text-white"
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 min-w-fit mt-2 lg:mt-0">
              <button type="submit" className="flex-1 lg:px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 py-3.5 min-w-[120px]">
                <span>Search</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setFilters({ title: '', category: '', location: '', minSalary: 0, maxSalary: 0 }); fetchJobs(); }}
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl transition-all"
                title="Reset Filters"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                  <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="h-16 w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                  <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 max-w-md mx-auto">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[40px] flex items-center justify-center text-slate-400 mb-4">
              <Search className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No matches found</h3>
              <p className="text-slate-500 font-medium">Try adjusting your keywords or filters to find what you're looking for.</p>
            </div>
            <button 
              onClick={fetchJobs}
              className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg transition-all"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Job Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobs.map(job => (
              <Link 
                key={job.jobId} 
                to={`/jobs/${job.jobId}`} 
                className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-600/20">
                    {(job.title?.[0] || 'J').toUpperCase()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                    statusColor(job.status) === 'emerald' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor(job.status) === 'emerald' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span>{job.status}</span>
                  </span>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                      {job.title}
                    </h3>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-semibold">
                      <Building2 className="w-4 h-4 mr-1.5" />
                      <span className="truncate">{job.company || 'Unknown Company'}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    <span>{job.location || 'Remote'}</span>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                    {job.description}
                  </p>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-50 dark:border-slate-800 mt-auto">
                  <div className="flex flex-wrap gap-2">
                    {job.type && (
                      <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider ${
                        typeColor(job.type) === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        typeColor(job.type) === 'violet' ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                        typeColor(job.type) === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                      }`}>
                        {job.type}
                      </span>
                    )}
                    {job.category && (
                      <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                        {job.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {(job.salaryMin || job.salaryMax) ? (
                      <div className="flex items-center text-slate-900 dark:text-white font-bold">
                        <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                        <span className="text-lg tracking-tight">
                          ₹{(job.salaryMin / 1000).toFixed(0)}K – ₹{(job.salaryMax / 1000).toFixed(0)}K
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Competitive Pay</span>
                    )}
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {job.skills?.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 rounded-md border border-slate-100 dark:border-slate-800">
                        {s}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 rounded-md">
                        +{job.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
