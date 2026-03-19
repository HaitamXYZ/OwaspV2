import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Subscription } from 'rxjs';
import { ChecklistService } from '../../services/checklist.service';
import { ComplianceService } from '../../services/compliance.service';
import { AiService } from '../../services/ai.service';
import { MissingControl, Recommendation } from '../../models/interfaces';

interface ControlItem {
  control: MissingControl;
  recommendation: Recommendation | null;
  loading: boolean;
  error: string;
  expanded: boolean;
  generated: boolean;
}

interface CategoryGroup {
  name: string;
  items: ControlItem[];
  expanded: boolean;
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reco-page">
      <div class="reco-header animate-fade-in">
        <div>
          <h2>AI Security Insights</h2>
          <p class="subtitle">Get AI-powered recommendations for each missing security control</p>
        </div>
      </div>

      <!-- Global Stats -->
      <div class="global-stats animate-fade-in" *ngIf="dataLoaded && totalMissing > 0" style="animation-delay: 100ms">
        <div class="stat-chip">
          <span class="stat-dot red"></span>
          <strong>{{ totalMissing }}</strong> Missing Controls
        </div>
        <div class="stat-chip">
          <span class="stat-dot cyan"></span>
          <strong>{{ categoryGroups.length }}</strong> Categories
        </div>
        <div class="stat-chip" *ngIf="totalGenerated > 0">
          <span class="stat-dot purple"></span>
          <strong>{{ totalGenerated }}</strong> Recommendations
        </div>
      </div>

      <!-- All Implemented -->
      <div class="status-card card" *ngIf="dataLoaded && totalMissing === 0">
        <div class="empty-reco">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3>All Controls Implemented!</h3>
          <p>No missing controls detected. Great security posture!</p>
        </div>
      </div>

      <!-- Category Sections -->
      <div class="category-list">
        <div *ngFor="let group of categoryGroups; let gi = index"
             class="category-section card animate-fade-in"
             [style.animation-delay]="(gi * 60) + 'ms'">

          <!-- Category Header -->
          <div class="cat-header" (click)="group.expanded = !group.expanded">
            <div class="cat-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   class="chevron" [class.rotated]="group.expanded">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <h3 class="cat-name">{{ group.name }}</h3>
              <span class="badge badge-red">{{ group.items.length }} missing</span>
              <span class="badge badge-green" *ngIf="getGeneratedCount(group) > 0">
                ✓ {{ getGeneratedCount(group) }} generated
              </span>
            </div>
          </div>

          <!-- Expanded: Individual Controls -->
          <div class="cat-body" *ngIf="group.expanded">
            <div *ngFor="let item of group.items" class="control-row">
              <div class="control-main">
                <div class="control-info">
                  <span class="ctrl-id">{{ item.control.id }}</span>
                  <span class="ctrl-desc">{{ item.control.description }}</span>
                  <span class="ctrl-level badge" [class]="'badge-level-' + item.control.level.toLowerCase()">{{ item.control.level }}</span>
                </div>
                <button class="btn btn-xs"
                        [class.btn-primary]="!item.generated"
                        [class.btn-success]="item.generated"
                        (click)="generateForControl(item)"
                        [disabled]="item.loading">
                  <div *ngIf="item.loading" class="loading-spinner xs"></div>
                  <svg *ngIf="!item.loading && !item.generated" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/>
                  </svg>
                  <svg *ngIf="!item.loading && item.generated" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ item.loading ? '...' : (item.generated ? 'View' : 'Generate') }}
                </button>
              </div>

              <!-- Error -->
              <div class="ctrl-error" *ngIf="item.error">
                <span>❌ {{ item.error }}</span>
                <button class="btn-dismiss" (click)="item.error = ''">✕</button>
              </div>

              <!-- Recommendation Result -->
              <div class="ctrl-reco" *ngIf="item.generated && item.expanded && item.recommendation">
                <div class="reco-section">
                  <div class="section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    What to Implement
                  </div>
                  <p>{{ item.recommendation.what_to_implement }}</p>
                </div>
                <div class="reco-section">
                  <div class="section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                    How to Implement
                  </div>
                  <p>{{ item.recommendation.how_to_implement }}</p>
                </div>
                <div class="reco-section">
                  <div class="section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow)" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Best Practices
                  </div>
                  <p>{{ item.recommendation.best_practices }}</p>
                </div>
                <div class="reco-section" *ngIf="item.recommendation.example">
                  <div class="section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Code Example
                  </div>
                  <pre class="code-block"><code>{{ item.recommendation.example }}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reco-page { padding: var(--space-xl); max-width: 1200px; margin: 0 auto; }
    .reco-header { margin-bottom: var(--space-lg); }
    .reco-header h2 { font-size: 1.8rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.5px; }
    .subtitle { color: var(--text-muted); margin-top: 4px; }

    .api-warning {
      display: flex; align-items: center; gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      margin-bottom: var(--space-lg);
      border-left: 3px solid var(--accent-orange);
      color: var(--accent-orange); font-size: 0.9rem;
    }
    .api-warning strong { color: var(--accent-cyan); }

    .global-stats { display: flex; gap: var(--space-md); margin-bottom: var(--space-lg); flex-wrap: wrap; }
    .stat-chip {
      display: flex; align-items: center; gap: 8px;
      background: var(--bg-surface); border: 1px solid var(--border-color);
      padding: 8px 16px; border-radius: 100px;
      font-size: 0.85rem; color: var(--text-secondary);
    }
    .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
    .stat-dot.red { background: var(--accent-red); }
    .stat-dot.cyan { background: var(--accent-cyan); }
    .stat-dot.purple { background: var(--accent-purple); }

    .status-card { margin-bottom: var(--space-lg); padding: var(--space-lg); }
    .empty-reco { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-xl); text-align: center; }
    .empty-reco h3 { color: var(--accent-green); }
    .empty-reco p { color: var(--text-muted); }

    .category-list { display: flex; flex-direction: column; gap: var(--space-md); }
    .category-section { overflow: hidden; }

    .cat-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-lg); cursor: pointer;
      transition: background var(--transition-fast);
    }
    .cat-header:hover { background: var(--bg-card-hover); }
    .cat-info { display: flex; align-items: center; gap: var(--space-sm); }
    .cat-name { font-size: 1rem; font-weight: 700; margin: 0; margin-right: var(--space-sm); }

    .chevron { color: var(--text-muted); transition: transform var(--transition-normal); flex-shrink: 0; }
    .chevron.rotated { transform: rotate(90deg); }

    .badge-green { background: var(--accent-green-dim); color: var(--accent-green); }
    .badge-level-l1 { background: var(--accent-green-dim); color: var(--accent-green); }
    .badge-level-l2 { background: var(--accent-orange-dim); color: var(--accent-orange); }
    .badge-level-l3 { background: var(--accent-red-dim); color: var(--accent-red); }

    .cat-body { border-top: 1px solid var(--border-color); }

    .control-row {
      border-bottom: 1px solid var(--border-color);
      transition: background var(--transition-fast);
    }
    .control-row:last-child { border-bottom: none; }
    .control-row:hover { background: rgba(255,255,255,0.02); }

    .control-main {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px var(--space-lg); gap: var(--space-md);
    }

    .control-info { display: flex; align-items: center; gap: var(--space-md); flex: 1; min-width: 0; }

    .ctrl-id {
      font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem;
      color: var(--accent-cyan); min-width: 55px; flex-shrink: 0;
    }
    .ctrl-desc {
      font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;
      flex: 1; min-width: 0;
    }
    .ctrl-level { flex-shrink: 0; font-size: 0.7rem; }

    .btn-xs {
      padding: 5px 14px; font-size: 0.75rem; border-radius: var(--radius-sm);
      display: flex; align-items: center; gap: 5px; white-space: nowrap;
      cursor: pointer; border: 1px solid var(--border-color);
      background: transparent; color: var(--text-primary);
      transition: all var(--transition-fast); flex-shrink: 0;
    }
    .btn-xs.btn-primary {
      background: var(--accent-cyan); color: var(--bg-primary);
      border-color: var(--accent-cyan); font-weight: 600;
    }
    .btn-xs.btn-primary:hover { opacity: 0.9; }
    .btn-xs.btn-success {
      background: var(--accent-green-dim); color: var(--accent-green);
      border-color: var(--accent-green); font-weight: 600;
    }
    .btn-xs.btn-success:hover { background: var(--accent-green); color: var(--bg-primary); }
    .btn-xs:disabled { opacity: 0.4; cursor: not-allowed; }

    .ctrl-error {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px var(--space-lg); margin: 0 var(--space-lg) 8px;
      background: var(--accent-red-dim); border-radius: var(--radius-sm);
      color: var(--accent-red); font-size: 0.8rem;
    }
    .btn-dismiss {
      background: none; border: none; color: var(--accent-red);
      cursor: pointer; font-size: 0.9rem; padding: 2px 6px;
    }

    .ctrl-reco {
      padding: 0 var(--space-lg) var(--space-lg);
      margin-left: 55px;
      border-left: 2px solid var(--accent-cyan-dim);
      padding-left: var(--space-lg);
    }

    .reco-section { margin-top: var(--space-md); }
    .section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 4px;
    }
    .reco-section p { font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary); margin: 0; }

    .code-block {
      background: var(--bg-primary); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: var(--space-md);
      font-family: var(--font-mono); font-size: 0.78rem;
      color: var(--accent-green); overflow-x: auto;
      white-space: pre-wrap; word-break: break-word; margin-top: 4px;
    }

    .loading-spinner.xs { width: 12px; height: 12px; border-width: 2px; }
  `]
})
export class RecommendationsComponent implements OnInit, OnDestroy {
  categoryGroups: CategoryGroup[] = [];
  dataLoaded = false;
  totalMissing = 0;
  private sub?: Subscription;

  get totalGenerated(): number {
    return this.categoryGroups.reduce((sum, g) =>
      sum + g.items.filter(i => i.generated).length, 0);
  }

  constructor(
    private checklistService: ChecklistService,
    private complianceService: ComplianceService,
    private aiService: AiService
  ) { }

  ngOnInit(): void {
    this.sub = combineLatest([
      this.checklistService.checklist$,
      this.checklistService.implementedControls$
    ]).subscribe(([checklist, _implemented]) => {
      if (checklist && checklist.categories && checklist.categories.length > 0) {
        const allControls = this.checklistService.getAllControls();
        if (allControls.length === 0) return;
        const implementedIds = this.checklistService.getImplementedControlIds();
        const result = this.complianceService.calculateCompliance(implementedIds, allControls);

        // Group missing controls by category
        const groupMap = new Map<string, MissingControl[]>();
        result.missingControls.forEach(mc => {
          if (!groupMap.has(mc.category)) groupMap.set(mc.category, []);
          groupMap.get(mc.category)!.push(mc);
        });

        // Preserve existing state
        const existingMap = new Map<string, CategoryGroup>();
        this.categoryGroups.forEach(g => existingMap.set(g.name, g));

        this.categoryGroups = Array.from(groupMap.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .map(([name, controls]) => {
            const existing = existingMap.get(name);
            const existingItems = new Map<string, ControlItem>();
            existing?.items.forEach(i => existingItems.set(i.control.id, i));

            return {
              name,
              expanded: existing?.expanded || false,
              items: controls.map(mc => {
                const existingItem = existingItems.get(mc.id);
                return {
                  control: mc,
                  recommendation: existingItem?.recommendation || null,
                  loading: existingItem?.loading || false,
                  error: existingItem?.error || '',
                  expanded: existingItem?.expanded || false,
                  generated: existingItem?.generated || false
                };
              })
            };
          });

        this.totalMissing = result.missingControls.length;
        this.dataLoaded = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getGeneratedCount(group: CategoryGroup): number {
    return group.items.filter(i => i.generated).length;
  }

  generateForControl(item: ControlItem): void {
    // If already generated, just toggle expand
    if (item.generated) {
      item.expanded = !item.expanded;
      return;
    }

    item.loading = true;
    item.error = '';

    // Send just this one control to the AI
    this.aiService.getRecommendations([item.control])
      .subscribe({
        next: (response) => {
          if (response.recommendations && response.recommendations.length > 0) {
            item.recommendation = response.recommendations[0];
          }
          item.loading = false;
          item.generated = true;
          item.expanded = true;
        },
        error: (err) => {
          item.error = err.error?.error || err.error?.details || 'Failed to generate recommendation.';
          item.loading = false;
        }
      });
  }
}
