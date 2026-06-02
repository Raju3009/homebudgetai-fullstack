import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowRight, BarChart3, Check, CreditCard, FileText, LockKeyhole, ShieldCheck, Sparkles, Target, WalletCards, LucideAngularModule } from 'lucide-angular';

const icons = { ArrowRight, BarChart3, Check, CreditCard, FileText, LockKeyhole, ShieldCheck, Sparkles, Target, WalletCards };

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
  <main class="landing-page premium-page">
    <header class="landing-nav">
      <a class="brand" routerLink="/"><span class="brand-mark">HB</span><strong>HomeBudgetAI</strong></a>
      <nav class="links">
        <a href="#features">Features</a>
        <a href="#analytics">Analytics</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div class="hero-actions">
        <a class="btn-secondary" routerLink="/login">Login</a>
        <a class="btn-primary" routerLink="/register">Start free <lucide-icon name="ArrowRight" size="16"></lucide-icon></a>
      </div>
    </header>

    <section class="landing-hero">
      <div class="hero-copy">
        <span class="badge success"><lucide-icon name="Sparkles" size="15"></lucide-icon> AI-native household finance</span>
        <h1>Run your money like a modern fintech team.</h1>
        <p>HomeBudgetAI combines budgets, transactions, reports, goals, alerts, and AI insights in a premium command center built for families and ambitious professionals.</p>
        <div class="hero-actions">
          <a class="btn-primary" routerLink="/register">Create workspace <lucide-icon name="ArrowRight" size="17"></lucide-icon></a>
          <a class="btn-secondary" routerLink="/login">View demo</a>
        </div>
        <div class="feature-pills">
          <span>Animated analytics</span><span>JWT protected</span><span>PDF and CSV reports</span><span>Responsive SaaS UI</span>
        </div>
      </div>

      <div class="dashboard-preview" aria-label="Dashboard preview">
        <div class="preview-window">
          <div class="section-head">
            <div><h2>May command center</h2><p>Live spending intelligence</p></div>
            <span class="badge success">+12% savings</span>
          </div>
          <div class="preview-grid">
            <div class="preview-card"><small>Balance</small><h2>₹8,42,000</h2><span class="badge success">Healthy runway</span></div>
            <div class="preview-card"><small>Income</small><h2>₹7,10,000</h2><span class="badge success">On track</span></div>
            <div class="preview-card"><small>Expenses</small><h2>₹4,86,000</h2><span class="badge danger">Watch dining</span></div>
            <div class="preview-card wide"><small>Income vs expenses</small><div class="mini-bars"><i style="height:72%"></i><i style="height:48%"></i><i style="height:88%"></i><i style="height:55%"></i><i style="height:80%"></i><i style="height:42%"></i><i style="height:95%"></i><i style="height:58%"></i></div></div>
            <div class="preview-card tall"><small>AI insights</small><p>Food spending rose 18%. Move ₹20,000 from entertainment to protect your savings target.</p><p>Savings improved 12% after recurring transfers.</p></div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="landing-section">
      <div class="section-title"><h2>Everything a premium money workspace needs.</h2><p>Fast workflows, beautiful visuals, and backend-backed features instead of static mockups.</p></div>
      <div class="card-grid">
        <article class="feature-card" *ngFor="let feature of features">
          <lucide-icon [name]="feature.icon" size="24"></lucide-icon>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.copy }}</p>
        </article>
      </div>
    </section>

    <section id="analytics" class="landing-section dark">
      <div class="section-title"><h2>Analytics that feel alive.</h2><p>Animated charts, heatmaps, smart alerts, and export-ready reports turn everyday budgeting into an executive dashboard.</p></div>
      <div class="card-grid">
        <article class="feature-card"><h3>AI spending narratives</h3><p>Plain-English insight cards explain changes, risk, and next best actions.</p></article>
        <article class="feature-card"><h3>Budget health scoring</h3><p>Progress bars and alerts show when a category needs attention before month-end.</p></article>
        <article class="feature-card"><h3>Board-ready reports</h3><p>Generate polished PDF and CSV exports for monthly or yearly reviews.</p></article>
      </div>
    </section>

    <section class="landing-section">
      <div class="section-title"><h2>Trusted by modern households.</h2><p>Designed to look at home beside Stripe, Revolut, Mint, Linear, and Notion-grade SaaS experiences.</p></div>
      <div class="card-grid">
        <article class="feature-card" *ngFor="let item of testimonials"><p>"{{ item.quote }}"</p><strong>{{ item.name }}</strong><small>{{ item.role }}</small></article>
      </div>
    </section>

    <section id="pricing" class="landing-section dark">
      <div class="section-title"><h2>Simple plans for every money system.</h2></div>
      <div class="card-grid">
        <article class="feature-card" *ngFor="let plan of pricing">
          <span class="badge">{{ plan.tier }}</span><h3>{{ plan.price }}</h3><p>{{ plan.copy }}</p>
          <p *ngFor="let line of plan.lines"><lucide-icon name="Check" size="15"></lucide-icon> {{ line }}</p>
        </article>
      </div>
    </section>

    <section id="faq" class="landing-section">
      <div class="section-title"><h2>FAQ</h2></div>
      <div class="card-grid">
        <article class="feature-card" *ngFor="let item of faqs"><h3>{{ item.q }}</h3><p>{{ item.a }}</p></article>
      </div>
    </section>

    <footer class="landing-section dark">
      <div class="section-head"><div><h2>HomeBudgetAI</h2><p>Premium fintech SaaS for personal finance intelligence.</p></div><a class="btn-primary" routerLink="/register">Launch workspace</a></div>
      <p>GitHub: Raju3009/homebudgetai-fullstack | Contact: hello@homebudget.ai | MIT License</p>
    </footer>
  </main>`
})
export class LandingComponent {
  features = [
    { icon: 'WalletCards', title: 'Unified money cockpit', copy: 'Track balance, income, expenses, savings, goals, and budgets from one responsive workspace.' },
    { icon: 'BarChart3', title: 'Animated analytics', copy: 'Chart.js dashboards reveal trends, category mix, weekly activity, and monthly performance.' },
    { icon: 'Sparkles', title: 'AI financial assistant', copy: 'Insight cards explain spending changes, overspend risk, and savings opportunities.' },
    { icon: 'Target', title: 'Budget intelligence', copy: 'Category limits, progress visuals, alerts, recurring habits, and goal tracking.' },
    { icon: 'FileText', title: 'Reports and exports', copy: 'Create printable summaries and download CSV or PDF reports for real workflows.' },
    { icon: 'ShieldCheck', title: 'Production security', copy: 'JWT auth, protected routes, roles, validation, rate limiting, and safer deployment defaults.' }
  ];
  testimonials = [
    { quote: 'It finally made household finance feel like a serious operating system.', name: 'Anika Rao', role: 'Founder' },
    { quote: 'The AI cards tell me what changed before I have to dig through rows.', name: 'Marcus Lee', role: 'Product Lead' },
    { quote: 'Beautiful enough for a portfolio, practical enough for daily use.', name: 'Priya Shah', role: 'Consultant' }
  ];
  pricing = [
    { tier: 'Free', price: '₹0', copy: 'Start tracking quickly.', lines: ['Transactions', 'Dashboard', 'CSV export'] },
    { tier: 'Pro', price: '₹999/mo', copy: 'For serious households.', lines: ['AI insights', 'Budgets', 'PDF reports'] },
    { tier: 'Enterprise', price: 'Custom', copy: 'For teams and demos.', lines: ['Admin role', 'Audit activity', 'Priority deployment'] }
  ];
  faqs = [
    { q: 'Is this connected to a backend?', a: 'Yes. Auth, dashboard, transactions, budgets, reports, settings, and notifications are API-backed.' },
    { q: 'Does it work on mobile?', a: 'The shell includes responsive cards, tables, and a bottom navigation optimized for touch.' },
    { q: 'Can I deploy it?', a: 'Netlify and Render configuration remain aligned with the Angular and .NET apps.' }
  ];
}



