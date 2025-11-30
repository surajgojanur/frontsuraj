const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function fetchLocationContext(lat, lng, options = {}) {
  const latitude = toNumber(lat);
  const longitude = toNumber(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Latitude and longitude are required for location context');
  }

  const payload = {
    latitude,
    longitude,
    radiusMeters: options.radiusMeters ?? 1500,
  };

  const response = await fetch('/api/location-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to load location context (${response.status})`);
  }

  const data = await response.json();

  const area = typeof data?.area === 'object' && data.area !== null
    ? {
        name: data.area.name ?? null,
        adminLevel: data.area.adminLevel ?? null,
        place: data.area.place ?? null,
        population: data.area.population ?? null,
        approximateAreaSqKm: Number.isFinite(data.area.approximateAreaSqKm)
          ? data.area.approximateAreaSqKm
          : null,
      }
    : null;

  const roads = typeof data?.roads === 'object' && data.roads !== null
    ? {
        radiusMeters: Number.isFinite(data.roads.radiusMeters) ? data.roads.radiusMeters : 1500,
        totalKm: Number.isFinite(data.roads.totalKm) ? data.roads.totalKm : 0,
        walkableKm: Number.isFinite(data.roads.walkableKm) ? data.roads.walkableKm : 0,
        cycleKm: Number.isFinite(data.roads.cycleKm) ? data.roads.cycleKm : 0,
        vehicleKm: Number.isFinite(data.roads.vehicleKm) ? data.roads.vehicleKm : 0,
        densityPerSqKm: Number.isFinite(data.roads.densityPerSqKm)
          ? data.roads.densityPerSqKm
          : null,
        lengthByType: data.roads.lengthByType && typeof data.roads.lengthByType === 'object'
          ? data.roads.lengthByType
          : {},
      }
    : null;

  const scores = typeof data?.scores === 'object' && data.scores !== null
    ? {
        walkability: Number.isFinite(data.scores.walkability) ? data.scores.walkability : null,
        cycleFriendliness: Number.isFinite(data.scores.cycleFriendliness)
          ? data.scores.cycleFriendliness
          : null,
        vehicleDominance: Number.isFinite(data.scores.vehicleDominance)
          ? data.scores.vehicleDominance
          : null,
      }
    : null;

  const toNearest = (entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const distance = toNumber(entry.distanceMeters);
    return {
      name: typeof entry.name === 'string' ? entry.name : 'Unknown',
      distanceMeters: Number.isFinite(distance) ? distance : null,
      latitude: toNumber(entry.latitude),
      longitude: toNumber(entry.longitude),
    };
  };

  const transit = typeof data?.transit === 'object' && data.transit !== null
    ? {
        radiusMeters: Number.isFinite(data.transit.radiusMeters)
          ? data.transit.radiusMeters
          : payload.radiusMeters,
        counts: {
          station: Number.isFinite(data?.transit?.counts?.station)
            ? data.transit.counts.station
            : 0,
          busStop: Number.isFinite(data?.transit?.counts?.busStop)
            ? data.transit.counts.busStop
            : 0,
          railStation: Number.isFinite(data?.transit?.counts?.railStation)
            ? data.transit.counts.railStation
            : 0,
          total: Number.isFinite(data?.transit?.counts?.total)
            ? data.transit.counts.total
            : 0,
        },
        nearest: {
          station: toNearest(data?.transit?.nearest?.station),
          busStop: toNearest(data?.transit?.nearest?.busStop),
          railStation: toNearest(data?.transit?.nearest?.railStation),
        },
      }
    : null;

  return {
    area,
    roads,
    scores,
    transit,
  };
}
