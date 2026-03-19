import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { ChecklistService } from '../../services/checklist.service';
import { ComplianceService } from '../../services/compliance.service';
import { ComplianceScore } from '../../models/interfaces';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard">
      <div class="dashboard-header animate-fade-in">
        <h2>Security Dashboard</h2>
        <p class="subtitle">OWASP ASVS v4.0.2 Compliance Overview</p>
      </div>

      <div class="score-overview" *ngIf="compliance">
        <!-- Main Score Card -->
        <div class="main-score-card card-glow animate-fade-in">
          <div class="score-ring-container">
            <div class="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-surface)" stroke-width="10"/>
                <circle cx="60" cy="60" r="52" fill="none"
                  [attr.stroke]="getScoreColor(compliance.globalScore)"
                  stroke-width="10"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getCircleDash(compliance.globalScore)"
                  stroke-dashoffset="0"
                  transform="rotate(-90 60 60)"
                  class="score-circle"/>
              </svg>
              <div class="score-value">
                <span class="score-number">{{ compliance.globalScore }}</span>
                <span class="score-percent">%</span>
              </div>
            </div>
          </div>
          <div class="score-details">
            <h3>Overall Compliance</h3>
            <div class="score-stats">
              <div class="stat">
                <span class="stat-value text-green">{{ compliance.implementedCount }}</span>
                <span class="stat-label">Implemented</span>
              </div>
              <div class="stat">
                <span class="stat-value text-red">{{ compliance.missingCount }}</span>
                <span class="stat-label">Missing</span>
              </div>
              <div class="stat">
                <span class="stat-value text-cyan">{{ compliance.totalControls }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Level Cards -->
        <div class="level-cards">
          <div *ngFor="let level of compliance.perLevel; let i = index"
               class="level-card card animate-fade-in"
               [style.animation-delay]="(i * 100) + 'ms'">
            <div class="level-header">
              <span class="level-badge" [class]="getLevelBadgeClass(level.name)">{{ level.name }}</span>
              <span class="level-score" [style.color]="getScoreColor(level.score)">{{ level.score }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [class]="getProgressClass(level.score)"
                   [style.width.%]="level.score"></div>
            </div>
            <div class="level-stats">
              <span>{{ level.implemented }} / {{ level.total }} controls</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row" *ngIf="compliance">
        <div class="chart-card card animate-fade-in">
          <h3>Category Compliance</h3>
          <div class="chart-container">
            <canvas baseChart
              [data]="radarChartData"
              [options]="radarChartOptions"
              type="radar">
            </canvas>
          </div>
        </div>

        <div class="chart-card card animate-fade-in" style="animation-delay: 150ms">
          <h3>Implementation Status</h3>
          <div class="chart-container">
            <canvas baseChart
              [data]="doughnutChartData"
              [options]="doughnutChartOptions"
              type="doughnut">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="category-breakdown animate-fade-in" *ngIf="compliance" style="animation-delay: 200ms">
        <h3>Category Breakdown</h3>
        <div class="category-grid">
          <div *ngFor="let cat of compliance.perCategory; let i = index"
               class="category-item card"
               [style.animation-delay]="(i * 50) + 'ms'">
            <div class="cat-header">
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-score" [style.color]="getScoreColor(cat.score)">{{ cat.score }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [class]="getProgressClass(cat.score)"
                   [style.width.%]="cat.score"></div>
            </div>
            <div class="cat-stats">
              <span class="text-green">{{ cat.implemented }}</span> /
              <span>{{ cat.total }}</span> controls
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="!compliance">
        <div class="loading-spinner lg"></div>
        <p>Loading compliance data...</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
    .dashboard-header { margin-bottom: var(--space-xl); }
    .dashboard-header h2 { font-size: 1.8rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.5px; }
    .subtitle { color: var(--text-muted); margin-top: 4px; }
    .score-overview { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-xl); }
    .main-score-card { display: flex; align-items: center; gap: var(--space-xl); padding: var(--space-xl); }
    .score-ring-container { flex-shrink: 0; }
    .score-ring { width: 140px; height: 140px; position: relative; }
    .score-ring svg { width: 100%; height: 100%; }
    .score-circle { transition: stroke-dasharray 1s ease; }
    .score-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .score-number { font-size: 2.5rem; font-weight: 800; line-height: 1; }
    .score-percent { font-size: 1rem; color: var(--text-muted); font-weight: 600; }
    .score-details h3 { font-size: 1.3rem; font-weight: 700; margin-bottom: var(--space-md); }
    .score-stats { display: flex; gap: var(--space-xl); }
    .stat { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .text-green { color: var(--accent-green); }
    .text-red { color: var(--accent-red); }
    .text-cyan { color: var(--accent-cyan); }
    .level-cards { display: flex; flex-direction: column; gap: var(--space-md); }
    .level-card { padding: var(--space-md) var(--space-lg); }
    .level-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm); }
    .level-badge { padding: 3px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
    .level-badge.badge-l1 { background: var(--accent-green-dim); color: var(--accent-green); }
    .level-badge.badge-l2 { background: var(--accent-orange-dim); color: var(--accent-orange); }
    .level-badge.badge-l3 { background: var(--accent-red-dim); color: var(--accent-red); }
    .level-score { font-size: 1.2rem; font-weight: 700; }
    .level-stats { font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-xl); }
    .chart-card { padding: var(--space-lg); }
    .chart-card h3 { margin-bottom: var(--space-md); font-size: 1rem; font-weight: 600; }
    .chart-container { height: 300px; display: flex; align-items: center; justify-content: center; }
    .category-breakdown h3 { margin-bottom: var(--space-md); font-size: 1.2rem; font-weight: 700; }
    .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-md); }
    .category-item { padding: var(--space-md); }
    .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm); }
    .cat-name { font-weight: 600; font-size: 0.9rem; }
    .cat-score { font-weight: 700; font-size: 1rem; }
    .cat-stats { font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; }
    .loading-container { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-2xl); color: var(--text-muted); }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  compliance: ComplianceScore | null = null;
  private sub?: Subscription;

  radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 25, color: '#64748b', backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: '#1e293b' },
        angleLines: { color: '#1e293b' },
        pointLabels: { color: '#94a3b8', font: { size: 10 } }
      }
    },
    plugins: { legend: { display: false } }
  };

  doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 16, usePointStyle: true, font: { size: 12 } }
      }
    }
  };

  constructor(
    private checklistService: ChecklistService,
    private complianceService: ComplianceService
  ) { }

  ngOnInit(): void {
    this.sub = combineLatest([
      this.checklistService.checklist$,
      this.checklistService.implementedControls$
    ]).subscribe(([checklist, _implemented]) => {
      if (checklist && checklist.categories && checklist.categories.length > 0) {
        this.recalculate();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private recalculate(): void {
    const allControls = this.checklistService.getAllControls();
    if (allControls.length === 0) return;
    const implementedIds = this.checklistService.getImplementedControlIds();
    this.compliance = this.complianceService.calculateCompliance(implementedIds, allControls);
    this.updateCharts();
  }

  private updateCharts(): void {
    if (!this.compliance) return;

    const labels = this.compliance.perCategory.map(c =>
      c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name
    );
    this.radarChartData = {
      labels,
      datasets: [{
        data: this.compliance.perCategory.map(c => c.score),
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        borderColor: '#00d4ff',
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#0d1321',
        pointBorderWidth: 2,
        borderWidth: 2
      }]
    };

    this.doughnutChartData = {
      labels: ['Implemented', 'Missing'],
      datasets: [{
        data: [this.compliance.implementedCount, this.compliance.missingCount],
        backgroundColor: ['#00e676', '#ff5252'],
        borderColor: ['#00e67644', '#ff525244'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    };
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#00e676';
    if (score >= 40) return '#ff9800';
    return '#ff5252';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  getCircleDash(score: number): string {
    const circumference = 2 * Math.PI * 52;
    const filled = (score / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  getProgressClass(score: number): string {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  getLevelBadgeClass(name: string): string {
    return 'level-badge badge-' + name.toLowerCase();
  }
}
