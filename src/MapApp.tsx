import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  MapView,
  type AreaLevel,
  type BasemapMode,
  type BasemapStatus,
  type BoundaryStatus,
  type MapOverlayCategory,
  type ParcelSearchFilters,
  type ParcelInventoryStats,
  type ParcelUpiSearchRequest,
  type ParcelUpiSearchStatus,
  EMPTY_PARCEL_SEARCH_FILTERS,
  parcelPriceTypeLabel,
  type SelectedArea
} from "./components/map/MapView";
import type { RwandaProjectRecord } from "./data/project-directory";
import type { GeoJSONSource, Map as MapLibreMapInstance } from "maplibre-gl";
import type { FeatureCollection, Feature, Geometry } from "geojson";

type ParentCommand =
  | { source: "taiseel-map-controls"; type: "basemap"; value: BasemapMode }
  | { source: "taiseel-map-controls"; type: "layer"; category: MapOverlayCategory; enabled: boolean }
  | { source: "taiseel-map-controls"; type: "zoning"; enabled: boolean }
  | { source: "taiseel-map-controls"; type: "parcel-filters"; filters: ParcelSearchFilters }
  | { source: "taiseel-map-controls"; type: "draw"; enabled: boolean }
  | { source: "taiseel-map-controls"; type: "remove-boundary" };

type ParentEvent =
  | { source: "taiseel-map-engine"; type: "basemap-status"; status: BasemapStatus }
  | { source: "taiseel-map-engine"; type: "boundary-status"; status: BoundaryStatus }
  | { source: "taiseel-map-engine"; type: "parcel-inventory-stats"; stats: ParcelInventoryStats }
  | { source: "taiseel-map-engine"; type: "draw-state"; enabled: boolean }
  | { source: "taiseel-map-engine"; type: "draw-complete" }
  | { source: "taiseel-map-engine"; type: "boundary-removed" }
  | { source: "taiseel-map-engine"; type: "area-selected"; area: {
      level: AreaLevel; name: string; district: string; sector: string | null;
      cell: string | null; village: string | null; upi: string | null;
      parcelNumber: string | null; parcelSizeM2: number | null; sourceLabel: string | null;
      zoning: SelectedArea["zoning"]; zoningStatus: SelectedArea["zoningStatus"];
      zoningSource: SelectedArea["zoningSource"];
    } | null };

const NO_PROJECTS: RwandaProjectRecord[] = [];
const DRAW_SOURCE = "taiseel-drawn-boundary";
const DRAW_LINE = "taiseel-drawn-boundary-line";
const DRAW_FILL = "taiseel-drawn-boundary-fill";
const EMPTY_FEATURES: FeatureCollection = { type: "FeatureCollection", features: [] };

function formatRwf(value: number): string {
  return "RWF " + Math.round(value).toLocaleString("en");
}

function zoningStatusLabel(status: SelectedArea["zoningStatus"]): string {
  switch (status) {
    case "found": return "Matched in published planning data";
    case "not-covered": return "No zoning record published for this parcel";
    case "ambiguous": return "Overlapping records need review";
    case "error": return "The planning source returned an error";
    case "unavailable": return "Planning data is unavailable";
    case "loading": return "Planning data is loading";
    default: return "No parcel-level zoning result is available";
  }
}


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
      upi: area.upi ?? null,
      parcelNumber: area.parcelNumber ?? null,
      parcelSizeM2: area.parcelSizeM2 ?? null,
      sourceLabel: area.sourceLabel ?? null,
      zoning: area.zoning ?? null,
      zoningStatus: area.zoningStatus ?? null,
      zoningSource: area.zoningSource ?? null
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
  const [parcelFilters, setParcelFilters] = useState<ParcelSearchFilters>(EMPTY_PARCEL_SEARCH_FILTERS);
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [propertyProfileOpen, setPropertyProfileOpen] = useState(false);
  const [upiQuery, setUpiQuery] = useState("");
  const [parcelUpiSearch, setParcelUpiSearch] = useState<ParcelUpiSearchRequest | null>(null);
  const [upiSearchStatus, setUpiSearchStatus] = useState<ParcelUpiSearchStatus | null>(null);
  const upiSearchSequenceRef = useRef(0);
  const [basemapStatus, setBasemapStatus] = useState<BasemapStatus>("loading");
  const [boundaryStatus, setBoundaryStatus] = useState<BoundaryStatus>("loading");
  const [drawing, setDrawing] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapLibreMapInstance | null>(null);
  const mapRef = useRef<MapLibreMapInstance | null>(null);
  const drawingRef = useRef(false);
  const drawPointsRef = useRef<[number, number][]>([]);
  const onProjectSelected = useCallback(() => {}, []);

  const onMapReady = useCallback((map: MapLibreMapInstance | null) => {
    mapRef.current = map;
    setMapInstance(map);
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
    const matchesUpiSearch = area?.level === "parcel" &&
      Boolean(parcelUpiSearch?.upi) &&
      area.upi === parcelUpiSearch?.upi;
    setPropertyProfileOpen(matchesUpiSearch);
    notifyParent(selectedAreaEvent(area));
  }, [parcelUpiSearch]);

  const onParcelUpiSearchStatus = useCallback((status: ParcelUpiSearchStatus) => {
    setUpiSearchStatus(status);
  }, []);

  const submitParcelUpiSearch = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const upi = upiQuery.trim().replace(/\\s+/g, "");
    if (!/^\\d+(?:\\/\\d+){4}$/.test(upi)) {
      setUpiSearchStatus({
        state: "error",
        upi,
        message: "Enter a Rwanda UPI with five numeric parts separated by slashes."
      });
      return;
    }
    upiSearchSequenceRef.current += 1;
    setParcelFilters(EMPTY_PARCEL_SEARCH_FILTERS);
    setPropertyProfileOpen(false);
    setUpiSearchStatus({ state: "loading", upi, message: "Searching connected cadastral records…" });
    setParcelUpiSearch({ upi, requestId: upiSearchSequenceRef.current });
  }, [upiQuery]);

  const onParcelInventoryStats = useCallback((stats: ParcelInventoryStats) => {
    notifyParent({ source: "taiseel-map-engine", type: "parcel-inventory-stats", stats });
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
      if (command.type === "parcel-filters") setParcelFilters(command.filters);
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
      (window as Window & { __TAISEEL_DRAW_MODE__?: boolean }).__TAISEEL_DRAW_MODE__ = false;
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
  }, [mapInstance]);

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
        parcelFilters={parcelFilters}
        onParcelInventoryStats={onParcelInventoryStats}
        showScope="pilot"
        onMapReady={onMapReady}
        onStatusChange={onBasemapStatus}
        onBoundaryStatusChange={onBoundaryStatus}
        onAreaSelected={onAreaSelected}
        selectedArea={selectedArea}
        parcelUpiSearch={parcelUpiSearch}
        onParcelUpiSearchStatus={onParcelUpiSearchStatus}
        projects={NO_PROJECTS}
        showProjects={false}
        selectedProjectId={null}
        onProjectSelected={onProjectSelected}
      />
      <form className="parcel-upi-search" onSubmit={submitParcelUpiSearch}>
        <label htmlFor="parcel-upi-search-input">Find a parcel by UPI</label>
        <div className="parcel-upi-search-row">
          <input
            id="parcel-upi-search-input"
            value={upiQuery}
            onChange={(event) => setUpiQuery(event.target.value)}
            placeholder="e.g. 1/03/01/04/2481"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" disabled={basemapStatus !== "ready"}>
            Search
          </button>
        </div>
        <p
          className={"parcel-upi-search-status" + (upiSearchStatus?.state === "error" || upiSearchStatus?.state === "not-found" ? " error" : "")}
          role="status"
          aria-live="polite"
        >
          {upiSearchStatus?.message || "Enter a parcel UPI to locate its cadastral record on the map."}
        </p>
      </form>
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
              {selectedArea.zoning?.length ? (
                <div className="map-selection-zoning">
                  <strong>Planning designation</strong>
                  {selectedArea.zoning.map((entry, index) => (
                    <div key={(entry.code ?? entry.name) + "-" + index}>
                      <span>{entry.code ? entry.code + " · " : ""}{entry.name}</span>
                      {entry.condition ? <small>Condition: {entry.condition}</small> : null}
                      {entry.prohibited ? <small>Prohibited: {entry.prohibited}</small> : null}
                      {entry.buffer ? <small>Buffer: {entry.buffer}</small> : null}
                    </div>
                  ))}
                </div>
              ) : selectedArea.zoningStatus === "not-covered" ? <small>Zoning classification not published for this parcel in the current source</small>
                : selectedArea.zoningStatus === "ambiguous" ? <small>Overlapping base-zone records need source review; no single zone is assumed</small>
                : <small>Parcel-level zoning record unavailable in this viewport</small>}
            </div>
          ) : (
            <small>Administrative boundary · Not proof of parcel title or ownership</small>
          )}
          {selectedArea.level === "parcel" ? (
            <button
              type="button"
              className="map-selection-report"
              onClick={() => setPropertyProfileOpen(true)}
            >
              View connected property profile
            </button>
          ) : null}
          <button type="button" className="map-selection-close" onClick={() => onAreaSelected(null)} aria-label="Clear selected area">×</button>
        </section>
      )}
      {propertyProfileOpen && selectedArea?.level === "parcel" && (
        <aside className="property-intelligence-panel" aria-label="Connected property profile">
          <header className="property-intelligence-header">
            <div>
              <span className="property-intelligence-eyebrow">One connected property profile</span>
              <h2>{selectedArea.name}</h2>
              <p>{areaPath || selectedArea.district}</p>
            </div>
            <button
              type="button"
              className="property-intelligence-close"
              onClick={() => setPropertyProfileOpen(false)}
              aria-label="Close property profile"
            >×</button>
          </header>

          <div className="property-intelligence-identity">
            <span>Parcel identity</span>
            <strong>{selectedArea.upi ? "UPI " + selectedArea.upi : "UPI not supplied by source"}</strong>
            <small>
              {selectedArea.parcelSizeM2
                ? selectedArea.parcelSizeM2.toLocaleString("en") + " m² · " +
                  (selectedArea.parcelSizeSource === "cadastral-attribute"
                    ? "cadastral size attribute"
                    : selectedArea.parcelSizeSource === "geometry-estimate"
                      ? "geometry-derived estimate"
                      : "size basis not supplied")
                : "Parcel size not supplied"}
            </small>
          </div>

          <section className="property-intelligence-layer">
            <div className="property-intelligence-layer-kicker">01 · SINGAPORE MODEL</div>
            <h3>Land Intelligence</h3>
            <div className="property-intelligence-facts">
              <div><span>Location</span><strong>{areaPath || selectedArea.district}</strong></div>
              <div><span>Parcel record</span><strong>{selectedArea.sourceLabel || "Source not supplied"}</strong></div>
              <div><span>Planning status</span><strong>{zoningStatusLabel(selectedArea.zoningStatus)}</strong></div>
              {selectedArea.zoning?.length ? (
                <div className="property-intelligence-zones">
                  <span>Published zoning records</span>
                  {selectedArea.zoning.map((entry, index) => (
                    <div key={(entry.code ?? entry.name) + "-" + index}>
                      <strong>{entry.code ? entry.code + " · " : ""}{entry.name}</strong>
                      {entry.condition ? <small>Condition: {entry.condition}</small> : null}
                      {entry.prohibited ? <small>Prohibited: {entry.prohibited}</small> : null}
                      {entry.buffer ? <small>Buffer: {entry.buffer}</small> : null}
                    </div>
                  ))}
                  {selectedArea.zoningSource ? <small>Planning source: {selectedArea.zoningSource}</small> : null}
                </div>
              ) : null}
              <div>
                <span>Wetland overlap</span>
                <strong>
                  {typeof selectedArea.wetlandAreaM2 === "number"
                    ? selectedArea.wetlandAreaM2 > 0
                      ? selectedArea.wetlandAreaM2.toLocaleString("en") + " m² reported by source"
                      : "No overlap reported by source"
                    : "Not supplied"}
                </strong>
              </div>
            </div>
            <p className="property-intelligence-note">
              This mapped parcel record does not confirm current registered ownership, encumbrances,
              seller authority or legal title. Those checks require current official records.
            </p>
          </section>

          <section className="property-intelligence-layer">
            <div className="property-intelligence-layer-kicker">02 · DUBAI MODEL</div>
            <h3>Development and Regulatory Intelligence</h3>
            <div className="property-intelligence-status">Parcel-linked development records: Not connected</div>
            <p className="property-intelligence-note">
              Approved projects, developer registration, project approvals, off-plan registration
              and escrow information are not yet linked to this parcel in Taiseel. This is not
              evidence that no approval, project or planning restriction exists.
            </p>
          </section>

          <section className="property-intelligence-layer">
            <div className="property-intelligence-layer-kicker">03 · UNITED STATES MODEL</div>
            <h3>Marketplace and Market Intelligence</h3>
            <div className="property-intelligence-facts">
              {typeof selectedArea.parcelPriceValue === "number" && selectedArea.parcelPriceValue > 0 ? (
                <div>
                  <span>{selectedArea.parcelPriceType ? parcelPriceTypeLabel(selectedArea.parcelPriceType) : "Parcel price reference"}</span>
                  <strong>{formatRwf(selectedArea.parcelPriceValue)}</strong>
                  {selectedArea.parcelPriceSource ? <small>{selectedArea.parcelPriceSource}</small> : null}
                  {selectedArea.parcelPriceNote ? <small>{selectedArea.parcelPriceNote}</small> : null}
                </div>
              ) : (
                <div><span>Parcel-specific price</span><strong>Not available from the connected sources</strong></div>
              )}
              {typeof selectedArea.averageLandPricePerM2 === "number" ? (
                <div>
                  <span>Area reference price per m²</span>
                  <strong>{formatRwf(selectedArea.averageLandPricePerM2)} / m²</strong>
                  <small>{selectedArea.averageLandPriceKind || "Area-level land price reference; not a parcel valuation"}</small>
                  {typeof selectedArea.averageLandPriceSampleSize === "number" ? (
                    <small>Source observations: {selectedArea.averageLandPriceSampleSize}</small>
                  ) : null}
                </div>
              ) : null}
              <div><span>Linked property listing</span><strong>Not connected to this parcel</strong></div>
              <div><span>Comparable listings and verified sale history</span><strong>Not available in this profile yet</strong></div>
            </div>
            <p className="property-intelligence-note">
              A district or area benchmark is not the same as an asking price, completed sale price
              or formal valuation. Those evidence types must remain separate.
            </p>
          </section>

          <footer className="property-intelligence-footer">
            Taiseel brings these information layers together. This profile is not a title certificate,
            legal opinion, formal valuation, survey or development approval.
          </footer>
        </aside>
      )}
      {drawing && <div className="map-draw-hint">Click to draw a boundary. Double-click to finish.</div>}
      <span className="sr-only" role="status">{basemapStatus === "ready" && isBoundaryReady ? "Map and boundary data ready" : "Map loading"}</span>
    </main>
  );
}
