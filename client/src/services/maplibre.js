import maplibregl from 'maplibre-gl';

// Using a free vector tile style (OSM Bright)
const STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

export const initializeMap = (container) => {
  const map = new maplibregl.Map({
    container,
    style: STYLE_URL,
  center: [77.5343, 12.9337],
  zoom: 12,
  pitch: 55,
  bearing: -20,
    antialias: true,
  });

  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  
  return map;
};
