-- The public API's read-only database role only needs public parcel-link rows.
-- Keep the canonical identity registry inaccessible to that role.

REVOKE SELECT ON public.platform_principals, public.platform_principal_identities
  FROM taiseel_public_api;
