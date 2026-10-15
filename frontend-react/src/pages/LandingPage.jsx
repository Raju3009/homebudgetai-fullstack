import { ArrowRight, BarChart3, Check, CreditCard, FileText, LockKeyhole, ShieldCheck, Sparkles, Target, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: WalletCards, title: 'Unified money cockpit', copy: 'Track transactions, budgets, savings goals, and reports in one responsive workspace.' },
  { icon: BarChart3, title: 'Clear analytics', copy: 'See income, expenses, savings trends, and category spend from your own account data.' },
  { icon: Sparkles, title: 'Financial insights', copy: 'Review server-generated suggestions based on your spending and category totals.' },
  { icon: Target, title: 'Budget guardrails', copy: 'Set category limits, view current spending, and keep savings goals visible.' },
  { icon: FileText, title: 'Reports and exports', copy: 'Filter monthly or yearly summaries and download CSV or PDF reports.' },
  { icon: ShieldCheck, title: 'Protected access', copy: 'JWT-protected financial routes with server-side ownership checks.' },
];

const plans = [
  { tier: 'Personal', price: 'Free', copy: 'Organize everyday household finances.', lines: ['Transactions', 'Dashboard', 'CSV reports'] },
  { tier: 'Household', price: 'Workspace', copy: 'Keep budgets and goals close to your activity.', lines: ['Budget tracking', 'Savings goals', 'Monthly insights'] },
  { tier: 'Developer', price: 'Open source', copy: 'Run the application with your own API and database.', lines: ['Self-hosted API', 'Local development', 'MIT licensed'] },
];

const faqs = [
  { q: 'Does HomeBudgetAI use a backend?', a: 'Yes. Account, transaction, budget, goal, report, notification, profile, and settings data come from the ASP.NET API.' },
  { q: 'Can I use it on a phone?', a: 'The workspace includes responsive pages and a touch-friendly bottom navigation.' },
  { q: 'Can I run it locally?', a: 'Yes. The React app and .NET API have separate local setup instructions in the repository README.' },
];

export default function LandingPage() {
  return (
    <main className="landing-page premium-page">
      <header className="landing-nav">
        <Link className="brand" to="/"><span className="brand-mark">HB</span><strong>HomeBudgetAI</strong></Link>
        <nav className="links" aria-label="Landing page navigation">
          <a href="#features">Features</a><a href="#analytics">Analytics</a><a href="#pricing">Plans</a><a href="#faq">FAQ</a>
        </nav>
        <div className="hero-actions"><Link className="btn-secondary" to="/login">Login</Link><Link className="btn-primary" to="/register">Start free <ArrowRight size={16} /></Link></div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="badge success"><Sparkles size={15} /> Personal finance workspace</span>
          <h1>Run your money with a clearer view.</h1>
          <p>Bring transactions, budgets, savings goals, reports, and financial insights into a calm, practical command center.</p>
          <div className="hero-actions"><Link className="btn-primary" to="/register">Create account <ArrowRight size={17} /></Link><Link className="btn-secondary" to="/login">Sign in</Link></div>
          <div className="feature-pills"><span>API-backed data</span><span>JWT protected</span><span>CSV and PDF reports</span><span>Responsive workspace</span></div>
        </div>
        <div className="dashboard-preview" aria-label="Illustration of a finance dashboard">
          <div className="preview-window">
            <div className="section-head"><div><h2>Money overview</h2><p>Income, expenses, and category spending</p></div><span className="badge success">Your data</span></div>
            <div className="preview-grid">
              <div className="preview-card"><small>Income</small><h2><CreditCard size={25} /></h2><span>Recorded transactions</span></div>
              <div className="preview-card"><small>Expenses</small><h2><WalletCards size={25} /></h2><span>Category totals</span></div>
              <div className="preview-card"><small>Goals</small><h2><Target size={25} /></h2><span>Progress at a glance</span></div>
              <div className="preview-card wide"><small>Monthly cash flow</small><div className="mini-bars" aria-hidden="true">{[58, 76, 43, 88, 66, 51, 78, 60].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
              <div className="preview-card tall"><small>Reports</small><p>Review your income, expenses, category spend, and server generated recommendations.</p><span className="badge">Connected to your API</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="section-title"><h2>Everything your money workspace needs.</h2><p>Useful financial workflows connected to your own account and API.</p></div>
        <div className="card-grid">{features.map(({ icon: Icon, title, copy }) => <article className="feature-card" key={title}><Icon size={24} /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section id="analytics" className="landing-section dark">
        <div className="section-title"><h2>Analytics that explain your numbers.</h2><p>Use the dashboard and reports to follow cash flow and spending patterns.</p></div>
        <div className="card-grid">
          <article className="feature-card"><h3>Spending summaries</h3><p>Compare expenses by category and period using your saved transactions.</p></article>
          <article className="feature-card"><h3>Budget health</h3><p>See category limits, current spending, remaining amounts, and configured thresholds.</p></article>
          <article className="feature-card"><h3>Export-ready reports</h3><p>Download filtered reports for your own monthly or yearly review.</p></article>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-title"><h2>Built for clear everyday decisions.</h2><p>Simple workflows for households and people who want more context around their money.</p></div>
        <div className="card-grid">
          <article className="feature-card"><ShieldCheck size={22} /><h3>Private workspace</h3><p>Financial records are scoped to the authenticated account by the API.</p></article>
          <article className="feature-card"><BarChart3 size={22} /><h3>Understand the trend</h3><p>Review income, spending, and savings movement across recorded months.</p></article>
          <article className="feature-card"><LockKeyhole size={22} /><h3>Control access</h3><p>Protected routes and API authorization guard account features.</p></article>
        </div>
      </section>

      <section id="pricing" className="landing-section dark">
        <div className="section-title"><h2>One workspace. Your own setup.</h2><p>Plans are informational; this repository does not include subscription billing.</p></div>
        <div className="card-grid">{plans.map((plan) => <article className="feature-card" key={plan.tier}><span className="badge">{plan.tier}</span><h3>{plan.price}</h3><p>{plan.copy}</p>{plan.lines.map((line) => <p className="plan-line" key={line}><Check size={15} /> {line}</p>)}</article>)}</div>
      </section>

      <section id="faq" className="landing-section">
        <div className="section-title"><h2>Frequently asked questions</h2></div>
        <div className="card-grid">{faqs.map((item) => <article className="feature-card" key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}</div>
      </section>

      <footer className="landing-section dark">
        <div className="section-head"><div><h2>HomeBudgetAI</h2><p>Personal finance tracking with a React frontend and ASP.NET API.</p></div><Link className="btn-primary" to="/register">Open your workspace</Link></div>
        <p><a href="https://github.com/Raju3009/homebudgetai-fullstack" target="_blank" rel="noreferrer">GitHub repository</a> · MIT License</p>
      </footer>
    </main>
  );
}
