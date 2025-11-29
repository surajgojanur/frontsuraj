import { useQuery } from '@tanstack/react-query';

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

      return {
        id: item?.id ?? `${latitude}-${longitude}-${index}`,
        name: item?.name ?? "Unknown",
        category: item?.category ?? "unknown",
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
