-- Canonical internal identities for listers and independent reviewers.
-- A provider subject is linked to a stable platform principal so multiple
-- identity-provider accounts can resolve to the same canonical person.

CREATE TABLE IF NOT EXISTS public.platform_principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_type text NOT NULL
    CHECK (principal_type IN ('person', 'organisation')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_principal_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL REFERENCES public.platform_principals(id) ON DELETE RESTRICT,
  identity_provider text NOT NULL CHECK (identity_provider ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  provider_subject text NOT NULL CHECK (length(btrim(provider_subject)) BETWEEN 1 AND 255),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_principal_identities_provider_subject_unique UNIQUE (identity_provider, provider_subject),
  CONSTRAINT platform_principal_identities_principal_provider_unique UNIQUE (principal_id, identity_provider, provider_subject)
);

ALTER TABLE public.listing_parcel_links
  ADD COLUMN lister_principal_id uuid NOT NULL REFERENCES public.platform_principals(id) ON DELETE RESTRICT;

ALTER TABLE public.listing_parcel_links
  ADD COLUMN reviewer_principal_id uuid NULL REFERENCES public.platform_principals(id) ON DELETE RESTRICT;

ALTER TABLE public.listing_parcel_links
  DROP CONSTRAINT listing_parcel_links_verified_has_independent_evidence;

ALTER TABLE public.listing_parcel_links
  ADD CONSTRAINT listing_parcel_links_verified_has_independent_evidence CHECK (
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
      AND lister_principal_id IS NOT NULL
      AND reviewer_principal_id IS NOT NULL
      AND reviewer_principal_id <> lister_principal_id
    )
  );

CREATE INDEX IF NOT EXISTS platform_principal_identities_principal_idx
  ON public.platform_principal_identities (principal_id);

CREATE INDEX IF NOT EXISTS listing_parcel_links_lister_principal_idx
  ON public.listing_parcel_links (lister_principal_id);

CREATE INDEX IF NOT EXISTS listing_parcel_links_reviewer_principal_idx
  ON public.listing_parcel_links (reviewer_principal_id);
