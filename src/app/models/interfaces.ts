export interface Control {
    id: string;
    area: string;
    category: string;
    description: string;
    level: number;
    cwe: string;
    nist: string;
    valid: string;
    sourceRef: string;
    comment: string;
    toolUsed: string;
    implemented: boolean;
}

export interface Category {
    name: string;
    areas: string[];
    controls: Control[];
    totalControls: number;
}

export interface ChecklistData {
    categories: Category[];
    totalControls: number;
    lastUpdated: string;
}

export interface ComplianceScore {
    globalScore: number;
    totalControls: number;
    implementedCount: number;
    missingCount: number;
    perCategory: CategoryScore[];
    perLevel: LevelScore[];
    missingControls: MissingControl[];
}

export interface CategoryScore {
    name: string;
    total: number;
    implemented: number;
    score: number;
}

export interface LevelScore {
    name: string;
    total: number;
    implemented: number;
    score: number;
}

export interface MissingControl {
    id: string;
    category: string;
    area: string;
    description: string;
    level: string;
}

export interface Recommendation {
    control_id: string;
    title: string;
    what_to_implement: string;
    how_to_implement: string;
    best_practices: string;
    example: string;
}

export interface RecommendationResponse {
    recommendations: Recommendation[];
    processedCount: number;
    totalMissing: number;
}
