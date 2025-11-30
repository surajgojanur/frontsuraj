import React, { useEffect } from 'react';
import { useMapContext } from '@/context/MapContext';

export default function TileHeatmapLayer({ data, heatmap, idPrefix = 'main' }) {
  const { map, isLoaded } = useMapContext();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const polygonSourceId = `${idPrefix}-heatmap-source`;
    const polygonLayerId = `${idPrefix}-heatmap-layer`;
    const outlineLayerId = `${idPrefix}-heatmap-outline`;
    const heatmapSourceId = `${idPrefix}-heatmap-points-source`;
    const heatmapLayerId = `${idPrefix}-heatmap-points-layer`;

    const hasPolygons = Boolean(data?.features?.length);
    const hasHeatmap = Boolean(heatmap?.features?.length);

    if (hasPolygons) {
      if (!map.getSource(polygonSourceId)) {
        map.addSource(polygonSourceId, {
          type: 'geojson',
          data,
        });

        map.addLayer({
          id: polygonLayerId,
          type: 'fill',
          source: polygonSourceId,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'score'], 0],
              0, '#0b5394',
              20, '#1c75bc',
              40, '#38a3a5',
              60, '#ffd966',
              80, '#ffa500',
              100, '#d32f2f'
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'score'], 0],
              0, 0,
              10, 0.25,
              40, 0.55,
              70, 0.75,
              100, 0.9
            ],
          },
        });

        map.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: polygonSourceId,
          paint: {
            'line-color': '#ffffff',
            'line-opacity': 0.15,
            'line-width': 0.6,
          },
        });
      } else {
        map.getSource(polygonSourceId).setData(data);
      }
    } else {
      if (map.getLayer(polygonLayerId)) map.removeLayer(polygonLayerId);
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getSource(polygonSourceId)) map.removeSource(polygonSourceId);
    }

    if (hasHeatmap) {
      if (!map.getSource(heatmapSourceId)) {
        map.addSource(heatmapSourceId, {
          type: 'geojson',
          data: heatmap,
        });

        map.addLayer({
          id: heatmapLayerId,
          type: 'heatmap',
          source: heatmapSourceId,
          maxzoom: 18,
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['clamp', ['to-number', ['get', 'weight']], 0, 50],
              0, 0,
              5, 0.35,
              15, 0.7,
              30, 1,
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              12, 1.8,
              16, 2.6,
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 30,
              8, 50,
              12, 90,
              16, 140,
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, '#0d47a1',
              0.4, '#1976d2',
              0.6, '#42a5f5',
              0.7, '#ffee58',
              0.85, '#ffb300',
              0.95, '#f4511e',
            ],
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              6, 0.75,
              12, 0.9,
              16, 0.95,
            ],
          },
        });
      } else {
        map.getSource(heatmapSourceId).setData(heatmap);
      }
    } else {
      if (map.getLayer(heatmapLayerId)) map.removeLayer(heatmapLayerId);
      if (map.getSource(heatmapSourceId)) map.removeSource(heatmapSourceId);
    }

    return () => {
      if (map.getLayer(heatmapLayerId)) map.removeLayer(heatmapLayerId);
      if (map.getSource(heatmapSourceId)) map.removeSource(heatmapSourceId);
      if (map.getLayer(polygonLayerId)) map.removeLayer(polygonLayerId);
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getSource(polygonSourceId)) map.removeSource(polygonSourceId);
    };

  }, [map, isLoaded, data, heatmap, idPrefix]);

  return null;
}
