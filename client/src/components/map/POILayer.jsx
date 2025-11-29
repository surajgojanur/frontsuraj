import React, { useEffect } from 'react';
import { useMapContext } from '@/context/MapContext';

export default function POILayer({ data, idPrefix = 'main' }) {
  const { map, isLoaded } = useMapContext();

  useEffect(() => {
    if (!map || !isLoaded || !data) return;

    const sourceId = `${idPrefix}-poi-source`;
    const layerId = `${idPrefix}-poi-layer`;

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
          'circle-radius': 5,
          'circle-color': '#007aff',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });
    } else {
      map.getSource(sourceId).setData(data);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, data, idPrefix]);

  return null;
}
