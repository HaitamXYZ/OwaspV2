import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MissingControl, RecommendationResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AiService {
    private apiUrl = '/api';

    constructor(private http: HttpClient) { }

    getRecommendations(missingControls: MissingControl[]): Observable<RecommendationResponse> {
        return this.http.post<RecommendationResponse>(`${this.apiUrl}/ai/recommendations`, {
            missingControls
        });
    }
}
