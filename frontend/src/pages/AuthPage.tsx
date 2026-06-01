import { FormEvent, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      if (mode === 'login') {
        await login(String(form.get('email')), String(form.get('password')));
      } else {
        await register({
          name: String(form.get('name')),
          email: String(form.get('email')),
          password: String(form.get('password')),
          brandName: String(form.get('brandName')),
          category: String(form.get('category')),
          city: String(form.get('city'))
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <nav className="mini-nav">
          <div className="brand-mark">
            <span>STAR</span>
            <strong>VNT</strong>
          </div>
          <small>EST. 2026</small>
        </nav>
        <div className="hero-copy">
          <span className="eyebrow">Vendor Booking Dashboard</span>
          <h1>
            Cinematic vendor operations for India&apos;s AI event ecosystem.
          </h1>
          <p>
            Manage Aura+ event leads, profile readiness, proposals, and booking analytics for weddings,
            corporate MICE, music, styling, gifting, and luxury venues.
          </p>
        </div>
        <div className="launch-card">
          <Sparkles />
          <div>
            <strong>Demo vendor access</strong>
            <span>vendor@starvnt.com / Starvnt@2026</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register vendor
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-stack">
          {mode === 'register' && (
            <>
              <label>
                Owner name
                <input name="name" placeholder="Aarav Mehta" required />
              </label>
              <label>
                Vendor brand
                <input name="brandName" placeholder="CineMandap Studios" required />
              </label>
              <div className="form-grid">
                <label>
                  Category
                  <select name="category" defaultValue="CINEMATIC_PRODUCTION">
                    <option value="CINEMATIC_PRODUCTION">Cinematic Production</option>
                    <option value="VENUE">Venue</option>
                    <option value="LUXURY_GIFTING">Moniqui Gifting</option>
                    <option value="FASHION_STYLING">FTAura Styling</option>
                    <option value="MUSIC_ENTERTAINMENT">Music</option>
                    <option value="CORPORATE_MICE">Corporate MICE</option>
                  </select>
                </label>
                <label>
                  City
                  <input name="city" placeholder="Kolkata" required />
                </label>
              </div>
            </>
          )}

          <label>
            Email
            <input name="email" type="email" defaultValue={mode === 'login' ? 'vendor@starvnt.com' : ''} required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              defaultValue={mode === 'login' ? 'Starvnt@2026' : ''}
              minLength={8}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="gold-button" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Enter Dashboard' : 'Continue to Profile Setup'}
          </button>
        </form>
      </section>
    </main>
  );
}
