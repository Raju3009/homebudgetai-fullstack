import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity, Bell, ChevronRight, CreditCard, FileText, LayoutDashboard, LogOut,
  Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Settings, Sun, Target,
  UserRound, WalletCards, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accountApi } from '../api/account';
import { initials } from '../utils/format';

const navigationGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard }] },
  { label: 'Money management', items: [
    { label: 'Transactions', path: '/app/transactions', icon: CreditCard },
    { label: 'Expenses', path: '/app/expenses', icon: WalletCards },
    { label: 'Budgets & goals', path: '/app/budgets', icon: Target },
  ] },
  { label: 'Insights', items: [
    { label: 'Reports', path: '/app/reports', icon: FileText },
    { label: 'Activity', path: '/app/activity', icon: Activity },
  ] },
  { label: 'Account', items: [
    { label: 'Profile', path: '/app/profile', icon: UserRound },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ] },
];

const mobileNavigation = [
  { label: 'Home', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', path: '/app/transactions', icon: CreditCard },
  { label: 'Budgets', path: '/app/budgets', icon: Target },
  { label: 'Reports', path: '/app/reports', icon: FileText },
];



function initialDarkMode() {
  const savedTheme = window.localStorage.getItem('homebudgetai.theme');
  return savedTheme ? savedTheme === 'dark' : Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('homebudgetai.sidebar') === 'collapsed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(initialDarkMode);
  const [currency, setCurrency] = useState(() => window.localStorage.getItem('homebudgetai.currency') || 'USD');
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onThemeChange = (event) => {
      if (typeof event.detail?.dark === 'boolean') setDark(event.detail.dark);
    };
    window.addEventListener('homebudgetai-theme', onThemeChange);
    return () => window.removeEventListener('homebudgetai-theme', onThemeChange);
  }, []);

  useEffect(() => {
    let active = true;
    accountApi.settings().then(({ data }) => {
      if (!active) return;
      const selectedCurrency = data.currency || 'USD';
      setCurrency(selectedCurrency);
      window.localStorage.setItem('homebudgetai.currency', selectedCurrency);
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const selectedTheme = data.theme || 'system';
      setDark(selectedTheme === 'dark' || (selectedTheme === 'system' && Boolean(prefersDark)));
      window.localStorage.setItem('homebudgetai.theme', selectedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : selectedTheme);
    }).catch(() => {
      // Preferences remain editable on the Settings page if the API is unavailable.
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem('homebudgetai.sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      window.localStorage.setItem('homebudgetai.theme', next ? 'dark' : 'light');
      window.dispatchEvent(new CustomEvent('homebudgetai-theme', { detail: { dark: next } }));
      return next;
    });
  }

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? '/app/transactions?q=' + encodeURIComponent(query) : '/app/transactions');
  }

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={'app-shell' + (collapsed ? ' collapsed' : '') + (dark ? ' dark-mode' : '')} data-theme={dark ? 'dark' : 'light'} data-currency={currency}>
      <button className={'sidebar-backdrop' + (mobileMenuOpen ? ' is-visible' : '')} type="button" aria-label="Close navigation menu" tabIndex={mobileMenuOpen ? 0 : -1} onClick={() => setMobileMenuOpen(false)} />
      <aside id="workspace-sidebar" className={'sidebar' + (mobileMenuOpen ? ' mobile-open' : '')} aria-label="Workspace navigation">
        <Link className="brand" to="/app/dashboard" aria-label="HomeBudgetAI dashboard" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><WalletCards size={20} /></span>
          <span className="hide-when-collapsed"><strong>HomeBudgetAI</strong><small>Personal finance</small></span>
        </Link>

        <button className="sidebar-action collapse-action" type="button" onClick={toggleCollapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span className="hide-when-collapsed">Collapse menu</span>
        </button>

        <button className="mobile-menu-close" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>

        <nav className="sidebar-navigation" aria-label="Primary navigation">
          {navigationGroups.map((group) => (
            <div className="navigation-group" key={group.label}>
              <p className="navigation-label hide-when-collapsed">{group.label}</p>
              {group.items.map(({ label, path, icon: Icon }) => (
                <NavLink key={path} to={path} end={path === '/app/dashboard'} title={collapsed ? label : undefined} onClick={() => setMobileMenuOpen(false)}>
                  <Icon size={18} aria-hidden="true" /><span className="hide-when-collapsed">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <section className="sidebar-note hide-when-collapsed">
          <span className="sidebar-note-icon"><Activity size={16} /></span>
          <strong>Stay in control</strong>
          <p>Review your latest activity and spending trends.</p>
          <Link to="/app/reports" onClick={() => setMobileMenuOpen(false)}>View reports <ChevronRight size={15} /></Link>
        </section>

        <div className="sidebar-footer">
          <button className="sidebar-action theme-action" type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}<span className="hide-when-collapsed">{dark ? 'Light appearance' : 'Dark appearance'}</span>
          </button>
          <Link className="sidebar-user" to="/app/profile" aria-label={'Profile for ' + (user?.fullName || 'your account')}>
            <div className="avatar">{initials(user?.fullName)}</div>
            <div className="hide-when-collapsed"><strong>{user?.fullName || 'Account'}</strong><small>{user?.role || 'User'} account</small></div>
            <ChevronRight className="user-chevron hide-when-collapsed" size={16} />
          </Link>
        </div>
      </aside>

      <main className="shell-main">
        <header className="topbar">
          <div className="topbar-heading"><span className="topbar-brand-mark"><WalletCards size={18} /></span><span><small>HomeBudgetAI</small><strong>Personal workspace</strong></span></div>
          <form className="search-box" role="search" onSubmit={submitSearch}>
            <Search size={18} aria-hidden="true" />
            <input aria-label="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions…" />
            <button type="submit" className="search-submit" aria-label="Submit transaction search"><span>Search</span><kbd>↵</kbd></button>
          </form>
          <div className="top-actions">
            <Link className="icon-button notification-action" to="/app/activity" aria-label="Notifications"><Bell size={18} /></Link>
            <Link className="profile-action" to="/app/profile"><span className="avatar">{initials(user?.fullName)}</span><span className="profile-copy"><strong>{user?.fullName || 'Account'}</strong><small>Personal account</small></span></Link>
            <button className="icon-button signout-action" type="button" onClick={signOut} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
          </div>
        </header>

        <div className="content-area"><Outlet /></div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavigation.map(({ label, path, icon: Icon }) => <NavLink key={label} to={path} end={path === '/app/dashboard'} aria-label={label}><Icon size={19} /><span>{label}</span></NavLink>)}
        <button className={mobileMenuOpen ? 'active' : ''} type="button" aria-controls="workspace-sidebar" aria-label="More navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((current) => !current)}>{mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}<span>More</span></button>
      </nav>
    </div>
  );
}
