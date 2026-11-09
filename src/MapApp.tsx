import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapView,
  type AreaLevel,
  type BasemapMode,
  type BasemapStatus,
  type BoundaryStatus,
  type MapOverlayCategory,
  type SelectedArea
} from "./components/map/MapView";
import type { RwandaProjectRecord } from "./data/project-directory";
import type { GeoJSONSource, Map as MapLibreMapInstance } from "maplibre-gl";
import type { FeatureCollection, Feature, Geometry } from "geojson";

type ParentCommand =
  | { source: "taiseel-map-controls"; type: "basemap"; value: BasemapMode }
  | { source: "taiseel-map-controls"; type: "layer"; category: MapOverlayCategory; enabled: boolean }
  | { source: "taiseel-map-controls"; type: "zoning"; enabled: boolean }
  | { source: "taiseel-map-controls"; type: "draw"; enabled: boolean }
  | { source: "taiseel-map-controls"; type: "remove-boundary" };

type ParentEvent =
  | { source: "taiseel-map-engine"; type: "basemap-status"; status: BasemapStatus }
  | { source: "taiseel-map-engine"; type: "boundary-status"; status: BoundaryStatus }
  | { source: "taiseel-map-engine"; type: "draw-state"; enabled: boolean }
  | { source: "taiseel-map-engine"; type: "draw-complete" }
  | { source: "taiseel-map-engine"; type: "boundary-removed" }
  | { source: "taiseel-map-engine"; type: "area-selected"; area: {
      level: AreaLevel; name: string; district: string; sector: string | null;
      cell: string | null; village: string | null; upi: string | null;
      parcelNumber: string | null; parcelSizeM2: number | null; sourceLabel: string | null;
    } | null };

const NO_PROJECTS: RwandaProjectRecord[] = [];
const DRAW_SOURCE = "taiseel-drawn-boundary";
const DRAW_LINE = "taiseel-drawn-boundary-line";
const DRAW_FILL = "taiseel-drawn-boundary-fill";
const EMPTY_FEATURES: FeatureCollection = { type: "FeatureCollection", features: [] };

function notifyParent(event: ParentEvent) {
  if (window.parent !== window) window.parent.postMessage(event, window.location.origin);
}

function selectedAreaEvent(area: SelectedArea | null): ParentEvent {
  return {
    source: "taiseel-map-engine",
    type: "area-selected",
    area: area ? {
      level: area.level,
      name: area.name,
      district: area.district,
      sector: area.sector,
      cell: area.cell,
      village: area.village,
      upi: area.upi,
      parcelNumber: area.parcelNumber,
      parcelSizeM2: area.parcelSizeM2,
      sourceLabel: area.sourceLabel
    } : null
  };
}

function ensureDrawLayers(map: MapLibreMapInstance) {
  if (!map.getSource(DRAW_SOURCE)) {
    map.addSource(DRAW_SOURCE, { type: "geojson", data: EMPTY_FEATURES });
  }
  if (!map.getLayer(DRAW_FILL)) {
    map.addLayer({
      id: DRAW_FILL,
      type: "fill",
      source: DRAW_SOURCE,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": "#00b9e8", "fill-opacity": 0.10 }
    });
  }
  if (!map.getLayer(DRAW_LINE)) {
    map.addLayer({
      id: DRAW_LINE,
      type: "line",
      source: DRAW_SOURCE,
      paint: {
        "line-color": "#00a9d5",
        "line-width": 2.5,
        "line-dasharray": [2, 1.5]
      }
    });
  }
}

function updateDrawSource(map: MapLibreMapInstance, data: FeatureCollection) {
  const source = map.getSource(DRAW_SOURCE) as GeoJSONSource | undefined;
  source?.setData(data);
}

function boundaryFeature(coordinates: [number, number][]): Feature<Geometry> | null {
  if (coordinates.length < 3) return null;
  const closed = [...coordinates];
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first);
  return {
    type: "Feature",
    properties: { source: "user-drawn", confidence: "user-defined" },
    geometry: { type: "Polygon", coordinates: [closed] }
  };
}

export default function MapApp() {
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("map");
  const [showLayers, setShowLayers] = useState<MapOverlayCategory[]>(["landmarks"]);
  const [showZoning, setShowZoning] = useState(false);
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [basemapStatus, setBasemapStatus] = useState<BasemapStatus>("loading");
  const [boundaryStatus, setBoundaryStatus] = useState<BoundaryStatus>("loading");
  const [drawing, setDrawing] = useState(false);
  const mapRef = useRef<MapLibreMapInstance | null>(null);
  const drawingRef = useRef(false);
  const drawPointsRef = useRef<[number, number][]>([]);
  const onProjectSelected = useCallback(() => {}, []);

  const onMapReady = useCallback((map: MapLibreMapInstance | null) => {
    mapRef.current = map;
  }, []);

  const onBasemapStatus = useCallback((status: BasemapStatus) => {
    setBasemapStatus(status);
    notifyParent({ source: "taiseel-map-engine", type: "basemap-status", status });
  }, []);

  const onBoundaryStatus = useCallback((status: BoundaryStatus) => {
    setBoundaryStatus(status);
    notifyParent({ source: "taiseel-map-engine", type: "boundary-status", status });
  }, []);

  const onAreaSelected = useCallback((area: SelectedArea | null) => {
    setSelectedArea(area);
    notifyParent(selectedAreaEvent(area));
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ParentCommand>) => {
      if (event.origin !== window.location.origin || !event.data || event.data.source !== "taiseel-map-controls") return;
      const command = event.data;
      if (command.type === "basemap") setBasemapMode(command.value);
      if (command.type === "layer") {
        setShowLayers(current => command.enabled
          ? current.includes(command.category) ? current : [...current, command.category]
          : current.filter(category => category !== command.category));
      }
      if (command.type === "zoning") setShowZoning(command.enabled);
      if (command.type === "draw") {
        drawPointsRef.current = [];
        drawingRef.current = command.enabled;
        setDrawing(command.enabled);
        notifyParent({ source: "taiseel-map-engine", type: "draw-state", enabled: command.enabled });
      }
      if (command.type === "remove-boundary") {
        drawPointsRef.current = [];
        const map = mapRef.current;
        if (map?.isStyleLoaded()) updateDrawSource(map, EMPTY_FEATURES);
        drawingRef.current = false;
        setDrawing(false);
        notifyParent({ source: "taiseel-map-engine", type: "boundary-removed" });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    drawingRef.current = drawing;
    (window as Window & { __TAISEEL_DRAW_MODE__?: boolean }).__TAISEEL_DRAW_MODE__ = drawing;
    const map = mapRef.current;
    if (!map) return;
    if (drawing) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  }, [drawing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addDrawingLayers = () => ensureDrawLayers(map);
    if (map.isStyleLoaded()) addDrawingLayers();
    map.on("style.load", addDrawingLayers);

    const handleClick = (event: { lngLat: { lng: number; lat: number }; preventDefault: () => void }) => {
      if (!drawingRef.current) return;
      event.preventDefault();
      drawPointsRef.current = [...drawPointsRef.current, [event.lngLat.lng, event.lngLat.lat]];
      const points = drawPointsRef.current;
      const features: Feature<Geometry>[] = [];
      if (points.length >= 2) {
        const polygon = boundaryFeature(points);
        if (polygon) features.push(polygon);
        else features.push({
          type: "Feature",
          properties: { source: "user-drawn", confidence: "user-defined" },
          geometry: { type: "LineString", coordinates: points }
        });
      }
      updateDrawSource(map, { type: "FeatureCollection", features });
    };

    const handleDoubleClick = (event: { preventDefault: () => void }) => {
      if (!drawingRef.current || drawPointsRef.current.length < 3) return;
      event.preventDefault();
      const polygon = boundaryFeature(drawPointsRef.current);
      if (polygon) updateDrawSource(map, { type: "FeatureCollection", features: [polygon] });
      drawingRef.current = false;
      setDrawing(false);
      map.doubleClickZoom.enable();
      notifyParent({ source: "taiseel-map-engine", type: "draw-complete" });
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDoubleClick);
    return () => {
      map.off("style.load", addDrawingLayers);
      map.off("click", handleClick);
      map.off("dblclick", handleDoubleClick);
      map.doubleClickZoom.enable();
      delete (window as Window & { __TAISEEL_DRAW_MODE__?: boolean }).__TAISEEL_DRAW_MODE__;
    };
  }, [mapRef.current]);

  useEffect(() => {
    if (basemapStatus === "ready") notifyParent({ source: "taiseel-map-engine", type: "basemap-status", status: "ready" });
  }, [basemapStatus]);

  const isBoundaryReady = boundaryStatus === "ready";
  const areaLabel = selectedArea ? selectedArea.level[0].toUpperCase() + selectedArea.level.slice(1) : "";
  const areaPath = selectedArea ? [
    selectedArea.district,
    selectedArea.sector,
    selectedArea.cell,
    selectedArea.village
  ].filter(Boolean).join(" · ") : "";

  return (
    <main className="map-app-shell" aria-label="Rwanda Land Intelligence map">
      <MapView
        basemapMode={basemapMode}
        showLandPriceHeatmap
        selectedMetric="averageLandPricePerM2"
        showLayers={showLayers}
        showZoning={showZoning}
        showScope="pilot"
        onMapReady={onMapReady}
        onStatusChange={onBasemapStatus}
        onBoundaryStatusChange={onBoundaryStatus}
        onAreaSelected={onAreaSelected}
        selectedArea={selectedArea}
        projects={NO_PROJECTS}
        showProjects={false}
        selectedProjectId={null}
        onProjectSelected={onProjectSelected}
      />
      <div className="map-engine-status" aria-live="polite">
        <span className={"map-engine-status-dot " + (basemapStatus === "ready" ? "ready" : basemapStatus === "error" ? "error" : "loading")} />
        {basemapStatus === "loading" ? "Loading basemap…" : basemapStatus === "error" ? "Basemap unavailable" : ""}
        {!isBoundaryReady && boundaryStatus === "error" ? " · Boundary data unavailable" : ""}
      </div>
      {selectedArea && (
        <section className="map-selection-card" aria-label="Selected map area">
          <div className="map-selection-level">{areaLabel}</div>
          <strong>{selectedArea.name}</strong>
          <p>{areaPath || selectedArea.district}</p>
          {selectedArea.level === "parcel" ? (
            <div className="map-selection-evidence">
              {selectedArea.upi ? <span>UPI: {selectedArea.upi}</span> : null}
              {selectedArea.parcelSizeM2 ? <span>{selectedArea.parcelSizeM2.toLocaleString("en")} m²</span> : null}
              <small>{selectedArea.sourceLabel || "Cadastral source information not supplied"}</small>
            </div>
          ) : (
            <small>Administrative boundary · Not proof of parcel title or ownership</small>
          )}
          <button type="button" className="map-selection-close" onClick={() => onAreaSelected(null)} aria-label="Clear selected area">×</button>
        </section>
      )}
      {drawing && <div className="map-draw-hint">Click to draw a boundary. Double-click to finish.</div>}
      <span className="sr-only" role="status">{basemapStatus === "ready" && isBoundaryReady ? "Map and boundary data ready" : "Map loading"}</span>
    </main>
  );
}
