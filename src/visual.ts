import powerbi from "powerbi-visuals-api";
import { getValue } from "./settings";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IColorPalette = powerbi.extensibility.IColorPalette;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;

// Constantes para melhor manutenção
const CONSTANTS = {
    SVG_NAMESPACE: "http://www.w3.org/2000/svg",
    ANIMATION: {
        TRANSITION_DURATION: "0.3s ease",
        LEGEND_TRANSITION: "0.2s ease"
    },
    LAYOUT: {
        BASE_MARGIN: 20,
        EXTERNAL_LABEL_MARGIN: 60,
        LEGEND_WIDTH: 160,
        LEGEND_ITEM_HEIGHT: 20,
        LEGEND_CIRCLE_RADIUS: 6,
        LEGEND_TEXT_OFFSET: 15,
        OUTER_RADIUS_RATIO: 0.98,
        MINIMUM_THICKNESS_RATIO: 0.01,
        LINE_START_OFFSET: 5,
        LINE_BEND_RATIO: 0.15,
        HORIZONTAL_LINE_RATIO: 0.12,
        LABEL_OFFSET: 8,
        CIRCLE_VERTICAL_OFFSET: 15,
    // Pontos de quebra responsivos
        MOBILE_BREAKPOINT: 300,
        TABLET_BREAKPOINT: 600,
        DESKTOP_BREAKPOINT: 900
    },
    STYLING: {
        STROKE_COLOR: "#ffffff",
        STROKE_WIDTH: "2",
        FONT_FAMILY: "Segoe UI, sans-serif",
        MAX_LEGEND_TEXT_LENGTH: 18
    },
    LIMITS: {
        MIN_VIEWPORT_SIZE: 50,
        MIN_INNER_RADIUS: 1,
        MAX_INNER_RADIUS: 99,
        MIN_PERCENT_DECIMALS: 0,
        MAX_PERCENT_DECIMALS: 3,
        FADE_OPACITY: 0.3,
        FULL_OPACITY: 1.0,
        FULL_CIRCLE_THRESHOLD: 0.001
    }
} as const;

interface DonutChartDataPoint {
    readonly category: string;
    readonly value: number;
    readonly highlightValue?: number;
    readonly color: string;
    readonly selectionId: ISelectionId;
    readonly highlighted: boolean;
}

interface DonutSettings {
    readonly total: {
        readonly show: boolean;
        readonly fontSize: number;
        readonly color: string;
        readonly label: string;
    };
    readonly legend: {
        readonly show: boolean;
        readonly fontSize: number;
        readonly color: string;
        readonly position: string; // "rightCenter", "leftCenter"
    };
    readonly dataLabels: {
        readonly show: boolean;
        readonly color: string;
        readonly fontSize: number;
        readonly showValue: boolean;
        readonly showPercent: boolean;
        readonly position: string;
        readonly percentDecimals: number;
    };
    readonly donut: {
        readonly innerRadius: number;
        readonly showBorders: boolean;
    };
    readonly colors: {
        readonly categoryColors: { [category: string]: string };
    };
}

interface LayoutDimensions {
    readonly width: number;
    readonly height: number;
    readonly margin: {
        readonly top: number;
        readonly right: number;
        readonly bottom: number;
        readonly left: number;
    };
    readonly chartWidth: number;
    readonly chartHeight: number;
    readonly radius: number;
    readonly centerX: number;
    readonly centerY: number;
}

export class DonutWithTotal implements IVisual {
    private readonly target: HTMLElement;
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly selectionManager: ISelectionManager;
    private data: DonutChartDataPoint[] = [];
    private settings: DonutSettings;
    private svg: SVGSVGElement;
    private currentSelectedIndex: number = -1;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.settings = this.getDefaultSettings();
        
        this.initializeSvg();
    }

    private initializeSvg(): void {
        this.svg = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "svg");
        this.svg.style.width = "100%";
        this.svg.style.height = "100%";
        this.svg.style.fontFamily = CONSTANTS.STYLING.FONT_FAMILY;
        this.target.appendChild(this.svg);
    }

    public update(options: VisualUpdateOptions): void {
        try {
            this.clearSvg();
            this.resetSelectionState();
            
            // Atualiza configurações e dados antes do layout para aplicar a configuração atual da legenda
            this.settings = this.getSettings(options.dataViews?.[0]);
            this.data = this.transformData(options.dataViews);
            
            const layout = this.calculateLayout(options.viewport);
            if (!this.isValidViewport(layout)) {
                return;
            }

            if (!this.hasValidData()) {
                this.showMessage("Adicione dados às categorias e valores");
                return;
            }

            this.renderDonutChart(layout);
            
        } catch (error) {
            console.error("Error rendering visual:", error);
            this.showMessage("Erro ao renderizar o visual");
        }
    }

    private clearSvg(): void {
    // Remove todos os nós filhos com segurança em vez de usar innerHTML
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    private resetSelectionState(): void {
        this.currentSelectedIndex = -1;
    }

    private calculateLayout(viewport: powerbi.IViewport): LayoutDimensions {
        const responsiveMargins = this.getResponsiveMargins(viewport);
        const externalLabelMargin = this.shouldShowExternalLabels() ? 
            Math.min(15, CONSTANTS.LAYOUT.EXTERNAL_LABEL_MARGIN * 0.2) : 0;
        
    // Verifica a posição da legenda para ajustar a posição do círculo
        const legendPosition = this.settings?.legend?.position || "rightCenter";
        const legendWidth = this.getResponsiveLegendWidth(viewport);
        
    // Calcula offsets com base na posição da legenda
        let circleOffsetX = 0;
        
        if (this.settings?.legend?.show) {
            if (legendPosition === "leftCenter") {
                circleOffsetX = (legendWidth + 30) / 2; // Desloca o círculo para a direita
            } else if (legendPosition === "rightCenter") {
                circleOffsetX = -(legendWidth + 30) / 2; // Desloca o círculo para a esquerda
            }
        }
        
        const margin = {
            top: responsiveMargins.base + externalLabelMargin,
            right: responsiveMargins.base + externalLabelMargin, 
            bottom: responsiveMargins.base + externalLabelMargin,
            left: responsiveMargins.base + externalLabelMargin
        };
        
    // A área do gráfico usa a maior parte da viewport
        const chartWidth = viewport.width - margin.left - margin.right;
        const chartHeight = viewport.height - margin.top - margin.bottom;
        
    // O círculo sempre usa o máximo de espaço disponível
        const availableSize = Math.min(chartWidth, chartHeight);
        const minSize = Math.min(viewport.width, viewport.height) * 0.6; // Sempre mínimo de 60%
        const effectiveSize = Math.max(availableSize, minSize);
        const radius = (effectiveSize * 0.9) / 2; // Aumentado de 0.8 para 0.9 para um círculo maior
        
    // Centraliza o círculo com offsets para posições da legenda, ligeiramente mais alto
        const centerX = margin.left + chartWidth / 2 + circleOffsetX;
    const centerY = margin.top + chartHeight / 2 - 15 + this.getResponsiveVerticalOffset(viewport); // -15px para subir

        return {
            width: viewport.width,
            height: viewport.height,
            margin,
            chartWidth,
            chartHeight,
            radius,
            centerX,
            centerY
        };
    }

    private getResponsiveMargins(viewport: powerbi.IViewport): { base: number } {
        const width = viewport.width;
        
        if (width < CONSTANTS.LAYOUT.MOBILE_BREAKPOINT) {
            return { base: 10 }; // Margens menores para mobile
        } else if (width < CONSTANTS.LAYOUT.TABLET_BREAKPOINT) {
            return { base: 15 }; // Margens médias para tablet
        }
        
        return { base: CONSTANTS.LAYOUT.BASE_MARGIN }; // Margens padrão para desktop
    }

    private getResponsiveLegendWidth(viewport: powerbi.IViewport): number {
        const width = viewport.width;
        
        if (width < CONSTANTS.LAYOUT.MOBILE_BREAKPOINT) {
            return Math.min(80, width * 0.2); // Legenda bem pequena para mobile
        } else if (width < CONSTANTS.LAYOUT.TABLET_BREAKPOINT) {
            return Math.min(100, width * 0.18); // Legenda pequena para tablet
        }
        
        return Math.min(120, CONSTANTS.LAYOUT.LEGEND_WIDTH * 0.6); // Largura reduzida da legenda
    }

    private getResponsiveVerticalOffset(viewport: powerbi.IViewport): number {
        const height = viewport.height;
        
        if (height < 200) {
            return 5; // Offset mínimo para alturas muito pequenas
        } else if (height < 400) {
            return 10; // Offset pequeno para alturas pequenas
        }
        
        return CONSTANTS.LAYOUT.CIRCLE_VERTICAL_OFFSET; // Offset padrão
    }

    private getLegendDimensions(viewport: powerbi.IViewport): { top: number, right: number, bottom: number, left: number } {
        if (!this.settings?.legend?.show) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        }

        const position = this.settings.legend.position;
        const legendWidth = this.getResponsiveLegendWidth(viewport);
        
        if (position === "leftCenter") {
            return { top: 0, right: 0, bottom: 0, left: legendWidth };
        } else { // rightCenter (default)
            return { top: 0, right: legendWidth, bottom: 0, left: 0 };
        }
    }

    private estimateLegendHeight(): number {
        if (!this.data || this.data.length === 0) {
            return 15; // Very minimal height
        }
        
        // Ultra compact height
        return 20; // Fixed very small height
    }

    private shouldShowExternalLabels(): boolean {
        return this.settings?.dataLabels?.show && this.settings?.dataLabels?.position === "outside";
    }

    private isValidViewport(layout: LayoutDimensions): boolean {
        return layout.width >= CONSTANTS.LIMITS.MIN_VIEWPORT_SIZE && 
               layout.height >= CONSTANTS.LIMITS.MIN_VIEWPORT_SIZE;
    }

    private hasValidData(): boolean {
        return this.data && this.data.length > 0;
    }

    private getDefaultSettings(): DonutSettings {
        return {
            total: { show: true, fontSize: 24, color: "#333333", label: "Total" },
            legend: { show: true, fontSize: 12, color: "#333333", position: "top" },
            dataLabels: { show: true, color: "#333333", fontSize: 10, showValue: true, showPercent: true, position: "inside", percentDecimals: 1 },
            donut: { innerRadius: 60, showBorders: false },
            colors: { categoryColors: {} }
        };
    }

    private transformData(dataViews: DataView[]): DonutChartDataPoint[] {
        if (!dataViews || !dataViews[0] || !dataViews[0].categorical) {
            return [];
        }

        const categorical = dataViews[0].categorical;
        const categories = categorical.categories?.[0];
        const values = categorical.values?.[0];

        if (!values) {
            return [];
        }

        const data: DonutChartDataPoint[] = [];
        const colorPalette = this.host.colorPalette;
        const hasHighlights = values.highlights && values.highlights.length > 0;

        // Handle case where there are values but no categories (total only)
        if (!categories) {
                // Cria um único ponto de dados para o total
            const totalValue = values.values[0] as number;
            if (totalValue !== null && totalValue !== undefined && totalValue > 0) {
                const selectionId = this.host.createSelectionIdBuilder().createSelectionId();
                
                data.push({
                    category: "Total",
                    value: totalValue,
                    highlightValue: hasHighlights ? (values.highlights[0] as number) : undefined,
                    color: colorPalette.getColor("Total").value,
                    selectionId: selectionId,
                    highlighted: hasHighlights && values.highlights[0] !== null && values.highlights[0] !== undefined
                });
            }
            return data;
        }

    const categoryObjects = (categories.objects as powerbi.DataViewObjects[]) || [];
        for (let i = 0; i < categories.values.length; i++) {
            const category = categories.values[i] as string;
            const value = values.values[i] as number;
            const highlightValue = hasHighlights ? (values.highlights[i] as number) : undefined;
            if (value !== null && value !== undefined && value > 0) {
                const selectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories, i)
                    .createSelectionId();
                // Retrieve custom category color if defined
                const obj = categoryObjects[i] as any;
                const customColor = obj?.dataPoint?.fill?.solid?.color;
                const fillColor = customColor || colorPalette.getColor(category).value;
                data.push({
                    category: category || `Categoria ${i + 1}`,
                    value: value,
                    highlightValue: highlightValue,
                    color: fillColor,
                    selectionId: selectionId,
                    highlighted: hasHighlights && highlightValue !== null && highlightValue !== undefined
                });
            }
        }

        return data;
    }

    private getSettings(dataView?: DataView): DonutSettings {
        if (!dataView) {
            return this.getDefaultSettings();
        }

        return {
            total: {
                show: getValue(dataView, "total", "show", true),
                fontSize: getValue(dataView, "total", "fontSize", 24),
                color: getValue(dataView, "total", "color", "#333333"),
                label: getValue(dataView, "total", "label", "Total")
            },
            legend: {
                show: getValue(dataView, "legend", "show", true),
                fontSize: getValue(dataView, "legend", "fontSize", 12),
                color: getValue(dataView, "legend", "color", "#333333"),
                position: getValue(dataView, "legend", "position", "rightCenter")
            },
            dataLabels: {
                show: getValue(dataView, "dataLabels", "show", true),
                color: getValue(dataView, "dataLabels", "color", "#333333"),
                fontSize: getValue(dataView, "dataLabels", "fontSize", 12),
                showValue: getValue(dataView, "dataLabels", "showValue", true),
                showPercent: getValue(dataView, "dataLabels", "showPercent", true),
                position: getValue(dataView, "dataLabels", "position", "inside"),
                percentDecimals: this.clampValue(
                    getValue(dataView, "dataLabels", "percentDecimals", 1),
                    CONSTANTS.LIMITS.MIN_PERCENT_DECIMALS,
                    CONSTANTS.LIMITS.MAX_PERCENT_DECIMALS
                )
            },
            donut: {
                innerRadius: this.clampValue(
                    getValue(dataView, "donut", "innerRadius", 60),
                    CONSTANTS.LIMITS.MIN_INNER_RADIUS,
                    CONSTANTS.LIMITS.MAX_INNER_RADIUS
                ),
                showBorders: getValue(dataView, "donut", "showBorders", false)
            },
            colors: {
                categoryColors: getValue(dataView, "colors", "categoryColors", {})
            }
        };
    }

    private clampValue(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private renderDonutChart(layout: LayoutDimensions): void {
    // Cria grupo principal
        const mainGroup = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "g");
        mainGroup.setAttribute("transform", `translate(${layout.centerX}, ${layout.centerY})`);
        this.svg.appendChild(mainGroup);

        // Verifica se temos destaques (dados filtrados)
        const hasHighlights = this.data.some(d => d.highlighted);
        
        // Sempre mostra TODOS os dados (como o donut original), mas usa transparência para os destaques
        const allData = this.data.filter(d => d.value > 0);
            
        // Se não houver dados, mostra mensagem
        if (allData.length === 0) {
            return;
        }

    // Calcula total usando valores originais para proporções
        const originalTotal = allData.reduce((sum, d) => sum + d.value, 0);
        
    let currentAngle = -Math.PI / 2; // Começa no topo

    // Maximiza o tamanho do círculo - usa quase todo o espaço disponível
        const outerRadius = layout.radius * CONSTANTS.LAYOUT.OUTER_RADIUS_RATIO;
        const safeInnerRadius = this.clampValue(
            this.settings.donut.innerRadius,
            CONSTANTS.LIMITS.MIN_INNER_RADIUS,
            CONSTANTS.LIMITS.MAX_INNER_RADIUS
        );
        const innerRadius = outerRadius * (safeInnerRadius / 100);
        
    // Garante espessura mínima para evitar que fatias desapareçam
        const minimumThickness = outerRadius * CONSTANTS.LAYOUT.MINIMUM_THICKNESS_RATIO;
        const actualInnerRadius = Math.min(innerRadius, outerRadius - minimumThickness);

    // Cria fatias usando TODOS os dados (sempre mostra o donut completo)
        allData.forEach((dataPoint, index) => {
            // Sempre usa o valor original para o tamanho da fatia (como o donut original)
            const sliceAngle = (dataPoint.value / originalTotal) * 2 * Math.PI;
            const endAngle = currentAngle + sliceAngle;

            this.createSlice(mainGroup, dataPoint, index, currentAngle, endAngle, actualInnerRadius, outerRadius, hasHighlights, originalTotal);

            currentAngle = endAngle;
        });

    // Adiciona total no centro
        if (this.settings.total.show) {
            this.renderCenterTotal(mainGroup, hasHighlights, originalTotal);
        }

    // Adiciona legenda
        if (this.settings.legend.show) {
            this.renderLegend(layout, hasHighlights, allData);
        }

    // Adiciona handler de clique no fundo para limpar seleção
        this.addBackgroundClickHandler(hasHighlights);
    }

    private createSlice(
        mainGroup: SVGGElement, 
        dataPoint: DonutChartDataPoint, 
        index: number, 
        startAngle: number, 
        endAngle: number, 
        innerRadius: number, 
        outerRadius: number, 
        hasHighlights: boolean, 
        originalTotal: number
    ): void {
        // Create slice group
        const sliceGroup = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "g");
        sliceGroup.setAttribute("class", "slice");
        // Explicitly set default cursor to prevent pointer cursor
        sliceGroup.style.cursor = "default";

        // Main slice path
        const mainPath = this.createArcPath(startAngle, endAngle, innerRadius, outerRadius);
        const pathElement = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "path");
        pathElement.setAttribute("d", mainPath);
        pathElement.setAttribute("fill", this.getCategoryColor(dataPoint.category, dataPoint.color));
        pathElement.setAttribute("stroke", CONSTANTS.STYLING.STROKE_COLOR);
        pathElement.setAttribute("stroke-width", this.settings.donut.showBorders ? CONSTANTS.STYLING.STROKE_WIDTH : "0");
        
        // Apply transparency effects for highlights
        this.applyHighlightEffects(pathElement, dataPoint, index, innerRadius, outerRadius, hasHighlights);
        
        // Add smooth transitions
        pathElement.style.transition = CONSTANTS.ANIMATION.TRANSITION_DURATION;

    // Adiciona funcionalidade de seleção
        this.addSliceSelectionHandlers(pathElement, dataPoint, hasHighlights);

        sliceGroup.appendChild(pathElement);
        
        // Add data labels if enabled
        if (this.settings.dataLabels.show) {
            this.addDataLabel(sliceGroup, dataPoint, startAngle, endAngle, innerRadius, outerRadius, hasHighlights, originalTotal);
        }
        
        mainGroup.appendChild(sliceGroup);
    }

    private applyHighlightEffects(
        pathElement: SVGPathElement, 
        dataPoint: DonutChartDataPoint, 
        index: number, 
        innerRadius: number, 
        outerRadius: number, 
        hasHighlights: boolean
    ): void {
        if (!hasHighlights) {
            pathElement.style.opacity = CONSTANTS.LIMITS.FULL_OPACITY.toString();
            return;
        }

        const maskId = `verticalMask-${index}`;
        
        // Create defs if it doesn't exist
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "defs");
            this.svg.appendChild(defs);
        }
        
        // Remove existing mask with same ID
        const existingMask = defs.querySelector(`#${maskId}`);
        if (existingMask) {
            existingMask.remove();
        }
        
        if (dataPoint.highlighted && dataPoint.highlightValue !== undefined && dataPoint.highlightValue > 0) {
            this.createHighlightMask(defs, maskId, dataPoint, index, innerRadius, outerRadius);
        } else {
            this.createFadedMask(defs, maskId, outerRadius);
        }
        
        pathElement.setAttribute("mask", `url(#${maskId})`);
    }

    private createHighlightMask(
        defs: SVGDefsElement, 
        maskId: string, 
        dataPoint: DonutChartDataPoint, 
        index: number, 
        innerRadius: number, 
        outerRadius: number
    ): void {
        const proportion = Math.max(0, Math.min(1, dataPoint.highlightValue! / dataPoint.value));
        
        // Create a radial gradient mask that considers inner and outer radius
        const mask = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "mask");
        mask.setAttribute("id", maskId);
        
        // Create radial gradient that maps to the donut ring
        const gradientId = `donutGradient-${index}`;
        const existingGradient = defs.querySelector(`#${gradientId}`);
        if (existingGradient) {
            existingGradient.remove();
        }
        
        const gradient = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "radialGradient");
        gradient.setAttribute("id", gradientId);
        gradient.setAttribute("cx", "50%");
        gradient.setAttribute("cy", "50%");
        gradient.setAttribute("r", "50%");
        gradient.setAttribute("gradientUnits", "objectBoundingBox");
        gradient.setAttribute("spreadMethod", "pad");
        
        // High quality gradient with more stops for smoother transitions
        const innerRadiusPercent = (innerRadius / outerRadius) * 100;
        const outerRadiusPercent = 100;
        const ringSpan = outerRadiusPercent - innerRadiusPercent;
        const visibleRingPercent = proportion * ringSpan;
        const transitionPoint = innerRadiusPercent + visibleRingPercent;
        
        // Create gradient stops
        this.createGradientStops(gradient, innerRadiusPercent, transitionPoint, outerRadiusPercent);
        
        defs.appendChild(gradient);
        
        // Apply gradient to a circle that covers the entire donut
        const circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "circle");
        circle.setAttribute("cx", "0");
        circle.setAttribute("cy", "0");
        circle.setAttribute("r", outerRadius.toString());
        circle.setAttribute("fill", `url(#${gradientId})`);
        mask.appendChild(circle);
        
        defs.appendChild(mask);
    }

    private createFadedMask(defs: SVGDefsElement, maskId: string, outerRadius: number): void {
        const mask = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "mask");
        mask.setAttribute("id", maskId);
        
        const rect = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "rect");
        rect.setAttribute("x", (-outerRadius * 2).toString());
        rect.setAttribute("y", (-outerRadius * 2).toString());
        rect.setAttribute("width", (outerRadius * 4).toString());
        rect.setAttribute("height", (outerRadius * 4).toString());
        rect.setAttribute("fill", "white");
        rect.setAttribute("opacity", CONSTANTS.LIMITS.FADE_OPACITY.toString());
        mask.appendChild(rect);
        
        defs.appendChild(mask);
    }

    private createGradientStops(
        gradient: SVGRadialGradientElement, 
        innerRadiusPercent: number, 
        transitionPoint: number, 
        outerRadiusPercent: number
    ): void {
        const transitionWidth = 1; // Smaller transition zone for higher quality
        
        // Transparent center
        const stop0 = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "stop");
        stop0.setAttribute("offset", "0%");
        stop0.setAttribute("stop-color", "white");
        stop0.setAttribute("stop-opacity", "0");
        gradient.appendChild(stop0);
        
        // Sharp start of ring
        const stop1a = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "stop");
        stop1a.setAttribute("offset", `${Math.max(0, innerRadiusPercent - 0.1)}%`);
        stop1a.setAttribute("stop-color", "white");
        stop1a.setAttribute("stop-opacity", "0");
        gradient.appendChild(stop1a);
        
        const stop1b = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "stop");
        stop1b.setAttribute("offset", `${innerRadiusPercent}%`);
        stop1b.setAttribute("stop-color", "white");
        stop1b.setAttribute("stop-opacity", "1");
        gradient.appendChild(stop1b);
        
        // Multiple stops for visible area to ensure smooth quality
        const visibleSteps = 3;
        for (let i = 0; i <= visibleSteps; i++) {
            const stepPercent = innerRadiusPercent + (i / visibleSteps) * (transitionPoint - transitionWidth - innerRadiusPercent);
            const stop = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "stop");
            stop.setAttribute("offset", `${Math.min(stepPercent, transitionPoint - transitionWidth)}%`);
            stop.setAttribute("stop-color", "white");
            stop.setAttribute("stop-opacity", "1");
            gradient.appendChild(stop);
        }
        
        // Smooth transition area
        const transitionSteps = 5;
        for (let i = 0; i <= transitionSteps; i++) {
            const stepPercent = (transitionPoint - transitionWidth) + (i / transitionSteps) * (transitionWidth * 2);
            const opacity = 1 - (i / transitionSteps) * 0.7; // Fade from 1 to 0.3
            const stop = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "stop");
            stop.setAttribute("offset", `${Math.min(stepPercent, outerRadiusPercent)}%`);
            stop.setAttribute("stop-color", "white");
            stop.setAttribute("stop-opacity", opacity.toString());
            gradient.appendChild(stop);
        }
        
        // End of ring
        const stop4 = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "stop");
        stop4.setAttribute("offset", `${outerRadiusPercent}%`);
        stop4.setAttribute("stop-color", "white");
        stop4.setAttribute("stop-opacity", CONSTANTS.LIMITS.FADE_OPACITY.toString());
        gradient.appendChild(stop4);
    }

    private addSliceSelectionHandlers(pathElement: SVGPathElement, dataPoint: DonutChartDataPoint, hasHighlights: boolean): void {
        // Store selection state for this path - use original data index
        const originalIndex = this.data.findIndex(d => d.selectionId.equals(dataPoint.selectionId));
        pathElement.setAttribute("data-selection-id", originalIndex.toString());

        // Add click event listener with improved responsiveness
        pathElement.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent any default behavior
            // Handle selection immediately without setTimeout delay
            this.handleSliceSelection(originalIndex, hasHighlights, dataPoint.selectionId);
        });
    }

    private handleSliceSelection(originalIndex: number, hasHighlights: boolean, selectionId: ISelectionId): void {
        // Check if this item is already selected
        const isCurrentlySelected = this.currentSelectedIndex === originalIndex;
        
        if (isCurrentlySelected) {
            // Toggle OFF - remove selection and clear filter
            this.currentSelectedIndex = -1;
            this.selectionManager.clear();
            
            // Reset all visual selections if no highlights
            if (!hasHighlights) {
                this.resetAllPathOpacity();
            }
        } else {
            // Toggle ON - select this item
            this.currentSelectedIndex = originalIndex;
            
            // Handle Power BI selection first for better responsiveness
            this.selectionManager.select(selectionId, false);
            
            // Clear all previous selections visually
            if (!hasHighlights) {
                this.fadeAllPaths();
                // Highlight only the clicked item
                const clickedPath = this.svg.querySelector(`path[data-selection-id="${originalIndex}"]`) as SVGPathElement;
                if (clickedPath) {
                    clickedPath.style.opacity = CONSTANTS.LIMITS.FULL_OPACITY.toString();
                }
            }
        }
    }

    private resetAllPathOpacity(): void {
        const allPaths = this.svg.querySelectorAll('path[data-selection-id]');
        allPaths.forEach(path => {
            (path as SVGPathElement).style.opacity = String(CONSTANTS.LIMITS.FULL_OPACITY);
        });
    }

    private fadeAllPaths(): void {
        const allPaths = this.svg.querySelectorAll('path[data-selection-id]');
        allPaths.forEach(path => {
            (path as SVGPathElement).style.opacity = String(CONSTANTS.LIMITS.FADE_OPACITY);
        });
    }

    private addDataLabel(
        sliceGroup: SVGGElement,
        dataPoint: DonutChartDataPoint,
        startAngle: number,
        endAngle: number,
        innerRadius: number,
        outerRadius: number,
        hasHighlights: boolean,
        originalTotal: number
    ): void {
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        let labelX: number, labelY: number;
        
        if (this.settings.dataLabels.position === "outside") {
            // Calculate curved line positions
            const lineBendRadius = outerRadius + (outerRadius * CONSTANTS.LAYOUT.LINE_BEND_RATIO);
            const bendX = Math.cos(midAngle) * lineBendRadius;
            const bendY = Math.sin(midAngle) * lineBendRadius;
            
            // Determine horizontal direction based on angle
            const isRightSide = Math.cos(midAngle) > 0;
            const horizontalLength = outerRadius * CONSTANTS.LAYOUT.HORIZONTAL_LINE_RATIO;
            const lineEndX = bendX + (isRightSide ? horizontalLength : -horizontalLength);
            
            labelX = lineEndX + (isRightSide ? CONSTANTS.LAYOUT.LABEL_OFFSET : -CONSTANTS.LAYOUT.LABEL_OFFSET);
            labelY = bendY;
            
            // Create L-shaped leader line
            this.createLeaderLine(sliceGroup, midAngle, outerRadius, bendX, bendY, lineEndX);
        } else {
            // Internal position (center of ring)
            const labelRadius = (innerRadius + outerRadius) / 2;
            labelX = Math.cos(midAngle) * labelRadius;
            labelY = Math.sin(midAngle) * labelRadius;
        }
        
        // Use filtered values when highlights exist, original values otherwise
        const displayValue = hasHighlights && dataPoint.highlighted ? 
            (dataPoint.highlightValue || 0) : dataPoint.value;
            
        // Calculate percentage relative to original total (not filtered total)
        const percentage = ((dataPoint.value / originalTotal) * 100).toFixed(this.settings.dataLabels.percentDecimals);
        
        // For highlighted items, also show filtered percentage
        const filteredPercentage = hasHighlights && dataPoint.highlighted && dataPoint.highlightValue ? 
            ((dataPoint.highlightValue / originalTotal) * 100).toFixed(this.settings.dataLabels.percentDecimals) : percentage;
        
        // Create label text with improved formatting
        const labelText = this.formatLabelText(displayValue, percentage, filteredPercentage, hasHighlights, dataPoint);
        
        if (labelText) {
            this.createLabelElement(sliceGroup, labelX, labelY, labelText, midAngle, hasHighlights, dataPoint);
        }
    }

    private createLeaderLine(
        sliceGroup: SVGGElement,
        midAngle: number,
        outerRadius: number,
        bendX: number,
        bendY: number,
        lineEndX: number
    ): void {
        const lineStartRadius = outerRadius + CONSTANTS.LAYOUT.LINE_START_OFFSET;
        const path = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "path");
        const startX = Math.cos(midAngle) * lineStartRadius;
        const startY = Math.sin(midAngle) * lineStartRadius;
        
        const pathData = `M ${startX} ${startY} L ${bendX} ${bendY} L ${lineEndX} ${bendY}`;
        path.setAttribute("d", pathData);
        path.setAttribute("stroke", "#CCCCCC");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("fill", "none");
        path.style.pointerEvents = "none";
        sliceGroup.appendChild(path);
    }

    private formatLabelText(
        displayValue: number,
        percentage: string,
        filteredPercentage: string,
        hasHighlights: boolean,
        dataPoint: DonutChartDataPoint
    ): string {
        let labelText = "";
        if (this.settings.dataLabels.showValue && this.settings.dataLabels.showPercent) {
            // Format: "Value (Percent%)" - like the original
            if (hasHighlights && dataPoint.highlighted && dataPoint.highlightValue !== dataPoint.value) {
                labelText = `${displayValue.toLocaleString()} (${filteredPercentage}%)`;
            } else {
                labelText = `${displayValue.toLocaleString()} (${percentage}%)`;
            }
        } else if (this.settings.dataLabels.showValue) {
            labelText = displayValue.toLocaleString();
        } else if (this.settings.dataLabels.showPercent) {
            labelText = hasHighlights && dataPoint.highlighted ? `${filteredPercentage}%` : `${percentage}%`;
        }
        return labelText;
    }

    private createLabelElement(
        sliceGroup: SVGGElement,
        labelX: number,
        labelY: number,
        labelText: string,
        midAngle: number,
        hasHighlights: boolean,
        dataPoint: DonutChartDataPoint
    ): void {
        const labelElement = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
        labelElement.setAttribute("x", labelX.toString());
        labelElement.setAttribute("y", labelY.toString());
        
        // Adjust text alignment based on position for external labels
        if (this.settings.dataLabels.position === "outside") {
            const isRightSide = Math.cos(midAngle) > 0;
            labelElement.setAttribute("text-anchor", isRightSide ? "start" : "end");
        } else {
            labelElement.setAttribute("text-anchor", "middle");
        }
        
        labelElement.setAttribute("dominant-baseline", "middle");
        labelElement.style.fontSize = `${this.settings.dataLabels.fontSize}px`;
        labelElement.style.fill = this.settings.dataLabels.color;
        labelElement.style.fontWeight = "bold";
        labelElement.style.pointerEvents = "none";
        
        labelElement.textContent = labelText;
        
        // Apply same proportional opacity as slice for highlights
        if (hasHighlights) {
            if (dataPoint.highlighted && dataPoint.highlightValue !== undefined) {
                // Calculate same proportional opacity as the slice
                const proportion = dataPoint.highlightValue / dataPoint.value;
                const opacity = Math.max(CONSTANTS.LIMITS.FADE_OPACITY, Math.min(CONSTANTS.LIMITS.FULL_OPACITY, CONSTANTS.LIMITS.FADE_OPACITY + (proportion * 0.7))).toFixed(2);
                labelElement.style.opacity = opacity;
            } else {
                labelElement.style.opacity = CONSTANTS.LIMITS.FADE_OPACITY.toString();
            }
        }
        
        sliceGroup.appendChild(labelElement);
    }

    private renderCenterTotal(mainGroup: SVGGElement, hasHighlights: boolean, originalTotal: number): void {
        // Calculate display total: use highlight total when filtered, original total otherwise
        const displayTotal = hasHighlights ? 
            this.data.filter(d => d.highlighted).reduce((sum, d) => sum + (d.highlightValue || 0), 0) :
            originalTotal;

        const totalText = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
        totalText.setAttribute("text-anchor", "middle");
        totalText.setAttribute("dominant-baseline", "middle");
        totalText.style.fontSize = `${this.settings.total.fontSize}px`;
        totalText.style.fontWeight = "bold";
        totalText.style.fill = this.settings.total.color;
        totalText.style.pointerEvents = "none";
        totalText.textContent = displayTotal.toLocaleString();
        mainGroup.appendChild(totalText);

        const labelText = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
        labelText.setAttribute("text-anchor", "middle");
        labelText.setAttribute("dominant-baseline", "middle");
        labelText.setAttribute("dy", "1.5em");
        labelText.style.fontSize = `${this.settings.total.fontSize * 0.5}px`;
        labelText.style.fill = this.settings.total.color;
        labelText.style.pointerEvents = "none";
        labelText.textContent = this.settings.total.label;
        mainGroup.appendChild(labelText);
    }

    private renderLegend(layout: LayoutDimensions, hasHighlights: boolean, allData: DonutChartDataPoint[]): void {
        if (!this.settings?.legend?.show || allData.length === 0) return;
        
        const position = this.settings.legend.position;
        const legendPositions = this.calculateLegendPosition(layout, position);
        
        // Calculate available space more accurately with priority system
        const maxItems = this.calculateMaxLegendItems(layout, position);
        
        // Implement smart truncation like native Power BI visuals
        const { itemsToShow, showMoreIndicator } = this.calculateLegendItems(allData.length, maxItems, layout);
        
        // Show all items if they fit, otherwise show as many as possible
        const displayItems = allData.slice(0, itemsToShow);

        // Only vertical layout for leftCenter and rightCenter
        this.renderVerticalLegend(displayItems, legendPositions, hasHighlights, layout);
        
        // Add indicator if some legend items were cut off
        if (showMoreIndicator && allData.length > itemsToShow) {
            this.renderMoreIndicator(legendPositions, itemsToShow, allData.length - itemsToShow, position);
        }
    }

    private calculateLegendPosition(layout: LayoutDimensions, position: string): { x: number, y: number, width: number, height: number } {
        const legendWidth = this.getResponsiveLegendWidth({ width: layout.width, height: layout.height });
        const legendHeight = this.estimateLegendHeight();
        const padding = 10;
        
        // Left position - at the left edge of viewport, slightly higher
        if (position === "leftCenter") {
            return {
                x: padding, // At left edge
                y: layout.centerY - legendHeight / 2 - 15, // Move up 15px
                width: legendWidth,
                height: legendHeight
            };
        }
        // Right position - at the right edge of viewport, slightly higher
        else {
            return {
                x: layout.width - legendWidth - padding, // At right edge
                y: layout.centerY - legendHeight / 2 - 15, // Move up 15px
                width: legendWidth,
                height: legendHeight
            };
        }
    }

    private calculateTextWidth(text: string, fontSize: number): number {
        // Approximation: average character width is about 0.6 * fontSize for most fonts
        // Add some padding for safety
        return text.length * fontSize * 0.6 + 5;
    }

    private calculateMaxLegendItems(layout: LayoutDimensions, position: string): number {
        // Only vertical layout for leftCenter and rightCenter
        const availableHeight = layout.chartHeight;
        return Math.floor(availableHeight / CONSTANTS.LAYOUT.LEGEND_ITEM_HEIGHT);
    }

    private calculateLegendItems(totalItems: number, maxPossibleItems: number, layout: LayoutDimensions): { itemsToShow: number, showMoreIndicator: boolean } {
        // Smart truncation algorithm - progressively show fewer items as space decreases
        if (totalItems <= maxPossibleItems) {
            return { itemsToShow: totalItems, showMoreIndicator: false };
        }
        
        // Always reserve space for "more" indicator when truncating
        const availableForItems = Math.max(1, maxPossibleItems - 1);
        
        // Priority-based showing: if very limited space, show at least key items
        if (layout.height < 200) {
            return { itemsToShow: Math.min(3, availableForItems), showMoreIndicator: true };
        } else if (layout.height < 400) {
            return { itemsToShow: Math.min(5, availableForItems), showMoreIndicator: true };
        }
        
        return { itemsToShow: availableForItems, showMoreIndicator: true };
    }

    private renderVerticalLegend(displayItems: DonutChartDataPoint[], legendPos: { x: number, y: number, width: number, height: number }, hasHighlights: boolean, layout: LayoutDimensions): void {
        displayItems.forEach((dataPoint, index) => {
            const legendY = legendPos.y + index * CONSTANTS.LAYOUT.LEGEND_ITEM_HEIGHT;

            // Legend group
            const legendGroup = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "g");
            legendGroup.setAttribute("class", "legend-item");
            legendGroup.style.cursor = "default";
            legendGroup.style.transition = CONSTANTS.ANIMATION.LEGEND_TRANSITION;

            // Legend circle
            const circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "circle");
            circle.setAttribute("cx", legendPos.x.toString());
            circle.setAttribute("cy", legendY.toString());
            circle.setAttribute("r", CONSTANTS.LAYOUT.LEGEND_CIRCLE_RADIUS.toString());
            circle.setAttribute("fill", this.getCategoryColor(dataPoint.category, dataPoint.color));
            
            if (hasHighlights) {
                circle.style.opacity = dataPoint.highlighted ? CONSTANTS.LIMITS.FULL_OPACITY.toString() : CONSTANTS.LIMITS.FADE_OPACITY.toString();
            }

            // Legend text
            const text = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
            text.setAttribute("x", (legendPos.x + CONSTANTS.LAYOUT.LEGEND_TEXT_OFFSET).toString());
            text.setAttribute("y", legendY.toString());
            text.setAttribute("dy", "0.35em");
            text.style.fontSize = `${this.settings.legend.fontSize}px`;
            text.style.fill = this.settings.legend.color;
            text.style.fontWeight = dataPoint.highlighted ? "bold" : "normal";
            
            let displayText = dataPoint.category;
            if (displayText.length > CONSTANTS.STYLING.MAX_LEGEND_TEXT_LENGTH) {
                displayText = displayText.substring(0, CONSTANTS.STYLING.MAX_LEGEND_TEXT_LENGTH) + "...";
            }
            text.textContent = displayText;

            // Event listeners
            this.addLegendEventListeners(legendGroup, dataPoint);

            legendGroup.appendChild(circle);
            legendGroup.appendChild(text);
            this.svg.appendChild(legendGroup);
        });
    }

    private renderHorizontalLegend(displayItems: DonutChartDataPoint[], legendPos: { x: number, y: number, width: number, height: number }, hasHighlights: boolean, layout: LayoutDimensions): void {
        const fontSize = this.settings.legend.position.startsWith("top") ? 
            Math.max(8, this.settings.legend.fontSize - 2) : this.settings.legend.fontSize;
        
        // Simple approach: divide available width equally among items
        const availableWidth = legendPos.width - 20; // 10px margin on each side
        const itemWidth = Math.floor(availableWidth / displayItems.length);
        const minItemWidth = 50; // Minimum width per item
        
        // If items would be too narrow, reduce number of items shown
        const effectiveItemWidth = Math.max(minItemWidth, itemWidth);
        
        displayItems.forEach((dataPoint, index) => {
            const legendX = legendPos.x + 10 + (index * effectiveItemWidth); // Start with 10px margin
            
            // Skip if this item would go beyond available space
            if (legendX + effectiveItemWidth > legendPos.x + legendPos.width - 10) {
                return;
            }

            // Legend group
            const legendGroup = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "g");
            legendGroup.setAttribute("class", "legend-item");
            legendGroup.style.cursor = "default";
            legendGroup.style.transition = CONSTANTS.ANIMATION.LEGEND_TRANSITION;

            // Legend circle
            const circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "circle");
            circle.setAttribute("cx", legendX.toString());
            circle.setAttribute("cy", legendPos.y.toString());
            circle.setAttribute("r", CONSTANTS.LAYOUT.LEGEND_CIRCLE_RADIUS.toString());
            circle.setAttribute("fill", this.getCategoryColor(dataPoint.category, dataPoint.color));
            
            if (hasHighlights) {
                circle.style.opacity = dataPoint.highlighted ? CONSTANTS.LIMITS.FULL_OPACITY.toString() : CONSTANTS.LIMITS.FADE_OPACITY.toString();
            }

            // Legend text
            const text = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
            text.setAttribute("x", (legendX + CONSTANTS.LAYOUT.LEGEND_TEXT_OFFSET).toString());
            text.setAttribute("y", legendPos.y.toString());
            text.setAttribute("dy", "0.35em");
            text.style.fontSize = `${fontSize}px`;
            text.style.fill = this.settings.legend.color;
            text.style.fontWeight = dataPoint.highlighted ? "bold" : "normal";
            
            // Truncate text to fit available space
            let displayText = dataPoint.category;
            const maxTextWidth = effectiveItemWidth - CONSTANTS.LAYOUT.LEGEND_CIRCLE_RADIUS * 2 - CONSTANTS.LAYOUT.LEGEND_TEXT_OFFSET - 5;
            
            // Conservative character estimation: 6px per character
            const maxChars = Math.floor(maxTextWidth / 6);
            if (displayText.length > maxChars && maxChars > 3) {
                displayText = displayText.substring(0, maxChars - 3) + "...";
            } else if (maxChars <= 3) {
                displayText = displayText.substring(0, 1) + "..";
            }
            
            text.textContent = displayText;

            // Event listeners
            this.addLegendEventListeners(legendGroup, dataPoint);

            legendGroup.appendChild(circle);
            legendGroup.appendChild(text);
            this.svg.appendChild(legendGroup);
        });
    }

    private renderMoreIndicator(legendPos: { x: number, y: number, width: number, height: number }, itemsShown: number, remainingItems: number, position: string): void {
        const moreText = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
        
        if (position.startsWith("top")) {
            // Horizontal layout
            const itemWidth = Math.min(100, legendPos.width / (itemsShown + 1));
            moreText.setAttribute("x", (legendPos.x + itemsShown * itemWidth).toString());
            moreText.setAttribute("y", legendPos.y.toString());
        } else {
            // Vertical layout
            moreText.setAttribute("x", (legendPos.x + CONSTANTS.LAYOUT.LEGEND_TEXT_OFFSET).toString());
            moreText.setAttribute("y", (legendPos.y + itemsShown * CONSTANTS.LAYOUT.LEGEND_ITEM_HEIGHT).toString());
        }
        
        moreText.setAttribute("dy", "0.35em");
        moreText.style.fontSize = `${this.settings.legend.fontSize - 1}px`;
        moreText.style.fill = "#999";
        moreText.style.fontStyle = "italic";
        moreText.textContent = `... +${remainingItems} mais`;
        this.svg.appendChild(moreText);
    }

    private addLegendEventListeners(legendGroup: SVGGElement, dataPoint: DonutChartDataPoint): void {
        legendGroup.addEventListener("mouseenter", () => {
            if (this.settings.legend.position.startsWith("top")) {
                legendGroup.style.transform = "translateY(-3px)";
            } else {
                legendGroup.style.transform = "translateX(3px)";
            }
        });

        legendGroup.addEventListener("mouseleave", () => {
            legendGroup.style.transform = "translate(0)";
        });

        legendGroup.addEventListener("click", (event) => {
            event.stopPropagation();
            this.selectionManager.select(dataPoint.selectionId, event.ctrlKey || event.metaKey);
        });
    }

    private getCategoryColor(category: string, defaultColor: string): string {
        return this.settings.colors.categoryColors[category] ?? defaultColor;
    }

    private addBackgroundClickHandler(hasHighlights: boolean): void {
        this.svg.addEventListener("click", (event) => {
            if (event.target === this.svg) {
                // Reset selection state
                this.currentSelectedIndex = -1;
                
                // Clear Power BI selection
                this.selectionManager.clear();
                
                // Reset all visual selections if no highlights
                if (!hasHighlights) {
                    this.resetAllPathOpacity();
                }
            }
        });
    }

    private createArcPath(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number): string {
        const angleDiff = endAngle - startAngle;
        
        // Handle full circle case (360 degrees or close to it)
        if (Math.abs(angleDiff - 2 * Math.PI) < CONSTANTS.LIMITS.FULL_CIRCLE_THRESHOLD) {
            // Create full circle using two semicircles
            const midAngle = startAngle + Math.PI;
            
            const x1 = Math.cos(startAngle) * outerRadius;
            const y1 = Math.sin(startAngle) * outerRadius;
            const x2 = Math.cos(midAngle) * outerRadius;
            const y2 = Math.sin(midAngle) * outerRadius;
            const x3 = Math.cos(startAngle) * outerRadius;
            const y3 = Math.sin(startAngle) * outerRadius;
            
            const x4 = Math.cos(startAngle) * innerRadius;
            const y4 = Math.sin(startAngle) * innerRadius;
            const x5 = Math.cos(midAngle) * innerRadius;
            const y5 = Math.sin(midAngle) * innerRadius;
            
            return [
                "M", x1, y1,
                "A", outerRadius, outerRadius, 0, 0, 1, x2, y2,
                "A", outerRadius, outerRadius, 0, 0, 1, x3, y3,
                "L", x4, y4,
                "A", innerRadius, innerRadius, 0, 0, 0, x5, y5,
                "A", innerRadius, innerRadius, 0, 0, 0, x4, y4,
                "Z"
            ].join(" ");
        }
        
    // Arco regular
        const largeArcFlag = angleDiff <= Math.PI ? "0" : "1";

        const x1 = Math.cos(startAngle) * outerRadius;
        const y1 = Math.sin(startAngle) * outerRadius;
        const x2 = Math.cos(endAngle) * outerRadius;
        const y2 = Math.sin(endAngle) * outerRadius;
        const x3 = Math.cos(endAngle) * innerRadius;
        const y3 = Math.sin(endAngle) * innerRadius;
        const x4 = Math.cos(startAngle) * innerRadius;
        const y4 = Math.sin(startAngle) * innerRadius;

        return [
            "M", x1, y1,
            "A", outerRadius, outerRadius, 0, largeArcFlag, 1, x2, y2,
            "L", x3, y3,
            "A", innerRadius, innerRadius, 0, largeArcFlag, 0, x4, y4,
            "Z"
        ].join(" ");
    }

    private showMessage(message: string): void {
        // Remove todos os nós filhos com segurança em vez de usar innerHTML
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        
        const text = document.createElementNS(CONSTANTS.SVG_NAMESPACE, "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "50%");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.style.fontSize = "14px";
    text.style.fill = "#666";
    text.textContent = message;
        
        this.svg.appendChild(text);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const settings = this.settings || this.getDefaultSettings();

        const instances: VisualObjectInstance[] = [];

        switch (options.objectName) {
            case "total":
                instances.push({
                    objectName: "total",
                    properties: {
                        show: settings.total.show,
                        fontSize: settings.total.fontSize,
                        color: settings.total.color,
                        label: settings.total.label
                    },
                    selector: null
                });
                break;

            case "legend":
                instances.push({
                    objectName: "legend",
                    properties: {
                        show: settings.legend.show,
                        position: settings.legend.position,
                        fontSize: settings.legend.fontSize,
                        color: settings.legend.color
                    },
                    selector: null
                });
                break;


            case "dataLabels":
                instances.push({
                    objectName: "dataLabels",
                    properties: {
                        show: settings.dataLabels.show,
                        color: settings.dataLabels.color,
                        fontSize: settings.dataLabels.fontSize,
                        showValue: settings.dataLabels.showValue,
                        showPercent: settings.dataLabels.showPercent,
                        position: settings.dataLabels.position,
                        percentDecimals: settings.dataLabels.percentDecimals
                    },
                    selector: null
                });
                break;

            case "donut":
                instances.push({
                    objectName: "donut",
                    properties: {
                        innerRadius: settings.donut.innerRadius,
                        showBorders: settings.donut.showBorders
                    },
                    selector: null
                });
                break;

            case "dataPoint":
                this.data.forEach(d => {
                    instances.push({
                        objectName: "dataPoint",
                        displayName: d.category,
                        properties: { fill: { solid: { color: settings.colors.categoryColors[d.category] || d.color } } },
                        selector: d.selectionId.getSelector()
                    });
                });
                break;
        }

        return instances;
    }
}
