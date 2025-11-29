import React, { useEffect, useRef, useState } from 'react';
import { useMapContext } from '@/context/MapContext';
import { useAppContext } from '@/context/AppContext';
import { useNearbyPlaces } from '@/lib/nearby';

export default function NearbyPlacesLayer({ idPrefix = 'nearby' }) {
  const { map, isLoaded } = useMapContext();
  const { selectedLocation, selectedCategories, nearbyRefreshTick } = useAppContext();
  const [center, setCenter] = useState(null);
  const sourceId = `${idPrefix}-pois`;
  const layerId = `${idPrefix}-pois-layer`;

  // compute lat/lng to use: prefer selectedLocation, otherwise map center
  const lat = typeof selectedLocation?.lat === 'number' ? selectedLocation.lat : (center ? center.lat : null);
  const lng = typeof selectedLocation?.lng === 'number' ? selectedLocation.lng : (center ? center.lng : null);

  const { data, refetch } = useNearbyPlaces(lat, lng, selectedCategories || [], { enabled: !!lat && !!lng });

  // update local center when map moves so we can trigger refetch when user pans
  useEffect(() => {
    if (!map) return;

    const onMoveEnd = () => {
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    };

    map.on('moveend', onMoveEnd);
    onMoveEnd();

    return () => map.off('moveend', onMoveEnd);
  }, [map]);

  // whenever data updates, remove old source/layer and add new geojson source + layer
  useEffect(() => {
    if (!map || !isLoaded) return;

    // remove existing layer+source if present
    if (map.getLayer(layerId)) {
      try { map.removeLayer(layerId); } catch (e) {}
    }
    if (map.getSource(sourceId)) {
      try { map.removeSource(sourceId); } catch (e) {}
    }

    if (!data || !Array.isArray(data.results)) return;

    const geojson = {
      type: 'FeatureCollection',
      features: data.results.map((poi) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [poi.longitude, poi.latitude],
        },
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          tags: poi.tags || {},
        },
      }))
    };

    // add source
    map.addSource(sourceId, { type: 'geojson', data: geojson });

    // add circle layer with match-based colors
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'match',
          ['get', 'category'],
          'cafe', '#22c55e',
          'bakery', '#22c55e',
          'grocery', '#22c55e',
          /* default */ '#22c55e'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#22c55e'
      }
    });

    // add a click handler to show a popup
    const onClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
      if (!features || !features.length) return;
      const f = features[0];
      const props = f.properties || {};
      const coordinates = f.geometry.coordinates.slice();
      const name = props.name || 'Unknown';
      const category = props.category || '';
      const tags = props.tags ? JSON.parse(props.tags) : {};

      // build HTML
      const html = `<div style="min-width:180px"><strong>${name}</strong><div style="font-size:12px;color:#555">${category}</div><details style="margin-top:6px;font-size:12px"><summary>Tags</summary><pre style=\"white-space:pre-wrap;max-height:200px;overflow:auto;\">${JSON.stringify(tags, null, 2)}</pre></details></div>`;

      // ensure popup uses correct lng/lat order
      const lngLat = coordinates;
      // create popup
      const popup = new maplibregl.Popup({ offset: 12 }).setLngLat(lngLat).setHTML(html).addTo(map);
    };

    map.on('click', layerId, onClick);

    // remove click handler on cleanup
    return () => {
      if (!map) return;
      try { map.off('click', layerId, onClick); } catch (e) {}
      if (map.getLayer(layerId)) try { map.removeLayer(layerId); } catch (e) {}
      if (map.getSource(sourceId)) try { map.removeSource(sourceId); } catch (e) {}
    };
  }, [data, map, isLoaded, layerId, sourceId]);

  // refetch when selectedCategories, selectedLocation, center (map move) or nearbyRefreshTick changes
  useEffect(() => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    refetch();
  }, [JSON.stringify(selectedCategories || []), lat, lng, center?.lat, center?.lng, nearbyRefreshTick]);

  return null;
}
