const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeFeature = (feature) => {
  if (!feature || typeof feature !== 'object') return null;

  const geometry = feature.geometry;
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    return null;
  }

  const safeProperties = {
    count: Number.parseInt(feature?.properties?.count ?? 0, 10) || 0,
    score: Number.parseInt(feature?.properties?.score ?? 0, 10) || 0,
  };

  if (feature?.properties?.id !== undefined) {
    safeProperties.id = String(feature.properties.id);
  }

  if (feature?.properties?.rank) {
    safeProperties.rank = Number.parseInt(feature.properties.rank, 10) || 0;
  }

  return {
    type: 'Feature',
    geometry,
    properties: safeProperties,
  };
};

export async function fetchCompetitorDensity(lat, lng, categories, options = {}) {
  const latitude = toNumber(lat);
  const longitude = toNumber(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Latitude and longitude are required to fetch density data');
  }

  const payload = {
    latitude,
    longitude,
    categories,
    radiusKm: options.radiusKm ?? 2,
    cellKm: options.cellKm ?? 0.3,
  };

  const res = await fetch('/api/competitor-density', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Failed to load competitor density (${res.status})`);
  }

  const data = await res.json();

  const sanitizedPoints = Array.isArray(data?.points)
    ? data.points
        .map((item, index) => {
          const latitude = toNumber(item?.latitude ?? item?.lat);
          const longitude = toNumber(item?.longitude ?? item?.lng ?? item?.lon);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            id: item?.id ?? `${latitude}-${longitude}-${index}`,
            name: item?.name ?? 'Unknown',
            category: item?.category ?? 'unknown',
            latitude,
            longitude,
            tags: item?.tags ?? {},
          };
        })
        .filter(Boolean)
    : [];

  const tileFeatures = Array.isArray(data?.tiles?.features)
    ? data.tiles.features
        .map(sanitizeFeature)
        .filter(Boolean)
    : [];

  const topTileFeatures = Array.isArray(data?.topTiles)
    ? data.topTiles
        .map(sanitizeFeature)
        .filter(Boolean)
    : [];

  const heatmapFeatures = Array.isArray(data?.heatmapPoints?.features)
    ? data.heatmapPoints.features
        .map((feature) => {
          if (!feature || feature.type !== 'Feature') return null;
          if (!feature.geometry || feature.geometry.type !== 'Point') return null;

          const weight = Number.parseFloat(feature?.properties?.weight ?? feature?.properties?.count ?? 0);
          const score = Number.parseFloat(feature?.properties?.score ?? 0);

          return {
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              weight: Number.isFinite(weight) ? weight : 0,
              score: Number.isFinite(score) ? score : 0,
              id: feature?.properties?.id ? String(feature.properties.id) : undefined,
            },
          };
        })
        .filter(Boolean)
    : [];

  const tiles = tileFeatures.length
    ? {
        type: 'FeatureCollection',
        features: tileFeatures,
      }
    : null;

  const heatmap = heatmapFeatures.length
    ? {
        type: 'FeatureCollection',
        features: heatmapFeatures,
      }
    : null;

  return {
    tiles,
    points: sanitizedPoints,
    topTiles: topTileFeatures,
    heatmap,
    metadata: typeof data?.metadata === 'object' ? data.metadata : null,
  };
}
