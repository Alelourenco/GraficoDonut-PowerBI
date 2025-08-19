import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;

export interface DonutChartData {
    category: string;
    value: number;
    legend?: string;
    details?: string[];
    color?: string;
    selectionId?: ISelectionId;
}

export interface DonutChartSettings {
    total: {
        show: boolean;
        fontSize: number;
        color: string;
        label: string;
    };
    labels: {
        show: boolean;
        fontSize: number;
        color: string;
    };
    legend: {
        show: boolean;
        position: string; // "rightCenter", "leftCenter", "topCenter", "topLeft", "topRight"
        fontSize: number;
        color: string;
    };
    details: {
        show: boolean;
        fontSize: number;
        color: string;
    };
    colors: {
        categoryColors: { [category: string]: string };
    };
}
