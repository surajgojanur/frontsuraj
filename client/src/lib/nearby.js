import { useQuery } from '@tanstack/react-query';

export const buildAddress = (item) => {
  const tags = item?.tags ?? {};

  const explicitAddress =
    tags['addr:full'] ??
    tags['addr:place'] ??
    tags['addr:street_address'] ??
    tags['contact:address'] ??
    null;

  if (typeof explicitAddress === 'string' && explicitAddress.trim().length) {
    return explicitAddress.trim();
  }

  const houseNumber = tags['addr:housenumber'] ?? tags['addr:unit'];
  const street = tags['addr:street'] ?? tags['addr:road'];
  const suburb = tags['addr:suburb'] ?? tags['addr:neighbourhood'];
  const city = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'];

  const components = [];

  if (houseNumber || street) {
    components.push([houseNumber, street].filter(Boolean).join(' ').trim());
  }

  if (suburb) {
    components.push(suburb);
  }

  if (city) {
    components.push(city);
  }

  if (components.length) {
    return components.join(', ');
  }

  return null;
};

// Strict fetch function as requested
export async function fetchNearby(lat, lng, categories) {
  const res = await fetch("/api/places-nearby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: lat,
      longitude: lng,
      categories,
    }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Failed to load nearby places (${res.status})`);
  }

  const payload = await res.json();
  const rawResults = Array.isArray(payload?.results) ? payload.results : [];

  const sanitizedResults = rawResults
    .map((item, index) => {
      const latitude = Number.parseFloat(
        item?.latitude ?? item?.lat ?? item?.location?.lat
      );
      const longitude = Number.parseFloat(
        item?.longitude ?? item?.lng ?? item?.lon ?? item?.location?.lng
      );

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const address = buildAddress(item);

      return {
        id: item?.id ?? `${latitude}-${longitude}-${index}`,
        name: item?.name ?? item?.tags?.name ?? "Unknown",
        address: address ?? null,
        category: item?.category ?? item?.tags?.shop ?? "unknown",
        latitude,
        longitude,
      };
    })
    .filter(Boolean);

  return {
    ...payload,
    results: sanitizedResults,
  };
}

export function useNearbyPlaces(lat, lng, categories, options = {}) {
  const enabled = typeof lat === 'number' && typeof lng === 'number' && Array.isArray(categories);

  return useQuery({
    queryKey: ['nearby', lat, lng, ...(categories || [])],
    queryFn: () => fetchNearby(lat, lng, categories),
    enabled,
    staleTime: 1000 * 30,
    ...options,
  });
}
