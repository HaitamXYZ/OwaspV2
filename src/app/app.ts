import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ChecklistService } from './services/checklist.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="app-shell">
      <app-header></app-header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private checklistService: ChecklistService) { }

  ngOnInit(): void {
    // Load checklist data on app start
    this.checklistService.loadChecklist().subscribe({
      next: () => {
        // After checklist loads, load saved assessment state
        this.checklistService.loadSavedAssessment().subscribe();
      },
      error: (err) => console.error('Failed to load checklist:', err)
    });
  }
}
