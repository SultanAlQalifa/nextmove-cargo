declare module "react-simple-maps" {
  import * as React from "react";
  
  export interface ComposableMapProps extends React.SVGAttributes<SVGSVGElement> {
    projection?: string | Function;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      [key: string]: any;
    };
    width?: number;
    height?: number;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (position: any) => void;
    onMoveEnd?: (position: any) => void;
    translateExtent?: [[number, number], [number, number]];
    children?: React.ReactNode;
  }
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;

  export interface GeographiesProps {
    geography: string | Record<string, any> | string[];
    children?: (data: { geographies: any[] }) => React.ReactNode;
    parseGeographies?: (geographies: any[]) => any[];
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps extends React.SVGAttributes<SVGPathElement> {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    onMouseUp?: (e: React.MouseEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    opacity?: number;
  }
  export const Geography: React.FC<GeographyProps>;
}
