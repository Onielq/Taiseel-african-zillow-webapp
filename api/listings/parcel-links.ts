import { neon } from "@neondatabase/serverless";

type PublicLinkRow = {
  id: string;
  listing_source: string;
  listing_source_id: string;
  listing_url: string | null;
  parcel_upi: string;
  upi_check_source: string;
  upi_check_method: string;
  upi_checked_at: string;
  verification_method: string;
  relationship_evidence_type: string;
  verified_by_organisation: string;
  verified_at: string;
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: NO_CACHE_HEADERS
  });
}

function validListingSource(value: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(value);
}

function validRwandaUpi(value: string): boolean {
  return /^\d+(?:\/\d+){4}$/.test(value);
}

function asPublicLink(row: PublicLinkRow) {
  return {
    id: row.id,
    listing: {
      source: row.listing_source,
      sourceId: row.listing_source_id,
      url: row.listing_url
    },
    parcel: {
      upi: row.parcel_upi
    },
    cadastralRecordCheck: {
      status: "matched",
      source: row.upi_check_source,
      method: row.upi_check_method,
      checkedAt: row.upi_checked_at
    },
    relationshipVerification: {
      status: "verified",
      method: row.verification_method,
      evidenceType: row.relationship_evidence_type,
      reviewingOrganisation: row.verified_by_organisation,
      verifiedAt: row.verified_at
    }
  };
}

/**
 * Public read-only endpoint. It returns only independently verified links.
 * It never accepts writes and never infers a parcel from an address or map point.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const source = (url.searchParams.get("source") ?? "").trim().toLowerCase();
  const listingId = (url.searchParams.get("listingId") ?? "").trim();
  const upi = (url.searchParams.get("upi") ?? "").trim();
  const hasSource = source.length > 0;
  const hasListingId = listingId.length > 0;
  const hasListingLookup = hasSource || hasListingId;

  if (hasListingLookup && (!hasSource || !hasListingId)) {
    return json({
      error: "Provide both source and listingId to search by listing."
    }, 400);
  }

  if (hasListingLookup && upi) {
    return json({
      error: "Use one lookup method at a time: listing identity or parcel UPI."
    }, 400);
  }

  if (!hasListingLookup && !upi) {
    return json({
      error: "Provide source and listingId, or provide an exact five-part Rwanda UPI."
    }, 400);
  }

  if (hasSource && !validListingSource(source)) {
    return json({ error: "source has an invalid format." }, 400);
  }

  if (hasListingId && listingId.length > 200) {
    return json({ error: "listingId must be 200 characters or fewer." }, 400);
  }

  if (upi && !validRwandaUpi(upi)) {
    return json({
      error: "UPI must contain five numeric components separated by slashes."
    }, 400);
  }

  const rawLimit = url.searchParams.get("limit");
  const parsedLimit = rawLimit === null ? 25 : Number(rawLimit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
    return json({ error: "limit must be a whole number from 1 to 50." }, 400);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return json({
      error: "Verified parcel-link lookup is not configured."
    }, 503);
  }

  try {
    const sql = neon(databaseUrl);
    let rows: PublicLinkRow[];

    if (hasListingLookup) {
      rows = await sql<PublicLinkRow[]>\`
        SELECT
          id,
          listing_source,
          listing_source_id,
          listing_url,
          parcel_upi,
          upi_check_source,
          upi_check_method,
          upi_checked_at,
          verification_method,
          relationship_evidence_type,
          verified_by_organisation,
          verified_at
        FROM public.listing_parcel_links
        WHERE status = 'verified'
          AND upi_check_status = 'matched'
          AND listing_source = \${source}
          AND listing_source_id = \${listingId}
        ORDER BY verified_at DESC
        LIMIT \${parsedLimit}
      \`;
    } else {
      rows = await sql<PublicLinkRow[]>\`
        SELECT
          id,
          listing_source,
          listing_source_id,
          listing_url,
          parcel_upi,
          upi_check_source,
          upi_check_method,
          upi_checked_at,
          verification_method,
          relationship_evidence_type,
          verified_by_organisation,
          verified_at
        FROM public.listing_parcel_links
        WHERE status = 'verified'
          AND upi_check_status = 'matched'
          AND parcel_upi = \${upi}
        ORDER BY verified_at DESC
        LIMIT \${parsedLimit}
      \`;
    }

    return json({
      dataStatus: rows.length > 0 ? "verified" : "not_found",
      count: rows.length,
      items: rows.map(asPublicLink),
      caveat: "A verified listing-to-parcel relationship is not proof of current registered ownership, title, encumbrances, seller authority, or transaction safety."
    });
  } catch (error) {
    console.error(
      "[parcel-links] Read-only lookup failed:",
      error instanceof Error ? error.message : "Unknown database error"
    );
    return json({
      error: "The verified parcel-link service is temporarily unavailable."
    }, 503);
  }
}
