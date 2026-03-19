import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ChecklistData, Control } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ChecklistService {
    private apiUrl = '/api';
    private checklistSubject = new BehaviorSubject<ChecklistData | null>(null);
    private implementedControlsSubject = new BehaviorSubject<Set<string>>(new Set());

    checklist$ = this.checklistSubject.asObservable();
    implementedControls$ = this.implementedControlsSubject.asObservable();

    constructor(private http: HttpClient) { }

    loadChecklist(): Observable<ChecklistData> {
        return this.http.get<ChecklistData>(`${this.apiUrl}/checklist`).pipe(
            tap(data => {
                // Initialize implemented state from any previously loaded data
                data.categories.forEach(cat => {
                    cat.controls.forEach(control => {
                        control.implemented = this.implementedControlsSubject.value.has(control.id);
                    });
                });
                this.checklistSubject.next(data);
            })
        );
    }

    loadSavedAssessment(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/assessment`).pipe(
            tap(data => {
                if (data.implementedControls) {
                    this.implementedControlsSubject.next(new Set(data.implementedControls));
                    // Re-sync checklist data with saved state
                    const checklist = this.checklistSubject.value;
                    if (checklist) {
                        checklist.categories.forEach(cat => {
                            cat.controls.forEach(control => {
                                control.implemented = data.implementedControls.includes(control.id);
                            });
                        });
                        this.checklistSubject.next({ ...checklist });
                    }
                }
            })
        );
    }

    toggleControl(controlId: string, implemented: boolean): void {
        const current = new Set(this.implementedControlsSubject.value);
        if (implemented) {
            current.add(controlId);
        } else {
            current.delete(controlId);
        }
        this.implementedControlsSubject.next(current);

        // Update checklist data
        const checklist = this.checklistSubject.value;
        if (checklist) {
            checklist.categories.forEach(cat => {
                cat.controls.forEach(control => {
                    if (control.id === controlId) {
                        control.implemented = implemented;
                    }
                });
            });
            this.checklistSubject.next({ ...checklist });
        }

        // Save to backend
        this.saveAssessment(Array.from(current)).subscribe();
    }

    saveAssessment(implementedControls: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/assessment`, { implementedControls });
    }

    getAllControls(): Control[] {
        const checklist = this.checklistSubject.value;
        if (!checklist) return [];
        return checklist.categories.flatMap(c => c.controls);
    }

    getImplementedControlIds(): string[] {
        return Array.from(this.implementedControlsSubject.value);
    }
}
