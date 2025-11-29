import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapContext } from '@/context/MapContext';

export default function SelectedPinMarker({ location, color = '#22c55e' }) {
  const { map, isLoaded } = useMapContext();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (location) {
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color })
          .setLngLat([location.lng, location.lat])
          .addTo(map);
      } else {
        markerRef.current.setLngLat([location.lng, location.lat]);
      }
      
      // Fly to location on first set or update (optional, maybe disruptive if moving a lot)
      // Only fly if distance is significant?
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: 14,
        essential: true
      });
      
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, isLoaded, location, color]);

  return null;
}
