import { expect, test } from "@playwright/test";
import { GET } from "../api/listings/parcel-links";

function request(query = ""): Request {
  return new Request(`https://taiseel.test/api/listings/parcel-links${query}`);
}

test("parcel-link lookup requires one exact lookup key", async () => {
  const response = await GET(request());
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Provide source and listingId, or provide an exact five-part Rwanda UPI."
  });
});

test("parcel-link lookup validates Rwanda UPI before database access", async () => {
  const response = await GET(request("?upi=5/07/08/01/not-a-parcel"));
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "UPI must contain five numeric components separated by slashes."
  });
});

test("listing lookup requires both source and listing ID", async () => {
  const response = await GET(request("?source=partner_a"));
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Provide both source and listingId to search by listing."
  });
});

test("parcel-link lookup rejects mixed listing and parcel selectors", async () => {
  const response = await GET(request("?source=partner_a&listingId=listing-1&upi=5/07/08/01/936"));
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Use one lookup method at a time: listing identity or parcel UPI."
  });
});

test("parcel-link lookup enforces a bounded result limit", async () => {
  const response = await GET(request("?upi=5/07/08/01/936&limit=500"));
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "limit must be a whole number from 1 to 50."
  });
});
