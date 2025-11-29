import React, { useEffect, useMemo } from 'react';
import * as turf from '@turf/turf';
import { useMapContext } from '@/context/MapContext';
import { useAppContext } from '@/context/AppContext';

const SOURCE_ID = 'current-radius-source';
const FILL_LAYER_ID = 'current-radius-fill';
const STROKE_LAYER_ID = 'current-radius-outline';

export default function RadiusCircleLayer({ radiusKm = 2 }) {
  const { map, isLoaded } = useMapContext();
  const { selectedLocation } = useAppContext();

  const circle = useMemo(() => {
    const lat = Number(
      selectedLocation?.lat ?? selectedLocation?.latitude ?? NaN
    );
    const lon = Number(
      selectedLocation?.lng ?? selectedLocation?.longitude ?? NaN
    );

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    try {
      return turf.circle([lon, lat], radiusKm, {
        steps: 90,
        units: 'kilometers',
      });
    } catch (error) {
      console.error('RadiusCircleLayer: failed to build circle', error);
      return null;
    }
  }, [selectedLocation, radiusKm]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const removeLayers = () => {
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getLayer(STROKE_LAYER_ID)) map.removeLayer(STROKE_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };

    removeLayers();

    if (!circle) {
      return removeLayers;
    }

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: circle,
    });

    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': '#16a34a',
        'fill-opacity': 0.1,
      },
    });

    map.addLayer({
      id: STROKE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#16a34a',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });

    return removeLayers;
  }, [map, isLoaded, circle]);

  return null;
}
