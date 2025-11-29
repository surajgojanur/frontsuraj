import React, { useEffect } from 'react';
import { useMapContext } from '@/context/MapContext';

export default function IsochroneLayer({ data, idPrefix = 'main' }) {
  const { map, isLoaded } = useMapContext();

  useEffect(() => {
    if (!map || !isLoaded || !data) return;

    const sourceId = `${idPrefix}-isochrone-source`;
    const layerId = `${idPrefix}-isochrone-layer`;
    const outlineId = `${idPrefix}-isochrone-outline`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: data,
      });

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        layout: {},
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.2,
        },
      });

      map.addLayer({
        id: outlineId,
        type: 'line',
        source: sourceId,
        layout: {},
        paint: {
          'line-color': '#22c55e',
          'line-width': 2,
          'line-dasharray': [2, 1],
        },
      });
    } else {
      map.getSource(sourceId).setData(data);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getLayer(outlineId)) map.removeLayer(outlineId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, data, idPrefix]);

  return null;
}
