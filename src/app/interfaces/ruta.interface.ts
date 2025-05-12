export interface RouteResponse {
  type:     string;
  bbox:     number[];
  features: Feature[];
  metadata: Metadata;
}

export interface Feature {
  bbox:       number[];
  type:       string;
  properties: Properties;
  geometry:   Geometry;
}

export interface Geometry {
  coordinates: Array<number[]>;
  type:        string;
}

export interface Properties {
  segments:   Segment[];
  way_points: number[];
  summary:    Summary;
}

export interface Segment {
  distance: number;
  duration: number;
  steps:    Step[];
}

export interface Step {
  distance:    number;
  duration:    number;
  type:        number;
  instruction: string;
  name:        string;
  way_points:  number[];
}

export interface Summary {
  distance: number;
  duration: number;
}

export interface Metadata {
  attribution: string;
  service:     string;
  timestamp:   number;
  query:       Query;
  engine:      Engine;
}

export interface Engine {
  version:    string;
  build_date: Date;
  graph_date: Date;
}

export interface Query {
  coordinates: Array<number[]>;
  profile:     string;
  profileName: string;
  format:      string;
}
