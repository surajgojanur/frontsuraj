import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapContext } from '@/context/MapContext';
import { useAppContext } from '@/context/AppContext';

const SOURCE_ID = 'competitor-places-source';
const LAYER_ID = 'competitor-places-layer';
const COMPETITOR_COLOR = '#ef4444';

function sanitizeResults(data) {
  if (!data || !Array.isArray(data?.results)) {
    return [];
  }

  return data.results
    .map((item, index) => {
      const latitude = Number.parseFloat(
        item?.latitude ?? item?.lat ?? item?.location?.lat
      );
      const longitude = Number.parseFloat(
        item?.longitude ?? item?.lng ?? item?.lon ?? item?.location?.lng
      );

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        id: item?.id ?? `${latitude}-${longitude}-${index}`,
        latitude,
        longitude,
        name: item?.name ?? item?.tags?.name ?? 'Unknown',
        category:
          item?.category ?? item?.tags?.amenity ?? item?.tags?.shop ?? 'unknown',
      };
    })
    .filter(Boolean);
}

export default function CompetitorLayer() {
  const { map, isLoaded } = useMapContext();
  const { selectedLocation, competitorCategories } = useAppContext();
  const [competitors, setCompetitors] = useState([]);

  useEffect(() => {
    if (
      !selectedLocation ||
      !Array.isArray(competitorCategories) ||
      competitorCategories.length === 0
    ) {
      setCompetitors([]);
      return;
    }

    const latitude =
      selectedLocation.lat ?? selectedLocation.latitude ?? null;
    const longitude =
      selectedLocation.lng ?? selectedLocation.longitude ?? null;

    if (latitude == null || longitude == null) {
      setCompetitors([]);
      return;
    }

    const categoriesPayload = Array.from(
      new Set(competitorCategories)
    ).filter(Boolean);

    if (!categoriesPayload.length) {
      setCompetitors([]);
      return;
    }

    fetch('/api/places-nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: Number(latitude),
        longitude: Number(longitude),
        categories: categoriesPayload,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed (${response.status})`);
        }

        return response.json();
      })
      .then((payload) => {
        setCompetitors(sanitizeResults(payload));
      })
      .catch((error) => {
        console.error('CompetitorLayer error:', error);
        setCompetitors([]);
      });
  }, [selectedLocation, JSON.stringify(competitorCategories || [])]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (map.getLayer(LAYER_ID)) {
      map.removeLayer(LAYER_ID);
    }
    if (map.getSource(SOURCE_ID)) {
      map.removeSource(SOURCE_ID);
    }

    if (!competitors.length) return;

    const geojson = {
      type: 'FeatureCollection',
      features: competitors.map((place) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [place.longitude, place.latitude],
        },
        properties: {
          id: place.id,
          name: place.name,
          category: place.category,
        },
      })),
    };

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: geojson,
    });

    map.addLayer({
      id: LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 6,
        'circle-color': COMPETITOR_COLOR,
        'circle-stroke-width': 2,
        'circle-stroke-color': COMPETITOR_COLOR,
      },
    });

    const handleClick = (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [LAYER_ID],
      });
      if (!features.length) return;

      const feature = features[0];
      new maplibregl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(
          `<div style="min-width:150px"><strong>${feature.properties.name}</strong><div style="font-size:12px;color:#555">${feature.properties.category}</div></div>`
        )
        .addTo(map);
    };

    map.on('click', LAYER_ID, handleClick);

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      map.off('click', LAYER_ID, handleClick);
    };
  }, [map, isLoaded, competitors]);

  return null;
}
