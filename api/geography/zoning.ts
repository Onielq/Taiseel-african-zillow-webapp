type Bounds = [number, number, number, number];
type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  geometry: { type: string; coordinates: unknown } | null;
  properties?: Record<string, unknown> | null;
};
type GeoJsonCollection = { type: "FeatureCollection"; features?: GeoJsonFeature[]; error?: { code?: number; message?: string } };

const KIGALI_ZONING_LAYER =
  "https://masterplan.kigalicity.gov.rw/server/rest/services/Masterplan2020/Masterplan2020_22Apr2026/MapServer/117";
const BUGESERA_ZONING_LAYER =
  "https://geodata.rw/server/rest/services/masterplan/Bugesera_DLUP/FeatureServer/0";
// C2 is published as a separate Kigali commercial overlay, not as a base-zone class.
const KIGALI_C2_OVERLAY_LAYER =
  "https://masterplan.kigalicity.gov.rw/server/rest/services/Masterplan2020/Masterplan2020_22Apr2026/MapServer/86";
const KIGALI_EXTENT: Bounds = [29.58, -2.12, 30.32, -1.47];
const BUGESERA_EXTENT: Bounds = [29.82, -2.62, 30.56, -1.92];

function parseBounds(value: string | null): Bounds | null {
  if (!value) return null;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || !parts.every(Number.isFinite)) return null;
  const [west, south, east, north] = parts;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) return null;
  return [west, south, east, north];
}

function intersect(a: Bounds, b: Bounds): Bounds | null {
  const result: Bounds = [
    Math.max(a[0], b[0]),
    Math.max(a[1], b[1]),
    Math.min(a[2], b[2]),
    Math.min(a[3], b[3])
  ];
  return result[0] < result[2] && result[1] < result[3] ? result : null;
}

async function queryZoningLayer(layerUrl: string, bounds: Bounds, source: "kigali" | "bugesera" | "kigali-c2"): Promise<GeoJsonFeature[]> {
  const result: GeoJsonFeature[] = [];
  const pageSize = 1500;
  for (let offset = 0; offset < 9000; offset += pageSize) {
    const params = new URLSearchParams({
      where: "1=1",
      geometry: bounds.join(","),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      outSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: "true",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: "geojson"
    });
    const response = await fetch(layerUrl + "/query?" + params.toString(), {
      headers: { Accept: "application/geo+json, application/json" },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(source + " zoning query failed (" + response.status + ")");
    const payload = await response.json() as GeoJsonCollection;
    if (payload.error) throw new Error(source + " zoning query error " + (payload.error.code ?? "unknown") + ": " + (payload.error.message ?? "query failed"));
    const page = payload.features ?? [];
    result.push(...page);
    if (page.length < pageSize) break;
  }

  return result.flatMap((feature, index) => {
    if (!feature.geometry || !["Polygon", "MultiPolygon"].includes(feature.geometry.type)) return [];
    const properties = feature.properties ?? {};
    const zoneName = [
      properties.new_zoning,
      properties.zoning,
      properties.zone_code,
      properties.gen_lu,
      properties.land_use
    ].find((value) => typeof value === "string" && value.trim().length > 0);
    const zoning = source === "kigali-c2"
      ? "C2-Commercial neighbourhood overlay"
      : typeof zoneName === "string" ? zoneName.trim() : "Unclassified zoning";
    const rawZoneCode = source === "kigali-c2"
      ? "C2"
      : [properties.zone_code, properties.new_zoning, properties.zoning, properties.gen_lu, properties.land_use]
          .find((value) => typeof value === "string" && value.trim().length > 0);
    const rawZoneValue = typeof rawZoneCode === "string" ? rawZoneCode.trim().toUpperCase() : "";
    // Only accept a code at the start of a published class label or an exact code.
    // Do not turn labels such as "Unclassified zoning" into a false zone code.
    const zoningCodeMatch = rawZoneValue.match(/^([A-Z]{1,3}[0-9]?[A-Z]?)(?:-|_|$)/);
    const zoningCode = zoningCodeMatch?.[1] ?? null;
    const id = feature.id ?? properties.objectid ?? properties.OBJECTID ?? properties.fid ?? index;
    return [{
      ...feature,
      id: "zoning-" + source + "-" + String(id),
      properties: {
        ...properties,
        zoning,
        zoning_code: zoningCode,
        zoning_condition: typeof properties.conditiona === "string" ? properties.conditiona.trim() : null,
        zoning_prohibited: typeof properties.prohibited === "string" ? properties.prohibited.trim() : null,
        zoning_buffer: typeof properties.buffer_zon === "string" ? properties.buffer_zon.trim() : null,
        zoning_buffer_detail: typeof properties.buff_detai === "string" ? properties.buff_detai.trim() : null,
        zoning_is_overlay: source === "kigali-c2",
        zoning_source: source === "kigali"
          ? "Kigali City Master Plan · Proposed Zoning Plan (22 April 2026 map service)"
          : source === "kigali-c2"
            ? "Kigali City Master Plan · C2 Overlay (22 April 2026 map service)"
            : "National Land Authority / Geodata Rwanda · Bugesera DLUP zoning layer"
      }
    }];
  });
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const bounds = parseBounds(requestUrl.searchParams.get("bbox"));
  if (!bounds) {
    return Response.json({ error: "bbox must be west,south,east,north in WGS84 coordinates" }, { status: 400 });
  }

  const jobs = [
    { id: "kigali" as const, url: KIGALI_ZONING_LAYER, extent: KIGALI_EXTENT },
    { id: "kigali-c2" as const, url: KIGALI_C2_OVERLAY_LAYER, extent: KIGALI_EXTENT },
    { id: "bugesera" as const, url: BUGESERA_ZONING_LAYER, extent: BUGESERA_EXTENT }
  ].flatMap((source) => {
    const target = intersect(bounds, source.extent);
    return target ? [{ ...source, target }] : [];
  });

  if (jobs.length === 0) {
    return Response.json({ type: "FeatureCollection", features: [] }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400" }
    });
  }

  const responses = await Promise.all(jobs.map(async (source) => {
    try {
      return { source: source.id, features: await queryZoningLayer(source.url, source.target, source.id), failed: false };
    } catch (error) {
      console.error("Official zoning layer failed for " + source.id + ".", error);
      return { source: source.id, features: [] as GeoJsonFeature[], failed: true };
    }
  }));

  if (responses.every((response) => response.failed)) {
    return Response.json({ error: "Official zoning services are temporarily unavailable." }, { status: 502 });
  }

  const features = responses.flatMap((response) => response.features);
  return Response.json({
    type: "FeatureCollection",
    features,
    sources: responses.filter((response) => !response.failed).map((response) => response.source),
    warning: "Zoning is a planning designation, not proof of title or a guarantee of development approval. Check the governing approved plan and current permit conditions."
  }, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400",
      "X-Data-Source": "Kigali City Master Plan; National Land Authority / Geodata Rwanda Bugesera DLUP",
      "X-Zoning-Coverage": "Kigali pilot districts and Bugesera, within published GIS extents"
    }
  });
}
