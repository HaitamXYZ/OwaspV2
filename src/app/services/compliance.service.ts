import { Injectable } from '@angular/core';
import { Control, ComplianceScore, CategoryScore, LevelScore, MissingControl } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ComplianceService {

    calculateCompliance(implementedControlIds: string[], allControls: Control[]): ComplianceScore {
        const implementedSet = new Set(implementedControlIds);
        const total = allControls.length;
        const implemented = allControls.filter(c => implementedSet.has(c.id)).length;

        // Global score
        const globalScore = total > 0 ? Math.round((implemented / total) * 100) : 0;

        // Per-category scores
        const categoryMap: Record<string, { total: number; implemented: number }> = {};
        allControls.forEach(control => {
            if (!categoryMap[control.category]) {
                categoryMap[control.category] = { total: 0, implemented: 0 };
            }
            categoryMap[control.category].total++;
            if (implementedSet.has(control.id)) {
                categoryMap[control.category].implemented++;
            }
        });

        const perCategory: CategoryScore[] = Object.entries(categoryMap).map(([name, data]) => ({
            name,
            total: data.total,
            implemented: data.implemented,
            score: data.total > 0 ? Math.round((data.implemented / data.total) * 100) : 0
        }));

        // Per-level scores
        const levelMap: Record<string, { total: number; implemented: number }> = {};
        allControls.forEach(control => {
            const level = `L${control.level}`;
            if (!levelMap[level]) {
                levelMap[level] = { total: 0, implemented: 0 };
            }
            levelMap[level].total++;
            if (implementedSet.has(control.id)) {
                levelMap[level].implemented++;
            }
        });

        const perLevel: LevelScore[] = Object.entries(levelMap).map(([name, data]) => ({
            name,
            total: data.total,
            implemented: data.implemented,
            score: data.total > 0 ? Math.round((data.implemented / data.total) * 100) : 0
        }));

        // Missing controls
        const missingControls: MissingControl[] = allControls
            .filter(c => !implementedSet.has(c.id))
            .map(c => ({
                id: c.id,
                category: c.category,
                area: c.area,
                description: c.description,
                level: `L${c.level}`
            }));

        return {
            globalScore,
            totalControls: total,
            implementedCount: implemented,
            missingCount: total - implemented,
            perCategory,
            perLevel,
            missingControls
        };
    }
}
