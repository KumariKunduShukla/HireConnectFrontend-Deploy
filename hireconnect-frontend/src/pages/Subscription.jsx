import React, { useState, useEffect, useMemo } from 'react';
import { subscriptionAPI, profileAPI, analyticsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorMessage';
import { 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  Download, 
  Clock, 
  FileText,
  TrendingUp,
  Briefcase,
  Users,
  Video,
  PartyPopper,
  X,
  RefreshCcw,
  Star
} from 'lucide-react';

const FALLBACK_FEATURES = {
  FREE: ['Basic job browsing', 'Platform exploration', 'Standard application tracking'],
  PROFESSIONAL: ['Up to 10 active job posts', 'Advanced applicant tracking', 'Direct email notifications', 'Priority support'],
  ENTERPRISE: ['Unlimited job postings', 'Premium scale hiring tools', 'Dedicated account manager', 'Platform-wide analytics', 'Custom branding'],
};

export default function Subscription() {
  const { user, updateUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  const recruiterIdRaw = user?.profileId ?? user?.userId ?? user?.id;
  const recruiterId = recruiterIdRaw ? Number(recruiterIdRaw) : null;

  const displayPlans = useMemo(() => {
    const list = Array.isArray(catalog) && catalog.length ? catalog : [];
    return list.map((p) => ({
      ...p,
      features: FALLBACK_FEATURES[p.code] || [p.summary || 'Premium Access'],
    }));
  }, [catalog]);

  useEffect(() => {
    if (!user?.email || user?.profileId != null) return;
    profileAPI.getProfileByEmail(user.email)
      .then((res) => {
        if (!res?.data) return;
        const found = res.data;
        const pid = found.profileId ?? found.id;
        if (pid == null) return;
        updateUser({ ...user, ...found, profileId: Number(pid) });
      })
      .catch(() => {});
  }, [user?.email, user?.profileId, updateUser]);

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then((r) => setCatalog(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => {
    if (recruiterId == null) return;
    subscriptionAPI.getByRecruiter(recruiterId)
      .then((r) => setSubscriptions(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    subscriptionAPI.getInvoicesByRecruiter(recruiterId)
      .then((r) => setInvoices(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, [recruiterId]);

  const refreshLists = async () => {
    if (recruiterId == null) return;
    const [subsRes, invRes] = await Promise.all([
      subscriptionAPI.getByRecruiter(recruiterId),
      subscriptionAPI.getInvoicesByRecruiter(recruiterId),
    ]);
    setSubscriptions(Array.isArray(subsRes.data) ? subsRes.data : []);
    setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
  };

  const handleSubscribe = async (plan) => {
    if (recruiterId == null || recruiterId <= 0) {
      toast.error('Missing recruiter id — please sign in again.');
      return;
    }
    setLoading(true);
    try {
      const orderRes = await subscriptionAPI.createOrder({
        recruiterId,
        plan: plan.code,
        billingEmail: user?.email,
      });
      const data = orderRes.data;

      if (plan.code === 'FREE' || !data?.orderId) {
        toast.success(data?.message || 'Free plan activated.');
        await refreshLists();
        return;
      }

      const { orderId, amount, keyId } = data;
      const options = {
        key: keyId,
        amount: Number(amount),
        currency: 'INR',
        name: 'HireConnect',
        description: `${plan.displayName || plan.code} Plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await subscriptionAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              billingEmail: user?.email,
            });
            toast.success(`${plan.displayName || plan.code} activated!`);
            await refreshLists();
          } catch {
            toast.error('Verification failed');
          }
        },
        prefill: { email: user?.email },
        theme: { color: '#2563eb' },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Razorpay not loaded');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create order'));
    } finally {
      setLoading(false);
    }
  };

  const handleMockSubscribe = async (plan) => {
    if (recruiterId == null || recruiterId <= 0) return;
    setLoading(true);
    try {
      const orderRes = await subscriptionAPI.createOrder({
        recruiterId,
        plan: plan.code,
        billingEmail: user?.email,
      });
      const data = orderRes.data;
      if (data?.orderId) {
        await subscriptionAPI.verifyPayment({
          razorpayOrderId: data.orderId,
          razorpayPaymentId: "MOCK_PAYMENT_ID",
          razorpaySignature: "MOCK_SIGNATURE",
          billingEmail: user?.email,
        });
        toast.success(`Mock successful. ${plan.displayName || plan.code} activated.`);
        await refreshLists();
      }
    } catch (err) {
      toast.error('Mock failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePdf = async (invoiceId) => {
    try {
      const res = await subscriptionAPI.downloadInvoicePdf(invoiceId, recruiterId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hireconnect-invoice-${invoiceId}.pdf`;
      a.click();
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleInvoiceClick = async (invoice) => {
    setSelectedInvoice(invoice);
    setAnalyticsLoading(true);
    try {
      const res = await analyticsAPI.getRecruiterStats(recruiterId);
      setAnalytics(res.data);
    } catch {
      toast.error('Analytics unavailable');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (catalogLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading pricing plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Supercharge your <span className="text-blue-600">Hiring</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
          Choose the plan that fits your company size. Every plan includes world-class support and seamless applicant management.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayPlans.map((plan) => (
          <div 
            key={plan.code} 
            className={`group relative bg-white dark:bg-slate-900 border rounded-[40px] p-8 sm:p-10 shadow-sm hover:shadow-2xl transition-all duration-500 ${
              plan.code === 'PROFESSIONAL' 
                ? 'border-blue-600 dark:border-blue-500 ring-4 ring-blue-500/10' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {plan.code === 'PROFESSIONAL' && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/30">
                Most Popular
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.displayName || plan.code}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{plan.summary || 'Scale your hiring pipeline effortlessly.'}</p>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{Number(plan.amountInr || 0).toLocaleString()}</span>
                <span className="text-slate-400 font-bold text-sm">/{plan.billingPeriod || 'year'}</span>
              </div>

              <div className="space-y-4 py-6 border-t border-slate-100 dark:border-slate-800">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start space-x-3 group-hover:translate-x-1 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{f}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading}
                  className={`w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 ${
                    plan.code === 'PROFESSIONAL' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20' 
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  }`}
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Get Started</span>}
                </button>
                {plan.code !== 'FREE' && (
                  <button
                    onClick={() => handleMockSubscribe(plan)}
                    className="w-full py-3 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    Simulate Test Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12">
        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" /> Active Subscriptions
            </h2>
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.subscriptionId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{sub.plan}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {sub.status === 'ACTIVE' && sub.plan !== 'FREE' && (
                      <button onClick={() => subscriptionAPI.renew(sub.subscriptionId)} className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold rounded-xl text-xs hover:bg-blue-100 transition-all">Renew</button>
                    )}
                    <button onClick={() => subscriptionAPI.cancel(sub.subscriptionId)} className="flex-1 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-100 transition-all">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices */}
        <div className={`${subscriptions.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Billing History
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-6 pt-8 pl-8">Invoice</th>
                    <th className="pb-6 pt-8">Plan</th>
                    <th className="pb-6 pt-8">Amount</th>
                    <th className="pb-6 pt-8">Status</th>
                    <th className="pb-6 pt-8 text-right pr-8">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No billing history found.</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.invoiceId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => handleInvoiceClick(inv)}>
                      <td className="py-6 pl-8">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">#{inv.invoiceId}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(inv.paymentDate).toLocaleDateString()}</p>
                      </td>
                      <td className="py-6">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{inv.planName}</span>
                      </td>
                      <td className="py-6">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">₹{Number(inv.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="py-6">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-6 text-right pr-8">
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoicePdf(inv.invoiceId); }} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-xl transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedInvoice(null)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" /> Invoice Summary
              </h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing ID</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">#{selectedInvoice.invoiceId}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
                  <p className="text-2xl font-extrabold text-blue-600">₹{Number(selectedInvoice.amount || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Analytics Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Performance Snapshot
                </h3>
                {analyticsLoading ? (
                  <div className="h-40 bg-slate-50 dark:bg-slate-800/50 rounded-3xl animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">LOADING ANALYTICS...</div>
                ) : analytics ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Jobs Posted', value: analytics.totalJobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Applicants', value: analytics.totalApplications, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                      { label: 'Interviews', value: analytics.interviewsScheduledCount, icon: Video, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                      { label: 'Successful Offers', value: analytics.offeredCount, icon: PartyPopper, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    ].map(metric => (
                      <div key={metric.label} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${metric.bg} ${metric.color}`}>
                          <metric.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{metric.value}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl text-slate-400 font-bold italic text-sm">Analytics not yet synchronized for this billing cycle.</div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => handleDownloadInvoicePdf(selectedInvoice.invoiceId)} className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Download Detailed PDF</span>
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl transition-all">Close Details</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
