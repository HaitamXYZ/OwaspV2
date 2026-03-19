import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChecklistService } from '../../services/checklist.service';
import { Category, Control } from '../../models/interfaces';

@Component({
    selector: 'app-checklist',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="checklist-page">
      <div class="checklist-header animate-fade-in">
        <div>
          <h2>Security Checklist</h2>
          <p class="subtitle">Mark implemented controls in your application</p>
        </div>
        <div class="header-stats" *ngIf="allControls.length > 0">
          <span class="badge badge-green">{{ implementedCount }} Implemented</span>
          <span class="badge badge-red">{{ allControls.length - implementedCount }} Missing</span>
          <span class="badge badge-cyan">{{ filteredControls.length }} Shown</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar card animate-fade-in" style="animation-delay: 100ms">
        <div class="filter-group">
          <label>ASVS Level</label>
          <div class="filter-buttons">
            <button class="filter-btn" [class.active]="levelFilter === 0"
                    (click)="setLevelFilter(0)">All</button>
            <button class="filter-btn l1" [class.active]="levelFilter === 1"
                    (click)="setLevelFilter(1)">L1</button>
            <button class="filter-btn l2" [class.active]="levelFilter === 2"
                    (click)="setLevelFilter(2)">L2</button>
            <button class="filter-btn l3" [class.active]="levelFilter === 3"
                    (click)="setLevelFilter(3)">L3</button>
          </div>
        </div>

        <div class="filter-group">
          <label>Category</label>
          <select class="input-field filter-select" [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat.name">{{ cat.name }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Status</label>
          <div class="filter-buttons">
            <button class="filter-btn" [class.active]="statusFilter === 'all'"
                    (click)="setStatusFilter('all')">All</button>
            <button class="filter-btn" [class.active]="statusFilter === 'implemented'"
                    (click)="setStatusFilter('implemented')">
              <span class="dot dot-green"></span> Implemented
            </button>
            <button class="filter-btn" [class.active]="statusFilter === 'missing'"
                    (click)="setStatusFilter('missing')">
              <span class="dot dot-red"></span> Missing
            </button>
          </div>
        </div>

        <div class="filter-group search-group">
          <label>Search</label>
          <input type="text" class="input-field" placeholder="Search controls..."
                 [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
        </div>
      </div>

      <!-- Accordion Sections -->
      <div class="checklist-sections">
        <div *ngFor="let section of groupedControls | keyvalue; let i = index"
             class="section-card card animate-fade-in"
             [style.animation-delay]="(i * 60) + 'ms'">

          <div class="section-header" (click)="toggleSection(section.key)">
            <div class="section-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   class="chevron" [class.rotated]="expandedSections.has(section.key)">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <h3>{{ section.key }}</h3>
              <span class="section-count badge badge-cyan">{{ section.value.length }}</span>
            </div>
            <div class="section-progress">
              <span class="section-score" [style.color]="getScoreColor(getSectionScore(section.value))">
                {{ getSectionScore(section.value) }}%
              </span>
              <div class="progress-bar" style="width: 120px">
                <div class="progress-fill" [class]="getProgressClass(getSectionScore(section.value))"
                     [style.width.%]="getSectionScore(section.value)"></div>
              </div>
            </div>
          </div>

          <div class="section-body" *ngIf="expandedSections.has(section.key)">
            <div *ngFor="let areaGroup of getAreaGroups(section.value) | keyvalue" class="area-group">
              <div class="area-header" *ngIf="areaGroup.key !== 'General'">
                <span class="area-name">{{ areaGroup.key }}</span>
              </div>

              <div *ngFor="let control of areaGroup.value" class="control-item"
                   [class.implemented]="control.implemented">
                <label class="custom-checkbox">
                  <input type="checkbox" [checked]="control.implemented"
                         (change)="toggleControl(control, $event)">
                  <div class="control-content">
                    <div class="control-top">
                      <span class="control-id">{{ control.id }}</span>
                      <span class="level-tag" [class]="'level-' + control.level">L{{ control.level }}</span>
                      <span class="cwe-tag" *ngIf="control.cwe">CWE-{{ control.cwe }}</span>
                    </div>
                    <p class="control-desc">{{ control.description }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="filteredControls.length === 0 && allControls.length > 0">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No controls match your filters</p>
      </div>
    </div>
  `,
    styles: [`
    .checklist-page {
      padding: var(--space-xl);
      max-width: 1200px;
      margin: 0 auto;
    }

    .checklist-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-lg);
    }

    .checklist-header h2 {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-heading);
    }

    .subtitle {
      color: var(--text-muted);
      margin-top: 4px;
    }

    .header-stats {
      display: flex;
      gap: var(--space-sm);
    }

    .filters-bar {
      display: flex;
      gap: var(--space-lg);
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: var(--space-lg);
      padding: var(--space-lg);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .filter-buttons {
      display: flex;
      gap: 4px;
    }

    .filter-btn {
      padding: 6px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-primary);
    }

    .filter-btn:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
    }

    .filter-btn.active {
      background: var(--accent-cyan-dim);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }

    .filter-btn.l1.active { background: var(--accent-green-dim); border-color: var(--accent-green); color: var(--accent-green); }
    .filter-btn.l2.active { background: var(--accent-orange-dim); border-color: var(--accent-orange); color: var(--accent-orange); }
    .filter-btn.l3.active { background: var(--accent-red-dim); border-color: var(--accent-red); color: var(--accent-red); }

    .filter-select {
      min-width: 180px;
    }

    .search-group {
      flex: 1;
      min-width: 200px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot-green { background: var(--accent-green); }
    .dot-red { background: var(--accent-red); }

    .section-card {
      margin-bottom: var(--space-md);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: var(--space-md) var(--space-lg);
      transition: background var(--transition-fast);
    }

    .section-header:hover {
      background: var(--bg-card-hover);
    }

    .section-info {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .section-info h3 {
      font-size: 1rem;
      font-weight: 600;
    }

    .chevron {
      transition: transform var(--transition-normal);
      color: var(--text-muted);
    }

    .chevron.rotated {
      transform: rotate(180deg);
    }

    .section-progress {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .section-score {
      font-weight: 700;
      font-size: 0.9rem;
      min-width: 40px;
      text-align: right;
    }

    .section-body {
      border-top: 1px solid var(--border-color);
      padding: var(--space-md) 0;
    }

    .area-group {
      margin-bottom: var(--space-sm);
    }

    .area-header {
      padding: var(--space-sm) var(--space-xl);
    }

    .area-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-purple);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .control-item {
      padding: var(--space-sm) var(--space-xl);
      transition: background var(--transition-fast);
      border-left: 3px solid transparent;
    }

    .control-item:hover {
      background: var(--bg-card-hover);
    }

    .control-item.implemented {
      border-left-color: var(--accent-green);
      background: rgba(0, 230, 118, 0.03);
    }

    .control-content {
      flex: 1;
    }

    .control-top {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: 4px;
    }

    .control-id {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-cyan);
    }

    .level-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 8px;
      border-radius: 100px;
    }

    .level-1 { background: var(--accent-green-dim); color: var(--accent-green); }
    .level-2 { background: var(--accent-orange-dim); color: var(--accent-orange); }
    .level-3 { background: var(--accent-red-dim); color: var(--accent-red); }

    .cwe-tag {
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .control-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-2xl);
      color: var(--text-muted);
    }
  `]
})
export class ChecklistComponent implements OnInit {
    categories: Category[] = [];
    allControls: Control[] = [];
    filteredControls: Control[] = [];
    groupedControls: Map<string, Control[]> = new Map();
    expandedSections: Set<string> = new Set();

    levelFilter = 0;
    categoryFilter = '';
    statusFilter = 'all';
    searchTerm = '';
    implementedCount = 0;

    constructor(private checklistService: ChecklistService) { }

    ngOnInit(): void {
        this.checklistService.checklist$.subscribe(data => {
            if (data) {
                this.categories = data.categories;
                this.allControls = data.categories.flatMap(c => c.controls);
                this.applyFilters();
            }
        });

        this.checklistService.implementedControls$.subscribe(set => {
            this.implementedCount = set.size;
        });
    }

    setLevelFilter(level: number): void {
        this.levelFilter = level;
        this.applyFilters();
    }

    setStatusFilter(status: string): void {
        this.statusFilter = status;
        this.applyFilters();
    }

    applyFilters(): void {
        let controls = [...this.allControls];

        if (this.levelFilter > 0) {
            controls = controls.filter(c => c.level === this.levelFilter);
        }

        if (this.categoryFilter) {
            controls = controls.filter(c => c.category === this.categoryFilter);
        }

        if (this.statusFilter === 'implemented') {
            controls = controls.filter(c => c.implemented);
        } else if (this.statusFilter === 'missing') {
            controls = controls.filter(c => !c.implemented);
        }

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            controls = controls.filter(c =>
                c.id.toLowerCase().includes(term) ||
                c.description.toLowerCase().includes(term) ||
                c.area.toLowerCase().includes(term)
            );
        }

        this.filteredControls = controls;
        this.groupControls();
    }

    private groupControls(): void {
        this.groupedControls = new Map();
        this.filteredControls.forEach(control => {
            const key = control.category;
            if (!this.groupedControls.has(key)) {
                this.groupedControls.set(key, []);
            }
            this.groupedControls.get(key)!.push(control);
        });
    }

    getAreaGroups(controls: Control[]): Map<string, Control[]> {
        const groups = new Map<string, Control[]>();
        controls.forEach(c => {
            if (!groups.has(c.area)) groups.set(c.area, []);
            groups.get(c.area)!.push(c);
        });
        return groups;
    }

    toggleSection(key: string): void {
        if (this.expandedSections.has(key)) {
            this.expandedSections.delete(key);
        } else {
            this.expandedSections.add(key);
        }
    }

    toggleControl(control: Control, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.checklistService.toggleControl(control.id, checked);
    }

    getSectionScore(controls: Control[]): number {
        if (controls.length === 0) return 0;
        const implemented = controls.filter(c => c.implemented).length;
        return Math.round((implemented / controls.length) * 100);
    }

    getScoreColor(score: number): string {
        if (score >= 70) return 'var(--accent-green)';
        if (score >= 40) return 'var(--accent-orange)';
        return 'var(--accent-red)';
    }

    getProgressClass(score: number): string {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }
}
