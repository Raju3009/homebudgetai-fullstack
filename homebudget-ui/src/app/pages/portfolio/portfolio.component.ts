import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  
  ArrowRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Database,
  Download,
  ExternalLink,
  Github,
  GraduationCap,
  Layers3,
  Linkedin,
  Mail,
  Moon,
  Phone,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  TerminalSquare,
  Trophy,
  UserRound,
  LucideAngularModule,
  DownloadIcon
} from 'lucide-angular';
import { ToastService } from '../../shared/toast.service';

const icons = {
 
  ArrowRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Database,
  DownloadIcon,
  Download,
  ExternalLink,
  Github,
  GraduationCap,
  Layers3,
  Linkedin,
  Mail,
  Moon,
  Phone,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  TerminalSquare,
  Trophy,
  UserRound
};

type ProjectFilter = 'all' | 'fullstack' | 'backend' | 'frontend';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent {
  readonly icons = icons;
  readonly theme = signal<'dark' | 'light'>('dark');
  readonly activeFilter = signal<ProjectFilter>('all');
  private toast = inject(ToastService);
  readonly contact = { name: '', email: '', message: '' };
  readonly roles = ['Full Stack Developer', '.NET Developer', 'Angular Developer'];

  readonly codeSnippet = `const developer = {
  name: 'Katkuri Raju',
  role: 'Full Stack Developer',
  stack: ['ASP.NET Core', 'Angular', 'SQL Server'],
  focus: 'Secure REST APIs, local SQLite, and responsive SaaS UI',
  project: 'HomeBudgetAI'
};`;
  readonly navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Project', href: '#project' },
    { label: 'Journey', href: '#journey' },
    { label: 'Contact', href: '#contact' }
  ];

  readonly projectMetrics = [
    { label: 'Frontend', value: 'Angular 21' },
    { label: 'Backend', value: 'ASP.NET Core' },
    { label: 'Database', value: 'SQLite local' },
    { label: 'Security', value: 'JWT Auth' }
  ];

  readonly skillGroups = [
    {
      title: 'Frontend',
      icon: 'Code2',
      skills: [
        { name: 'Angular', level: 86 },
        { name: 'TypeScript', level: 82 },
        { name: 'HTML5', level: 90 },
        { name: 'CSS3', level: 88 },
        { name: 'Bootstrap', level: 78 },
        { name: 'JavaScript', level: 80 }
      ]
    },
    {
      title: 'Backend',
      icon: 'Server',
      skills: [
        { name: 'ASP.NET Core Web API', level: 88 },
        { name: 'C#', level: 84 },
        { name: 'Entity Framework Core', level: 82 },
        { name: 'JWT Authentication', level: 80 },
        { name: 'Repository Pattern', level: 78 },
        { name: 'ADO.NET', level: 72 }
      ]
    },
    {
      title: 'Database and Tools',
      icon: 'Database',
      skills: [
        { name: 'SQL Server', level: 82 },
        { name: 'Git and GitHub', level: 84 },
        { name: 'Swagger', level: 80 },
        { name: 'Postman', level: 78 },
        { name: 'Visual Studio', level: 82 },
        { name: 'VS Code', level: 86 }
      ]
    }
  ];

  readonly projectFilters: { label: string; value: ProjectFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Full Stack', value: 'fullstack' },
    { label: 'Backend', value: 'backend' },
    { label: 'Frontend', value: 'frontend' }
  ];

  readonly projects = [
    {
      title: 'HomeBudgetAI - Full Stack Finance Management Platform',
      category: 'fullstack' as const,
      summary: 'A production-style finance management application built with Angular, ASP.NET Core Web API, SQL Server, JWT security, dashboards, and deployment-ready architecture.',
      links: {
        live: '/login',
        github: 'https://github.com/Raju3009/homebudgetai-fullstack'
      },
      badges: ['ASP.NET Core', 'Angular', 'SQL Server', 'EF Core', 'JWT', 'Swagger', 'REST APIs', 'Docker'],
      highlights: [
        'Built secure authentication and authorization using JWT-based API protection.',
        'Created expense and income workflows with SQL database operations and EF Core.',
        'Designed dashboard analytics with charts for balance, savings, and category insights.',
        'Applied repository pattern, service boundaries, middleware exception handling, and rate limiting.',
        'Prepared cloud deployment architecture with Netlify frontend and Render backend.'
      ]
    },
    {
      title: 'ASP.NET Core REST API Architecture',
      category: 'backend' as const,
      summary: 'Backend-focused implementation practice covering controllers, DTOs, EF Core, middleware, Swagger documentation, and clean API boundaries.',
      links: {
        github: 'https://github.com/Raju3009/homebudgetai-fullstack'
      },
      badges: ['C#', 'Web API', 'EF Core', 'SQL Server', 'Swagger'],
      highlights: [
        'Practiced RESTful endpoint design and controller separation.',
        'Used dependency injection and structured services for maintainability.',
        'Documented API behavior with Swagger for easier testing and interviews.'
      ]
    },
    {
      title: 'Angular Finance Dashboard UI',
      category: 'frontend' as const,
      summary: 'Responsive Angular interface with protected routes, reusable page patterns, animated cards, analytics sections, and mobile-first improvements.',
      links: {
        live: '/login',
        github: 'https://github.com/Raju3009/homebudgetai-fullstack'
      },
      badges: ['Angular', 'TypeScript', 'CSS', 'Bootstrap', 'Responsive UI'],
      highlights: [
        'Built recruiter-ready UI pages around real finance workflows.',
        'Implemented responsive shell behavior for mobile, laptop, and desktop.',
        'Integrated frontend services with backend API contracts.'
      ]
    }
  ];

  readonly journey = [
    { title: 'Foundation in programming', copy: 'Built a strong base in C#, JavaScript, TypeScript, SQL, and object-oriented programming while completing B.Tech in AI and ML.' },
    { title: 'Backend architecture practice', copy: 'Focused on ASP.NET Core Web API, REST endpoints, Entity Framework Core, SQL Server, JWT authentication, and clean service boundaries.' },
    { title: 'Full-stack product building', copy: 'Created HomeBudgetAI as a real-world finance platform with authentication, dashboards, expense workflows, and deployment-ready structure.' },
    { title: 'Recruiter-ready engineering mindset', copy: 'Continuously improving performance, responsive UI, documentation, GitHub workflow, and interview-ready project explanations.' }
  ];

  readonly certifications = [
    '.NET Full Stack Development Certification - Udemy',
    'Angular Certification - Coursera',
    'Additional cloud and backend certifications in progress'
  ];

  filteredProjects() {
    const filter = this.activeFilter();
    return filter === 'all' ? this.projects : this.projects.filter(project => project.category === filter);
  }

  toggleTheme() {
    this.theme.update(value => value === 'dark' ? 'light' : 'dark');
  }

  submitContact() {
    if (!this.contact.email || !this.contact.message) {
      this.toast.warning('Please enter your email and message.');
      return;
    }

    this.toast.success('Opening your email client.');
    const subject = encodeURIComponent(`Portfolio inquiry from ${this.contact.name || 'Recruiter'}`);
    const body = encodeURIComponent(`Name: ${this.contact.name}\nEmail: ${this.contact.email}\n\n${this.contact.message}`);
    window.location.href = `mailto:rajkatkuri05@gmail.com?subject=${subject}&body=${body}`;
  }
}


