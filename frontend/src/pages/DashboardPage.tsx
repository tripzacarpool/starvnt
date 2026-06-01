import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Crown,
  IndianRupee,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { PriorityPill, StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { api, categoryLabels } from '../lib/api';
import type { Inquiry, InquiryStatus, VendorProfile } from '../lib/types';

const statuses: InquiryStatus[] = ['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'CONFIRMED', 'DECLINED'];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'overview' | 'inquiries' | 'profile'>('overview');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const analytics = useQuery({ queryKey: ['analytics'], queryFn: api.getAnalytics });
  const inquiries = useQuery({ queryKey: ['inquiries'], queryFn: api.getInquiries });
  const profile = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) => api.updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });

  const filteredInquiries = useMemo(() => {
    const list = inquiries.data?.inquiries ?? [];
    const needle = query.toLowerCase();
    const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return list
      .filter((item) =>
        [item.clientName, item.eventType, item.location, item.status].join(' ').toLowerCase().includes(needle)
      )
      .sort((left, right) => {
        const priorityDelta = priorityRank[left.priority] - priorityRank[right.priority];
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [inquiries.data, query]);

  const metrics = analytics.data?.metrics;
  const currentProfile = profile.data?.profile;
  const setupProgress = currentProfile ? getProfileSetupProgress(currentProfile) : 100;
  const needsProfileSetup = setupProgress < 100;

  return (
    <main className="dashboard-shell">
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-head">
          <div>
            <div className="brand-mark">
              <span>STAR</span>
              <strong>VNT</strong>
            </div>
            <small className="console-label">Vendor Console 2026</small>
          </div>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            ×
          </button>
        </div>
        <nav>
          <button
            className={activeView === 'overview' ? 'active' : ''}
            onClick={() => {
              setActiveView('overview');
              setMenuOpen(false);
            }}
          >
            <BarChart3 /> Overview
          </button>
          <button
            className={activeView === 'inquiries' ? 'active' : ''}
            onClick={() => {
              setActiveView('inquiries');
              setMenuOpen(false);
            }}
          >
            <MessageSquareText /> Inquiries
          </button>
          <button
            className={activeView === 'profile' ? 'active' : ''}
            onClick={() => {
              setActiveView('profile');
              setMenuOpen(false);
            }}
          >
            <ShieldCheck /> Vendor Profile
          </button>
        </nav>
        <div className="aura-card">
          <Sparkles />
          <strong>Aura+ Fit Score</strong>
          <span>94%</span>
          <p>Fast response, verified profile, and premium wedding inventory.</p>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">
            <Menu />
          </button>
          <div>
            <span className="eyebrow">Cinematic Operations</span>
            <h1>{profile.data?.profile.brandName ?? user?.vendor?.brandName}</h1>
          </div>
          <button className="ghost-button" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </header>

        {currentProfile && needsProfileSetup && (
          <ProfileSetupBanner progress={setupProgress} onOpen={() => setSetupOpen(true)} />
        )}

        {activeView === 'overview' && (
          <section className="view-stack">
            <div className="hero-dashboard">
              <div>
                <span className="eyebrow">Launching January 1st, 2026</span>
                <h2>Own every inquiry from Aura+ recommendation to confirmed celebration.</h2>
                <p>
                  Built for StarVNT partners handling cinematic weddings, MICE summits, concerts, styling,
                  luxury gifting, and premium venues.
                </p>
              </div>
              <div className="verified-box">
                <Crown />
                <strong>{categoryLabels[profile.data?.profile.category ?? 'CINEMATIC_PRODUCTION']}</strong>
                <span>{profile.data?.profile.city} partner</span>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard label="Pipeline" value={money(metrics?.totalPipeline)} hint="Open booking value" icon={IndianRupee} />
              <StatCard label="Inquiries" value={String(metrics?.totalInquiries ?? 0)} hint={`${metrics?.newInquiries ?? 0} new leads`} icon={MessageSquareText} />
              <StatCard label="Confirmed" value={String(metrics?.confirmedBookings ?? 0)} hint={`${metrics?.conversionRate ?? 0}% conversion`} icon={CheckCircle2} />
              <StatCard label="Response" value={`${metrics?.responseMinutes ?? 0}m`} hint={`${metrics?.rating ?? 0}/5 partner rating`} icon={Star} />
            </div>

            <div className="content-grid">
              <article className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Dashboard Analytics</span>
                    <h3>Monthly inquiry flow</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.data?.monthly ?? []}>
                    <CartesianGrid stroke="#263145" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      cursor={{ fill: 'rgba(234, 179, 8, 0.08)' }}
                      contentStyle={{ background: '#111827', border: '1px solid #334155', color: '#fff' }}
                    />
                    <Bar dataKey="pipeline" fill="#eab308" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Priority Leads</span>
                    <h3>Needs attention</h3>
                  </div>
                </div>
                <div className="lead-list">
                  {filteredInquiries.slice(0, 4).map((inquiry) => (
                    <InquiryRow key={inquiry.id} inquiry={inquiry} compact />
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {activeView === 'inquiries' && (
          <section className="view-stack">
            <div className="section-toolbar">
              <div>
                <span className="eyebrow">Event Inquiry Management</span>
                <h2>Booking pipeline</h2>
              </div>
              <label className="search-box">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, event, city..." />
              </label>
            </div>
            <div className="inquiry-grid">
              {filteredInquiries.map((inquiry) => (
                <article className="inquiry-card" key={inquiry.id}>
                  <InquiryRow inquiry={inquiry} />
                  <p>{inquiry.notes}</p>
                  <div className="card-actions">
                    <select
                      value={inquiry.status}
                      onChange={(event) =>
                        updateStatus.mutate({ id: inquiry.id, status: event.target.value as InquiryStatus })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <a href={`mailto:${inquiry.clientEmail}`}>Email client</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'profile' && currentProfile && <ProfileEditor profile={currentProfile} />}
      </section>

      {currentProfile && setupOpen && (
        <VendorSetupModal profile={currentProfile} onClose={() => setSetupOpen(false)} />
      )}
    </main>
  );
}

function InquiryRow({ inquiry, compact = false }: { inquiry: Inquiry; compact?: boolean }) {
  return (
    <div className={compact ? 'inquiry-row compact' : 'inquiry-row'}>
      <div className="date-badge">
        <CalendarDays size={17} />
        <span>{new Date(inquiry.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
      </div>
      <div>
        <strong>{inquiry.clientName}</strong>
        <span>
          {inquiry.eventType.replace('_', ' ')} · {inquiry.location} · {inquiry.guestCount} guests
        </span>
      </div>
      <div className="row-meta">
        <strong>{money(inquiry.budget)}</strong>
        <div>
          <StatusPill status={inquiry.status} />
          <PriorityPill priority={inquiry.priority} />
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ profile }: { profile: VendorProfile }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const mutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setMessage('Vendor profile updated for Aura+ recommendations.');
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      brandName: String(form.get('brandName')),
      category: String(form.get('category')) as VendorProfile['category'],
      city: String(form.get('city')),
      bio: String(form.get('bio')),
      phone: String(form.get('phone')),
      priceFrom: Number(form.get('priceFrom')),
      coverageRadius: Number(form.get('coverageRadius')),
      responseMinutes: Number(form.get('responseMinutes')),
      specialties: String(form.get('specialties'))
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    });
  }

  return (
    <section className="view-stack">
      <div className="section-toolbar">
        <div>
          <span className="eyebrow">Vendor Profile Management</span>
          <h2>Marketplace readiness</h2>
        </div>
        <div className="verified-inline">
          <ShieldCheck /> {profile.isVerified ? 'Verified Partner' : 'Pending Verification'}
        </div>
      </div>

      <form className="profile-form panel" onSubmit={onSubmit}>
        <label>
          Brand name
          <input name="brandName" defaultValue={profile.brandName} />
        </label>
        <label>
          Category
          <select name="category" defaultValue={profile.category}>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          City
          <input name="city" defaultValue={profile.city} />
        </label>
        <label>
          Phone
          <input name="phone" defaultValue={profile.phone} />
        </label>
        <label className="wide">
          Bio
          <textarea name="bio" defaultValue={profile.bio} rows={5} />
        </label>
        <label>
          Starting price
          <input name="priceFrom" type="number" defaultValue={profile.priceFrom} />
        </label>
        <label>
          Service radius
          <input name="coverageRadius" type="number" defaultValue={profile.coverageRadius} />
        </label>
        <label>
          Usual response time
          <input name="responseMinutes" type="number" defaultValue={profile.responseMinutes} />
        </label>
        <label className="wide">
          Specialties
          <input name="specialties" defaultValue={profile.specialties.join(', ')} />
        </label>
        {message && <p className="success-message">{message}</p>}
        <button className="gold-button">Save Profile</button>
      </form>
    </section>
  );
}

function ProfileSetupBanner({ progress, onOpen }: { progress: number; onOpen: () => void }) {
  return (
    <section className="setup-banner">
      <div>
        <span className="eyebrow">Profile Setup</span>
        <strong>Your vendor profile is {progress}% complete</strong>
        <p>Finish mobile, pricing, service radius, response time, specialties, and bio to improve Aura+ matching.</p>
      </div>
      <div className="setup-progress" aria-label={`Profile ${progress}% complete`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <button className="gold-button" onClick={onOpen}>Set Up Now</button>
    </section>
  );
}

function VendorSetupModal({ profile, onClose }: { profile: VendorProfile; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      brandName: String(form.get('brandName')),
      category: String(form.get('category')) as VendorProfile['category'],
      city: String(form.get('city')),
      phone: String(form.get('phone')),
      bio: String(form.get('bio')),
      priceFrom: Number(form.get('priceFrom')),
      coverageRadius: Number(form.get('coverageRadius')),
      responseMinutes: Number(form.get('responseMinutes')),
      specialties: String(form.get('specialties'))
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    });
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <section className="setup-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close profile setup">
          ×
        </button>
        <span className="eyebrow">Vendor Onboarding</span>
        <h2 id="setup-title">Complete your StarVNT partner profile</h2>
        <p>
          We only created your account during registration. Add these details once so Aura+ can match you
          with the right event inquiries. Usual response time is the vendor's promised reply window.
        </p>

        <form className="setup-form" onSubmit={onSubmit}>
          <label>
            Vendor brand
            <input name="brandName" defaultValue={profile.brandName} required />
          </label>
          <label>
            Category
            <select name="category" defaultValue={profile.category}>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            City
            <input name="city" defaultValue={profile.city} required />
          </label>
          <label>
            Mobile number
            <input name="phone" placeholder="+91 90000 00000" required />
          </label>
          <label>
            Starting price
            <input name="priceFrom" type="number" min="0" placeholder="275000" required />
          </label>
          <label>
            Service radius
            <input name="coverageRadius" type="number" min="1" placeholder="120" required />
          </label>
          <label>
            Usual response time
            <input name="responseMinutes" type="number" min="5" placeholder="30" required />
          </label>
          <label className="wide">
            Specialties
            <input name="specialties" placeholder="Cinematic Weddings, Drone Films, Live Direction" required />
          </label>
          <label className="wide">
            Vendor bio
            <textarea
              name="bio"
              rows={4}
              placeholder="Tell StarVNT what kind of premium events you handle, your strengths, and your ideal booking."
              required
            />
          </label>
          {mutation.error && <p className="form-error">{mutation.error.message}</p>}
          <button className="gold-button" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Finish Setup & Open Dashboard'}
          </button>
        </form>
      </section>
    </div>
  );
}

function getProfileSetupProgress(profile: VendorProfile) {
  const checks = [
    Boolean(profile.brandName.trim()),
    Boolean(profile.category),
    Boolean(profile.city.trim()),
    Boolean(profile.phone.trim()),
    Boolean(profile.bio.trim()),
    profile.priceFrom > 0,
    profile.coverageRadius > 0,
    profile.responseMinutes > 0,
    profile.specialties.length > 0
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function money(value = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}
