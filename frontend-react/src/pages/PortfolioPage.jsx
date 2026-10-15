import { useState } from 'react';
import { Award, ArrowRight, BriefcaseBusiness, Code2, Database, Download, ExternalLink, GraduationCap, Layers3, Mail, Moon, Server, Sparkles, Sun, TerminalSquare, Trophy, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../utils/assetUrl';

const groups = [
  { title: 'Frontend', icon: Code2, skills: [['React', 88], ['JavaScript', 82], ['HTML5', 90], ['CSS3', 88], ['Angular', 78], ['Responsive UI', 82]] },
  { title: 'Backend', icon: Server, skills: [['ASP.NET Core Web API', 88], ['C#', 84], ['Entity Framework Core', 82], ['JWT Authentication', 80], ['REST APIs', 84], ['Repository Pattern', 78]] },
  { title: 'Database and Tools', icon: Database, skills: [['SQL Server', 82], ['SQLite', 80], ['Git and GitHub', 84], ['Swagger', 80], ['Docker', 76], ['Visual Studio', 82]] },
];

const projects = [
  { category: 'fullstack', title: 'HomeBudgetAI - Full Stack Finance Management Platform', summary: 'A finance management application with React, ASP.NET Core Web API, EF Core, JWT security, dashboards, budgets, and reports.', badges: ['React', 'ASP.NET Core', 'EF Core', 'JWT', 'REST APIs', 'Docker'] },
  { category: 'backend', title: 'ASP.NET Core REST API Architecture', summary: 'Backend practice covering controllers, DTOs, EF Core, middleware, Swagger documentation, and clear API boundaries.', badges: ['C#', 'Web API', 'EF Core', 'SQL', 'Swagger'] },
  { category: 'frontend', title: 'React Finance Dashboard UI', summary: 'Responsive React interface with protected routes, reusable workflows, analytics sections, and mobile navigation.', badges: ['React', 'JavaScript', 'CSS', 'Responsive UI'] },
];

const journey = [
  ['Programming foundation', 'Built a base in C#, JavaScript, TypeScript, SQL, and object-oriented programming while completing a B.Tech in AI and ML.'],
  ['Backend architecture', 'Focused on ASP.NET Core Web API, REST endpoints, Entity Framework Core, SQL, JWT authentication, and clean service boundaries.'],
  ['Full-stack product building', 'Created HomeBudgetAI as a practical finance platform with authentication, dashboards, transaction workflows, and deployment-ready structure.'],
  ['Continuous learning', 'Improving performance, responsive interfaces, documentation, GitHub workflow, and product quality.'],
];

const filters = [['All', 'all'], ['Full Stack', 'fullstack'], ['Backend', 'backend'], ['Frontend', 'frontend']];

export default function PortfolioPage() {
  const [theme, setTheme] = useState('dark');
  const [filter, setFilter] = useState('all');
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const visibleProjects = filter === 'all' ? projects : projects.filter((project) => project.category === filter);

  function sendContact(event) {
    event.preventDefault();
    const subject = encodeURIComponent(`Portfolio inquiry from ${contact.name || 'Recruiter'}`);
    const body = encodeURIComponent(`Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`);
    window.location.href = `mailto:rajkatkuri05@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <main className={`portfolio-shell ${theme === 'light' ? 'light-mode' : ''}`}>
      <div className="mesh-layer" />
      <nav className="portfolio-nav" aria-label="Portfolio navigation">
        <a className="portfolio-brand" href="#top"><img src={assetUrl('images/Raju_profile.jpg')} alt="Katkuri Raju" /><span><strong>Katkuri Raju</strong><small>Full Stack Developer</small></span></a>
        <div className="nav-links">{[['About', '#about'], ['Skills', '#skills'], ['Project', '#project'], ['Journey', '#journey'], ['Contact', '#contact']].map(([label, href]) => <a href={href} key={label}>{label}</a>)}</div>
        <button className="theme-toggle" type="button" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      </nav>

      <section id="top" className="hero-section section-reveal">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> Full-stack portfolio</span><h1>Katkuri Raju</h1>
          <div className="typing-line portfolio-roles" aria-label="Developer roles"><span>Full Stack Developer</span><span>.NET Developer</span><span>React Developer</span></div>
          <p className="hero-subtitle">I build secure finance-focused web applications with REST APIs, JWT authentication, responsive React interfaces, and deployment-ready architecture.</p>
          <div className="hero-actions"><a className="btn-primary" href={assetUrl('resume/Katkuri_Raju_Resume.pdf')} download><Download size={17} /> Download Resume</a><Link className="btn-secondary" to="/login">Live Demo</Link><a className="btn-secondary" href="https://github.com/Raju3009/homebudgetai-fullstack" target="_blank" rel="noreferrer"><ExternalLink size={16} /> GitHub</a><a className="btn-secondary" href="https://www.linkedin.com/in/katkuri-raju0930" target="_blank" rel="noreferrer"><ExternalLink size={16} /> LinkedIn</a><a className="btn-secondary" href="#contact">Contact</a></div>
          <div className="hero-meta"><span>Hyderabad, India</span><span>Open to fresher full-stack roles</span><a href="mailto:rajkatkuri05@gmail.com">rajkatkuri05@gmail.com</a><a href="tel:+919391988931">+91 9391988931</a></div>
        </div>
        <aside className="profile-stage" aria-label="Katkuri Raju professional profile"><div className="portrait-card floating-portrait"><img src={assetUrl('images/Raju_profile.jpg')} alt="Katkuri Raju profile" /><div className="portrait-caption"><strong>Katkuri Raju</strong><span>Full-stack developer · Hyderabad, India</span><small>React, ASP.NET Core, EF Core, JWT</small></div></div><div className="terminal-card"><div className="terminal-dots"><span /><span /><span /></div><pre><code>{`const developer = {\n  name: 'Katkuri Raju',\n  role: 'Full Stack Developer',\n  stack: ['React', 'ASP.NET Core', 'SQL'],\n  project: 'HomeBudgetAI'\n};`}</code></pre></div></aside>
      </section>

      <section id="about" className="portfolio-section section-reveal"><div className="section-kicker"><UserRound size={18} /> About me</div><div className="split-layout"><div><h2>Fresher developer with practical product-building discipline.</h2><p>I enjoy building finance-focused applications that pair dependable APIs with responsive interfaces. HomeBudgetAI brings those interests together in a project built to be run and reviewed locally.</p></div><div className="about-panel glass-card"><h3>Profile snapshot</h3><div><span>Focus</span><strong>Full-stack web development</strong></div><div><span>Frontend</span><strong>React and Angular</strong></div><div><span>Backend</span><strong>.NET Web API</strong></div><div><span>Location</span><strong>Hyderabad, India</strong></div></div></div></section>

      <section id="skills" className="portfolio-section section-reveal"><div className="section-heading"><div className="section-kicker"><Layers3 size={18} /> Skills</div><h2>Technology for full-stack finance applications.</h2></div><div className="skills-grid">{groups.map(({ title, icon: Icon, skills }) => <article className="skill-card glass-card" key={title}><div className="skill-title"><Icon size={20} /><h3>{title}</h3></div><div className="skill-list">{skills.map(([name, level]) => <div className="skill-row" key={name}><div><span>{name}</span><small>{level}%</small></div><div className="skill-track"><i style={{ width: `${level}%` }} /></div></div>)}</div></article>)}</div></section>

      <section id="project" className="portfolio-section section-reveal"><div className="section-heading"><div className="section-kicker"><BriefcaseBusiness size={18} /> Featured work</div><h2>HomeBudgetAI is the main project to review.</h2><p>Filter the project list to see frontend and backend work.</p></div><div className="filter-tabs" aria-label="Project filters">{filters.map(([label, value]) => <button type="button" className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div><article className="featured-project glass-card"><div className="project-copy"><span className="eyebrow"><Trophy size={16} /> Main featured project</span><h3>HomeBudgetAI - Full Stack Finance Management Platform</h3><p>Finance workspace built with a React frontend and ASP.NET Core API, featuring JWT auth, transaction management, budgets, reports, and savings goals.</p><div className="metric-strip"><span><small>Frontend</small><strong>React</strong></span><span><small>Backend</small><strong>ASP.NET Core</strong></span><span><small>Database</small><strong>EF Core</strong></span><span><small>Security</small><strong>JWT</strong></span></div><div className="project-actions"><Link className="btn-primary" to="/login">Open Demo</Link><a className="btn-secondary" href="https://github.com/Raju3009/homebudgetai-fullstack" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Source Code</a></div></div><div className="product-preview" aria-label="HomeBudgetAI interface preview"><div className="preview-glass"><div className="preview-top"><span /><span /><span /></div><div className="preview-cards"><div><small>Transactions</small><strong><CreditCardIcon /></strong></div><div><small>Budgets</small><strong><Layers3 size={20} /></strong></div><div className="wide"><small>Income and expenses</small><i /><i /><i /><i /></div></div></div></div></article><div className="project-grid">{visibleProjects.map((project) => <article className="project-card glass-card" key={project.title}><div className="project-card-head"><h3>{project.title}</h3><ExternalLink size={16} /></div><p>{project.summary}</p><div className="badge-row">{project.badges.map((badge) => <span className="badge" key={badge}>{badge}</span>)}</div><div className="project-links"><a href="https://github.com/Raju3009/homebudgetai-fullstack" target="_blank" rel="noreferrer">GitHub <ArrowRight size={15} /></a></div></article>)}</div></section>

      <section id="journey" className="portfolio-section section-reveal"><div className="section-heading"><div className="section-kicker"><TerminalSquare size={18} /> Experience and learning</div><h2>Project-based experience and continuous learning.</h2></div><div className="timeline">{journey.map(([title, copy], index) => <article className="timeline-item glass-card" key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>

      <section className="portfolio-section section-reveal education-cert-grid"><article className="glass-card info-card"><div className="section-kicker"><GraduationCap size={18} /> Education</div><h2>B.Tech in Artificial Intelligence and Machine Learning</h2><p>Academic foundation in software, data, and intelligent systems.</p><div className="info-meta"><span>2021 - 2025</span><span>CGPA: 7.5/10</span></div></article><article className="glass-card info-card"><div className="section-kicker"><Award size={18} /> Certifications</div><h2>Professional learning credentials</h2><p>.NET Full Stack Development Certification · Udemy</p><p>Angular Certification · Coursera</p><p>Additional cloud and backend learning in progress</p></article></section>

      <section id="resume" className="portfolio-section resume-strip section-reveal"><div><div className="section-kicker"><Download size={18} /> Resume</div><h2>Download My Resume</h2><p>Review my experience, project work, and technical skills.</p></div><a className="btn-primary" href={assetUrl('resume/Katkuri_Raju_Resume.pdf')} download>Download Resume <ArrowRight size={16} /></a></section>

      <section id="contact" className="portfolio-section contact-section section-reveal"><div className="contact-copy"><div className="section-kicker"><Mail size={18} /> Contact</div><h2>Let us discuss full-stack developer opportunities.</h2><p>Send a message using your email application, or reach out directly.</p><div className="contact-links"><a href="mailto:rajkatkuri05@gmail.com"><Mail size={16} /> rajkatkuri05@gmail.com</a><a href="tel:+919391988931">+91 9391988931</a></div></div><form className="contact-form glass-card" onSubmit={sendContact}><label>Name<input value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} /></label><label>Email<input type="email" required value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} /></label><label>Message<textarea required rows="5" value={contact.message} onChange={(event) => setContact((current) => ({ ...current, message: event.target.value }))} /></label><button className="btn-primary" type="submit">Open email <ArrowRight size={16} /></button></form></section>

      <footer className="portfolio-footer"><span>© {new Date().getFullYear()} Katkuri Raju</span><span>Built with React and HomeBudgetAI</span><a href="#top">Back to top</a></footer>
    </main>
  );
}

function CreditCardIcon() {
  return <span aria-hidden="true">HB</span>;
}
