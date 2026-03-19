import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChecklistComponent } from './components/checklist/checklist.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'checklist', component: ChecklistComponent },
    { path: 'recommendations', component: RecommendationsComponent },
    { path: 'settings', component: SettingsComponent },
    { path: '**', redirectTo: '/dashboard' }
];
