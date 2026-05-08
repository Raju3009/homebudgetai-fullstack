import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { ApiService, DashboardSummary } from '../../services/api.service';

@Component({ selector: 'app-dashboard', standalone: true, imports: [CommonModule], templateUrl: './dashboard.component.html' })
export class DashboardComponent implements OnInit, OnDestroy {
  summary?: DashboardSummary; loading = true; charts: Chart[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.dashboard().subscribe(res => { this.summary = res; this.loading = false; requestAnimationFrame(() => this.draw()); }); }
  ngOnDestroy() { this.charts.forEach(chart => chart.destroy()); }
  draw() {
    if (!this.summary) return;
    this.charts.forEach(chart => chart.destroy()); this.charts = [];
    const monthly = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
    if (monthly) {
      this.charts.push(new Chart(monthly, { type: 'bar', data: { labels: this.summary.monthlyTotals.map(x => x.month), datasets: [{ label: 'Income', data: this.summary.monthlyTotals.map(x => x.income), backgroundColor: '#0f9f6e', borderRadius: 8 }, { label: 'Expenses', data: this.summary.monthlyTotals.map(x => x.expenses), backgroundColor: '#dc2626', borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } }));
    }
    const category = document.getElementById('categoryChart') as HTMLCanvasElement | null;
    if (category && this.summary.categoryTotals.length) {
      this.charts.push(new Chart(category, { type: 'doughnut', data: { labels: this.summary.categoryTotals.map(x => x.category), datasets: [{ data: this.summary.categoryTotals.map(x => x.total), backgroundColor: ['#2156d9', '#0f9f6e', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } }));
    }
  }
}
