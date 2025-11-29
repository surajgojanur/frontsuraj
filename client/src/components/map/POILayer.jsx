import React, { useEffect, useRef } from 'react';
import { useMapContext } from '@/context/MapContext';

export default function POILayer({ data, idPrefix = 'main' }) {
  const { map, isLoaded } = useMapContext();
  const sourceInitialized = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!map || !isLoaded || !data) return;

    const sourceId = `${idPrefix}-poi-source`;
    const layerId = `${idPrefix}-poi-layer`;

    // Clear any pending timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Delay adding/updating to let real data arrive
    timeoutRef.current = setTimeout(() => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: data,
        });
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 0.5,
            'circle-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });
        sourceInitialized.current = true;
      } else if (sourceInitialized.current) {
        map.getSource(sourceId).setData(data);
      }
    }, 500); // Wait 500ms for real data to load

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      sourceInitialized.current = false;
    };
  }, [map, isLoaded, data, idPrefix]);

  return null;
}