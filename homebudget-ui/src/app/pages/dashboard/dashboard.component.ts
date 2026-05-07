import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { ApiService, DashboardSummary } from '../../services/api.service';

@Component({ selector: 'app-dashboard', standalone: true, imports: [CommonModule], templateUrl: './dashboard.component.html' })
export class DashboardComponent implements OnInit {
  summary?: DashboardSummary; loading = true; chart?: Chart;
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.dashboard().subscribe(res => { this.summary = res; this.loading = false; requestAnimationFrame(() => this.draw()); }); }
  draw() {
    const canvas = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
    if (!canvas || !this.summary) return;
    this.chart?.destroy();
    this.chart = new Chart(canvas, { type: 'bar', data: { labels: this.summary.monthlyTotals.map(x => x.month), datasets: [{ label: 'Income', data: this.summary.monthlyTotals.map(x => x.income), backgroundColor: '#0f9f6e' }, { label: 'Expenses', data: this.summary.monthlyTotals.map(x => x.expenses), backgroundColor: '#dc2626' }] }, options: { responsive: true, maintainAspectRatio: false } });
  }
}
