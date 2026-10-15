import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Moon, PanelLeftClose,
  PanelLeftOpen, Search, Settings, Sun, Target, UserRound, WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accountApi } from '../api/account';
import { initials } from '../utils/format';

const navigation = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', path: '/app/transactions', icon: CreditCard },
  { label: 'Expenses', path: '/app/expenses', icon: WalletCards },
  { label: 'Budgets', path: '/app/budgets', icon: Target },
  { label: 'Reports', path: '/app/reports', icon: FileText },
  { label: 'Activity', path: '/app/activity', icon: Bell },
  { label: 'Settings', path: '/app/settings', icon: Settings },
];

const titles = {
  '/app/dashboard': 'Budget Command Center',
  '/app/transactions': 'Transactions',
  '/app/expenses': 'Expenses',
  '/app/budgets': 'Budgets and Goals',
  '/app/reports': 'Reports and Insights',
  '/app/activity': 'Activity',
  '/app/settings': 'Settings',
  '/app/profile': 'Profile',
};

function initialDarkMode() {
  const savedTheme = window.localStorage.getItem('homebudgetai.theme');
  return savedTheme ? savedTheme === 'dark' : Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('homebudgetai.sidebar') === 'collapsed');
  const [dark, setDark] = useState(initialDarkMode);
  const [currency, setCurrency] = useState(() => window.localStorage.getItem('homebudgetai.currency') || 'USD');
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || 'Budget Command Center';

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
    navigate(`/app/transactions?q=${encodeURIComponent(search.trim())}`);
  }

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}${dark ? ' dark-mode' : ''}`} data-theme={dark ? 'dark' : 'light'} data-currency={currency}>
      <aside className="sidebar">
        <Link className="brand" to="/app/dashboard" aria-label="HomeBudgetAI dashboard">
          <span className="brand-mark">HB</span>
          <span className="hide-when-collapsed"><strong>HomeBudgetAI</strong><small>Fintech OS</small></span>
        </Link>

        <button className="sidebar-action" type="button" onClick={toggleCollapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          <span className="hide-when-collapsed">Collapse</span>
        </button>

        <nav aria-label="Primary navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/app/dashboard'} title={collapsed ? label : undefined}>
              <Icon size={19} aria-hidden="true" /><span className="hide-when-collapsed">{label}</span>
            </NavLink>
          ))}
        </nav>

        <section className="panel ai-card sidebar-pulse hide-when-collapsed">
          <div className="section-head"><div><h2>Financial insights</h2><p>Review suggestions based on your transactions.</p></div></div>
          <Link className="btn-primary" to="/app/reports"><FileText size={16} /> View reports</Link>
        </section>

        <div className="sidebar-footer">
          <button className="sidebar-action" type="button" onClick={toggleTheme}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}<span className="hide-when-collapsed">{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.fullName)}</div>
            <div className="hide-when-collapsed"><strong>{user?.fullName || 'Account'}</strong><small>{user?.role || 'User'} workspace</small></div>
          </div>
        </div>
      </aside>

      <main className="shell-main">
        <header className="topbar">
          <div className="topbar-heading"><small>Financial command center</small><h1>{title}</h1></div>
          <form className="search-box" role="search" onSubmit={submitSearch}>
            <Search size={18} aria-hidden="true" />
            <input aria-label="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions…" />
            <button type="submit" className="search-submit">Search</button>
          </form>
          <div className="top-actions">
            <Link className="icon-button" to="/app/activity" aria-label="Notifications"><Bell size={19} /></Link>
            <Link className="icon-button" to="/app/settings" aria-label="Settings"><Settings size={19} /></Link>
            <Link className="btn-secondary profile-action" to="/app/profile"><UserRound size={17} /><span>Profile</span></Link>
            <button className="btn-ghost" type="button" onClick={signOut} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
          </div>
        </header>

        <div className="content-area"><Outlet /></div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
          { label: 'Transactions', path: '/app/transactions', icon: CreditCard },
          { label: 'Budgets', path: '/app/budgets', icon: Target },
          { label: 'Reports', path: '/app/reports', icon: FileText },
          { label: 'Profile', path: '/app/profile', icon: UserRound },
          { label: 'Menu', path: '/app/activity', icon: Menu },
        ].map(({ label, path, icon: Icon }) => <NavLink key={label} to={path} aria-label={label}><Icon size={20} /></NavLink>)}
      </nav>
    </div>
  );
}
