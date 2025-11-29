import { useQuery } from '@tanstack/react-query';
import { fetchNearby } from '@/lib/nearby';

const SCORE_MAX = 100;
const BASE_SCORE = 50;
const DISTANCE_EQUAL_THRESHOLD = 100; // meters

const metersBetween = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const findNearest = (results = [], lat, lon) => {
  if (!Array.isArray(results) || results.length === 0) {
    return { distance: Number.POSITIVE_INFINITY, place: null };
  }

  return results.reduce(
    (nearest, item) => {
      if (!Number.isFinite(item?.latitude) || !Number.isFinite(item?.longitude)) {
        return nearest;
      }

      const distance = metersBetween(lat, lon, item.latitude, item.longitude);
      if (distance < nearest.distance) {
        return {
          distance,
          place: {
            ...item,
            distance,
          },
        };
      }

      return nearest;
    },
    { distance: Number.POSITIVE_INFINITY, place: null }
  );
};

const fetchScore = async (location, plusCategories, competitorCategories) => {
  if (!location) return null;

  const latitude = Number(location.lat ?? location.latitude);
  const longitude = Number(location.lng ?? location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const [targetData, competitorData] = await Promise.all([
    Array.isArray(plusCategories) && plusCategories.length
      ? fetchNearby(latitude, longitude, plusCategories)
      : Promise.resolve({ results: [] }),
    Array.isArray(competitorCategories) && competitorCategories.length
      ? fetchNearby(latitude, longitude, competitorCategories)
      : Promise.resolve({ results: [] }),
  ]);

  const targetNearest = findNearest(targetData.results, latitude, longitude);
  const competitorNearest = findNearest(
    competitorData.results,
    latitude,
    longitude
  );

  let score = BASE_SCORE;
  const adjustments = [];

  if (!Number.isFinite(targetNearest.distance)) {
    score = Math.max(0, BASE_SCORE - 30);
    adjustments.push({
      label: 'No target locations within search radius',
      delta: -30,
    });
  } else if (!Number.isFinite(competitorNearest.distance)) {
    score = Math.min(SCORE_MAX, BASE_SCORE + 20);
    adjustments.push({
      label: 'Targets nearby with no competitors detected',
      delta: +20,
    });
  } else {
    const diff = Math.abs(targetNearest.distance - competitorNearest.distance);

    if (diff <= DISTANCE_EQUAL_THRESHOLD) {
      score = Math.min(SCORE_MAX, BASE_SCORE + 10);
      adjustments.push({
        label: 'Targets and competitors are equally close',
        delta: +10,
      });
    } else if (competitorNearest.distance < targetNearest.distance) {
      score = Math.max(0, BASE_SCORE - 10);
      adjustments.push({
        label: 'Competitors are closer than targets',
        delta: -10,
      });
    } else {
      score = Math.min(SCORE_MAX, BASE_SCORE + 15);
      adjustments.push({
        label: 'Targets closer than competitors',
        delta: +15,
      });
    }
  }

  score = Math.max(0, Math.min(SCORE_MAX, Math.round(score)));

  return {
    score,
    scoreMax: SCORE_MAX,
    targetNearest,
    competitorNearest,
    targetCount: targetData.results.length,
    competitorCount: competitorData.results.length,
    adjustments,
    isochrone: null,
    tiles: null,
    pois: null,
    topTiles: [],
  };
};

export const useScoreLocation = (
  location,
  filters,
  priorities,
  plusCategories,
  competitorCategories
) => {
  return useQuery({
    queryKey: [
      'score',
      location?.lat ?? location?.latitude,
      location?.lng ?? location?.longitude,
      Array.isArray(plusCategories) ? plusCategories.join(',') : 'none',
      Array.isArray(competitorCategories)
        ? competitorCategories.join(',')
        : 'none',
    ],
    queryFn: () => fetchScore(location, plusCategories, competitorCategories),
    enabled: !!location,
    staleTime: 1000 * 60,
  });
};
