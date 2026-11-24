-- Taiseel listing-to-parcel relationship records.
-- Lister assertion, cadastral identity check, and independent relationship review
-- are recorded separately. Only verified rows may be exposed by the public API.

CREATE TABLE IF NOT EXISTS public.listing_parcel_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_source text NOT NULL CHECK (listing_source ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  listing_source_id text NOT NULL CHECK (length(btrim(listing_source_id)) BETWEEN 1 AND 200),
  listing_url text NULL CHECK (listing_url IS NULL OR listing_url ~ '^https://[^[:space:]]+$'),
  parcel_upi text NOT NULL CHECK (parcel_upi ~ '^[0-9]+(/[0-9]+){4}$'),
  lister_source text NOT NULL CHECK (lister_source ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  lister_external_id text NOT NULL CHECK (length(btrim(lister_external_id)) BETWEEN 1 AND 200),
  lister_attested boolean NOT NULL CHECK (lister_attested = true),
  lister_attestation_version text NOT NULL CHECK (length(btrim(lister_attestation_version)) BETWEEN 1 AND 80),
  lister_attested_at timestamptz NOT NULL DEFAULT now(),
  upi_check_status text NOT NULL DEFAULT 'not_checked'
    CHECK (upi_check_status IN ('not_checked', 'matched', 'not_found', 'source_unavailable', 'ambiguous')),
  upi_check_source text NULL,
  upi_check_method text NULL
    CHECK (upi_check_method IS NULL OR upi_check_method IN ('exact_source_lookup', 'official_document_review', 'licensed_partner_confirmation')),
  upi_check_evidence_reference text NULL,
  upi_checked_at timestamptz NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_method text NULL
    CHECK (verification_method IS NULL OR verification_method IN ('document_review', 'field_visit', 'authorized_partner_confirmation', 'official_record_cross_check')),
  relationship_evidence_type text NULL
    CHECK (relationship_evidence_type IS NULL OR relationship_evidence_type IN ('signed_listing_mandate', 'title_or_lease_document', 'field_inspection', 'developer_confirmation', 'other')),
  verification_evidence_reference text NULL,
  verified_by text NULL,
  verified_by_organisation text NULL,
  verified_at timestamptz NULL,
  reviewed_by text NULL,
  reviewed_at timestamptz NULL,
  verification_note text NULL,
  rejection_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_parcel_links_matched_upi_has_evidence CHECK (
    upi_check_status <> 'matched'
    OR (
      upi_check_source IS NOT NULL
      AND upi_check_method IS NOT NULL
      AND upi_checked_at IS NOT NULL
      AND (upi_check_method = 'exact_source_lookup' OR upi_check_evidence_reference IS NOT NULL)
    )
  ),
  CONSTRAINT listing_parcel_links_verified_has_independent_evidence CHECK (
    status <> 'verified'
    OR (
      upi_check_status = 'matched'
      AND verification_method IS NOT NULL
      AND relationship_evidence_type IS NOT NULL
      AND verification_evidence_reference IS NOT NULL
      AND verified_by IS NOT NULL
      AND verified_by_organisation IS NOT NULL
      AND verified_at IS NOT NULL
      AND reviewed_by IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND verified_by <> (lister_source || ':' || lister_external_id)
    )
  ),
  CONSTRAINT listing_parcel_links_rejection_has_reason CHECK (
    status <> 'rejected'
    OR (rejection_reason IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_parcel_links_one_open_claim_idx
  ON public.listing_parcel_links (listing_source, listing_source_id, parcel_upi)
  WHERE status IN ('pending', 'verified');

CREATE INDEX IF NOT EXISTS listing_parcel_links_listing_lookup_idx
  ON public.listing_parcel_links (listing_source, listing_source_id, status);

CREATE INDEX IF NOT EXISTS listing_parcel_links_upi_lookup_idx
  ON public.listing_parcel_links (parcel_upi, status);

COMMENT ON TABLE public.listing_parcel_links IS 'A lister-asserted listing-to-parcel relationship. Only independently reviewed rows with status verified may be returned by public APIs.';
COMMENT ON COLUMN public.listing_parcel_links.parcel_upi IS 'Exact five-part Rwanda UPI submitted by the lister, never inferred from an address or map proximity.';
COMMENT ON COLUMN public.listing_parcel_links.verification_evidence_reference IS 'Private internal reference to evidence that the listing is actually associated with the parcel and is never returned publicly.';
