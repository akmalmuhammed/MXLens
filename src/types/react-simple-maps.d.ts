declare module "react-simple-maps" {
    import * as React from "react";

    export interface ComposableMapProps {
        width?: number;
        height?: number;
        projection?: string | ((geo: any) => any);
        projectionConfig?: any;
        className?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }

    export const ComposableMap: React.FC<ComposableMapProps>;

    export interface ZoomableGroupProps {
        center?: [number, number];
        zoom?: number;
        minZoom?: number;
        maxZoom?: number;
        translateExtent?: [[number, number], [number, number]];
        onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void;
        onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
        children?: React.ReactNode;
    }

    export const ZoomableGroup: React.FC<ZoomableGroupProps>;

    export interface GeographiesProps {
        geography?: string | Record<string, any> | string[];
        children: (args: { geographies: any[] }) => React.ReactNode;
    }

    export const Geographies: React.FC<GeographiesProps>;

    export interface GeographyProps {
        geography: any;
        fill?: string;
        stroke?: string;
        strokeWidth?: number | string;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onClick?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
        onMouseEnter?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
        onMouseLeave?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
        onMouseDown?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
        onMouseUp?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
        onFocus?: (event: React.FocusEvent<SVGPathElement>) => void;
        onBlur?: (event: React.FocusEvent<SVGPathElement>) => void;
        key?: string | number;
        className?: string;
    }

    export const Geography: React.FC<GeographyProps>;

    export interface MarkerProps {
        coordinates: [number, number];
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        children?: React.ReactNode;
        style?: React.CSSProperties;
        onClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
        onMouseEnter?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
        onMouseLeave?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
        className?: string;
    }

    export const Marker: React.FC<MarkerProps>;

    export interface LineProps {
        from: [number, number];
        to: [number, number];
        coordinates?: [number, number][];
        stroke?: string;
        strokeWidth?: number;
        strokeLinecap?: string;
        strokeOpacity?: number;
        strokeDasharray?: string;
        fill?: string;
        children?: React.ReactNode;
        style?: React.CSSProperties;
        className?: string;
    }

    export const Line: React.FC<LineProps>;

    export interface AnnotationProps {
        subject?: [number, number];
        dx?: number;
        dy?: number;
        connectorProps?: any;
        curve?: number;
        children?: React.ReactNode;
    }

    export const Annotation: React.FC<AnnotationProps>;
}
