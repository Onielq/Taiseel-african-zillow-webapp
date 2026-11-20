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
  const optionalText = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized && normalized.toLowerCase() !== "<null>" ? normalized : null;
  };
  // Keep per-request geometry payloads bounded for the large Kigali base-zone layer.
  const pageSize = source === "kigali" ? 200 : 1000;
  for (let offset = 0; offset < 9000; offset += pageSize) {
    const [west, south, east, north] = bounds;
    const toWebMercator = (longitude: number, latitude: number): [number, number] => {
      const radius = 20_037_508.342789244;
      const clampedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
      const x = longitude * radius / 180;
      const y = Math.log(Math.tan((90 + clampedLatitude) * Math.PI / 360)) * radius / Math.PI;
      return [x, y];
    };
    // Only the current Kigali base zoning layer is queried in Web Mercator.
    // The C2 sibling layer and Bugesera DLUP service retain their own WGS84 query path.
    const [xmin, ymin, xmax, ymax] = source === "kigali"
      ? [...toWebMercator(west, south), ...toWebMercator(east, north)]
      : [west, south, east, north];
    const inputWkid = source === "kigali" ? 102100 : 4326;
    const geometry = JSON.stringify({
      xmin,
      ymin,
      xmax,
      ymax,
      spatialReference: { wkid: inputWkid }
    });
    const params = new URLSearchParams({
      where: "1=1",
      geometry,
      geometryType: "esriGeometryEnvelope",
      inSR: String(inputWkid),
      outSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: source === "kigali"
        ? "objectid,zone_code,new_zoning,conditiona,prohibited,buffer_zon,buff_detai,importance,wet_name"
        : "*",
      returnGeometry: "true",
      returnZ: "false",
      returnM: "false",
      maxAllowableOffset: "0.00002",
      geometryPrecision: "6",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: "geojson"
    });
    const response = await fetch(layerUrl + "/query?" + params.toString(), {
      headers: { Accept: "application/geo+json, application/json" },
      signal: AbortSignal.timeout(source === "kigali" ? 45_000 : 15_000)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      throw new Error(
        source + " zoning query failed (" + response.status + "): " + responseBody.slice(0, 700)
      );
    }
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
        zoning_condition: optionalText(properties.conditiona),
        zoning_prohibited: optionalText(properties.prohibited),
        zoning_buffer: optionalText(properties.buffer_zon),
        zoning_buffer_detail: optionalText(properties.buff_detai),
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

function featureIntersectsBounds(feature: GeoJsonFeature, bounds: Bounds): boolean {
  const coordinates: [number, number][] = [];
  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      coordinates.push([value[0], value[1]]);
      return;
    }
    value.forEach(visit);
  };
  visit(feature.geometry?.coordinates);
  if (!coordinates.length) return false;
  const xs = coordinates.map(([x]) => x);
  const ys = coordinates.map(([, y]) => y);
  const west = Math.min(...xs), east = Math.max(...xs);
  const south = Math.min(...ys), north = Math.max(...ys);
  return west <= bounds[2] && east >= bounds[0] && south <= bounds[3] && north >= bounds[1];
}

async function queryKigaliLayerByIds(layerUrl: string, bounds: Bounds): Promise<GeoJsonFeature[]> {
  const idsParams = new URLSearchParams({
    where: "1=1",
    returnIdsOnly: "true",
    f: "json"
  });
  const idsResponse = await fetch(layerUrl + "/query?" + idsParams.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(45_000)
  });
  if (!idsResponse.ok) {
    const body = await idsResponse.text().catch(() => "");
    throw new Error("Kigali zoning object-ID query failed (" + idsResponse.status + "): " + body.slice(0, 500));
  }
  const idsPayload = await idsResponse.json() as { objectIds?: number[]; error?: { code?: number; message?: string } };
  if (idsPayload.error) {
    throw new Error("Kigali zoning object-ID query error " + (idsPayload.error.code ?? "unknown") + ": " + (idsPayload.error.message ?? "query failed"));
  }
  const objectIds = idsPayload.objectIds ?? [];
  const features: GeoJsonFeature[] = [];
  for (let start = 0; start < objectIds.length; start += 200) {
    const params = new URLSearchParams({
      objectIds: objectIds.slice(start, start + 200).join(","),
      outFields: "objectid,zone_code,new_zoning,conditiona,prohibited,buffer_zon,buff_detai,importance,wet_name",
      outSR: "4326",
      returnGeometry: "true",
      returnZ: "false",
      returnM: "false",
      geometryPrecision: "6",
      f: "geojson"
    });
    const response = await fetch(layerUrl + "/query?" + params.toString(), {
      headers: { Accept: "application/geo+json, application/json" },
      signal: AbortSignal.timeout(45_000)
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error("Kigali zoning geometry batch failed (" + response.status + "): " + body.slice(0, 500));
    }
    const payload = await response.json() as GeoJsonCollection;
    if (payload.error) {
      throw new Error("Kigali zoning geometry batch error " + (payload.error.code ?? "unknown") + ": " + (payload.error.message ?? "query failed"));
    }
    features.push(...(payload.features ?? []).filter((feature) => featureIntersectsBounds(feature, bounds)));
  }
  return features;
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
      const features = await queryZoningLayer(source.url, source.target, source.id).catch(async (spatialError) => {
        if (source.id !== "kigali") throw spatialError;
        console.warn("Kigali spatial zoning query failed; retrying with object-ID batches.", spatialError);
        return queryKigaliLayerByIds(source.url, source.target);
      });
      return { source: source.id, features, failed: false };
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
