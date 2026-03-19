import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="settings-page">
      <div class="settings-header animate-fade-in">
        <h2>Settings</h2>
        <p class="subtitle">Application information and configuration</p>
      </div>

      <div class="settings-grid">
        <!-- About -->
        <div class="settings-card card animate-fade-in" style="animation-delay: 100ms">
          <div class="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3>About ASVSGuard</h3>
          <p class="card-desc">
            ASVSGuard helps developers evaluate their application security posture
            using the OWASP Application Security Verification Standard (ASVS) v4.0.2 checklist.
          </p>
          <div class="about-info">
            <div class="info-row">
              <span class="info-label">Version</span>
              <span class="badge badge-cyan">1.0.0</span>
            </div>
            <div class="info-row">
              <span class="info-label">ASVS Version</span>
              <span class="badge badge-green">4.0.2</span>
            </div>
            <div class="info-row">
              <span class="info-label">AI Model</span>
              <span class="badge badge-purple">Llama 3.3 70B (Groq)</span>
            </div>
          </div>
        </div>

        <!-- AI Status -->
        <div class="settings-card card animate-fade-in" style="animation-delay: 200ms">
          <div class="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3>AI Configuration</h3>
          <p class="card-desc">
            AI-powered security recommendations are enabled and configured server-side.
            No additional setup required — just navigate to AI Insights and click Generate.
          </p>
          <div class="status-indicator">
            <span class="status-dot active"></span>
            <span class="status-text">AI Service Active</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .settings-page {
      padding: var(--space-xl);
      max-width: 900px;
      margin: 0 auto;
    }

    .settings-header {
      margin-bottom: var(--space-xl);
    }

    .settings-header h2 {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-heading);
    }

    .subtitle {
      color: var(--text-muted);
      margin-top: 4px;
    }

    .settings-grid {
      display: grid;
      gap: var(--space-lg);
    }

    .settings-card {
      padding: var(--space-xl);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-md);
    }

    .settings-card h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .card-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: var(--space-lg);
    }

    .about-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-sm) 0;
      border-bottom: 1px solid var(--border-color);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--text-muted);
    }

    .status-dot.active {
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green);
    }

    .status-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--accent-green);
    }
  `]
})
export class SettingsComponent { }
