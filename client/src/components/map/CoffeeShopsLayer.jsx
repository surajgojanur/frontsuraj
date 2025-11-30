import React, { useEffect, useState } from 'react';
import { useMapContext } from '@/context/MapContext';
import { useAppContext } from '@/context/AppContext';
import maplibregl from 'maplibre-gl';
import { buildAddress } from '@/lib/nearby';

const DEFAULT_PLUS_CATEGORIES = ['shop=bakery'];

export default function CoffeeShopsLayer() {
  const { map, isLoaded } = useMapContext();
  const { selectedLocation, plusCategories } = useAppContext();
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [loading, setLoading] = useState(false);

  const sourceId = 'coffee-shops-source';
  const layerId = 'coffee-shops-layer';
  const labelLayerId = 'coffee-shops-label-layer';

  // Fetch coffee shops when selectedLocation changes
  useEffect(() => {
    if (!selectedLocation) {
      setCoffeeShops([]);
      return;
    }

    // Safe extraction of coordinates
    const latitude =
      selectedLocation.lat ??
      selectedLocation.latitude ??
      null;

    const longitude =
      selectedLocation.lng ??
      selectedLocation.longitude ??
      null;

    // FIX: allow 0 but reject null/undefined
    if (latitude == null || longitude == null) {
      console.warn("Coordinates missing. Skipping fetch.");
      setCoffeeShops([]);
      return;
    }

    const categories = Array.from(new Set(plusCategories || DEFAULT_PLUS_CATEGORIES)).filter(Boolean);

    if (!categories.length) {
      setCoffeeShops([]);
      return;
    }

    setLoading(true);

    fetch('/api/places-nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: Number(latitude),
        longitude: Number(longitude),
        categories,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || `Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        const sanitized = (Array.isArray(data?.results) ? data.results : [])
          .map((item, index) => {
            const lat = Number.parseFloat(
              item?.latitude ?? item?.lat ?? item?.location?.lat
            );
            const lng = Number.parseFloat(
              item?.longitude ?? item?.lng ?? item?.lon ?? item?.location?.lng
            );

            const address = item?.address ?? buildAddress(item);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return null;
            }

            return {
              id: item?.id ?? `${lat}-${lng}-${index}`,
              latitude: lat,
              longitude: lng,
              name: item?.name ?? item?.tags?.name ?? 'Unknown',
              address,
              category: item?.category ?? item?.tags?.shop ?? 'coffee',
            };
          })
          .filter(Boolean);

        setCoffeeShops(sanitized);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching coffee shops:', err);
        setLoading(false);
      });
  }, [selectedLocation, JSON.stringify(plusCategories || DEFAULT_PLUS_CATEGORIES)]);

  // Map Layer Logic
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Remove previous layer/source
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getLayer(labelLayerId)) {
      map.removeLayer(labelLayerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    if (!coffeeShops.length) return;

    // Create GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: coffeeShops.map((shop) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [shop.longitude, shop.latitude],
        },
        properties: {
          id: shop.id,
          name: shop.name,
          address: shop.address,
          category: shop.category,
        },
      })),
    };

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
    });

    // Add layer
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 6,
        'circle-color': '#22c55e',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#22c55e',
      },
    });

    map.addLayer({
      id: labelLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': [
          'coalesce',
          ['get', 'address'],
          ['get', 'name']
        ],
        'text-offset': [1.1, 0],
        'text-anchor': 'left',
        'text-size': 12,
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#166534',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });

    // Popup Handler
    const onClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerId],
      });
      if (!features.length) return;

      const f = features[0];
      const props = f.properties;
      const coords = f.geometry.coordinates;

      new maplibregl.Popup()
        .setLngLat(coords)
        .setHTML(
          `<div style="min-width:180px"><strong>${props.name}</strong>${props.address ? `<div style="font-size:12px;color:#555;margin-top:4px;">${props.address}</div>` : ''}</div>`
        )
        .addTo(map);
    };

    map.on('click', layerId, onClick);

    return () => {
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      map.off('click', layerId, onClick);
    };
  }, [map, isLoaded, coffeeShops]);

  return null;
}