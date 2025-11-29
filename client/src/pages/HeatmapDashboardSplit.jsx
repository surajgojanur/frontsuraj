import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
// Note: Ensure you have these packages installed:
// bun add maplibre-gl react-icons recharts
// Tailwind CSS is used for styling. This component is a single-file dashboard
// that exports a React component as default. It renders a 50/50 split layout:
// left side: MapLibre map with heatmap layer; right side: analytics cards, charts, table.

export default function HeatmapDashboardSplit({
  initialLat = 12.9716,
  initialLng = 77.5946,
  initialZoom = 12,
  fetchUrl = "/api/coffee-shops",
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Data state
  const [shops, setShops] = useState([]); // raw result array
  const [count, setCount] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState({ lat: initialLat, lng: initialLng });
  const [radiusKm, setRadiusKm] = useState(2);
  const [category, setCategory] = useState("all");
  const [heatIntensity, setHeatIntensity] = useState(1.2);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Chart-friendly data
  const [hotspots, setHotspots] = useState([]);

  // Helper: convert shop list to GeoJSON
  function shopsToGeoJSON(list) {
    return {
      type: "FeatureCollection",
      features: list.map((s) => ({
        type: "Feature",
        properties: {
          id: s.id,
          name: s.name,
          category: s.category,
          weight: s.weight ?? 1,
        },
        geometry: {
          type: "Point",
          coordinates: [s.longitude, s.latitude],
        },
      })),
    };
  }

  // Fetch shops from backend using selectedLocation, radiusKm and category
  async function fetchShops() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("lat", selectedLocation.lat);
      params.append("lng", selectedLocation.lng);
      params.append("radius_km", radiusKm);
      if (category && category !== "all") params.append("category", category);

      const resp = await fetch(`${fetchUrl}?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const results = data.results ?? data.items ?? [];
      setShops(results);
      setCount(data.count ?? results.length);

      // derive simple hotspots: cluster by rounding coords to 3 decimals
      const buckets = {};
      results.forEach((r) => {
        const key = `${Number(r.latitude).toFixed(3)},${Number(r.longitude).toFixed(3)}`;
        buckets[key] = buckets[key] ? buckets[key] + 1 : 1;
      });
      const clusterArray = Object.entries(buckets).map(([k, v]) => {
        const [lat, lng] = k.split(",").map(Number);
        return { lat, lng, count: v };
      });
      clusterArray.sort((a, b) => b.count - a.count);
      setClusters(clusterArray.slice(0, 10));

      // hotspots for charting
      setHotspots(clusterArray.slice(0, 8).map((c, i) => ({ name: `H${i + 1}`, value: c.count })));
    } catch (err) {
      console.error("fetchShops error", err);
    } finally {
      setLoading(false);
    }
  }

  // Init map
  useEffect(() => {
    if (mapRef.current) return; // already initialized

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
          },
        ],
      },
      center: [initialLng, initialLat],
      zoom: initialZoom,
    });

    mapRef.current.on("load", () => {
      setIsMapReady(true);
    });

    // click to set center
    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lat, lng });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update heatmap source/layer whenever shops or heatIntensity changes
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapRef.current;

    // remove existing source/layer safely
    if (map.getLayer("shops-heatmap")) map.removeLayer("shops-heatmap");
    if (map.getSource("shops-source")) map.removeSource("shops-source");
    if (map.getLayer("shops-circle")) map.removeLayer("shops-circle");

    const geojson = shopsToGeoJSON(shops);

    map.addSource("shops-source", {
      type: "geojson",
      data: geojson,
      cluster: false,
    });

    // heatmap layer
    map.addLayer({
      id: "shops-heatmap",
      type: "heatmap",
      source: "shops-source",
      maxzoom: 18,
      paint: {
        // weight by property weight
        "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 6, 1],
        "heatmap-intensity": heatIntensity,
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 12, 30, 16, 60],
        "heatmap-opacity": 0.9,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(0,0,255,0)",
          0.2, "rgb(54,144,192)",
          0.4, "rgb(102,194,165)",
          0.6, "rgb(255,255,102)",
          0.8, "rgb(253,141,60)",
          1, "rgb(240,59,32)",
        ],
      },
    });

    // optional: add small circles for points at high zoom
    map.addLayer({
      id: "shops-circle",
      type: "circle",
      source: "shops-source",
      minzoom: 14,
      paint: {
        "circle-radius": 4,
        "circle-stroke-width": 1,
        "circle-opacity": 0.9,
        "circle-color": "#333",
        "circle-stroke-color": "#fff",
      },
    });
  }, [isMapReady, shops, heatIntensity]);

  // whenever selected location, radius or category changes, fetch
  useEffect(() => {
    fetchShops();
    // also move map center to selectedLocation
    if (mapRef.current) {
      mapRef.current.easeTo({ center: [selectedLocation.lng, selectedLocation.lat], duration: 800 });
    }
  }, [selectedLocation, radiusKm, category]);

  // UI event handlers
  function onRadiusChange(e) {
    setRadiusKm(Number(e.target.value));
  }

  function onIntensityChange(e) {
    setHeatIntensity(Number(e.target.value));
  }

  function onCategoryChange(e) {
    setCategory(e.target.value);
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Heatmap Analytics — Split View</h1>
        <div className="text-sm text-gray-600">Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Map (50%) */}
        <div className="w-1/2 relative">
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Floating controls */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow p-3 w-72">
            <div className="mb-2 text-sm font-medium">Filters</div>
            <label className="block text-xs text-gray-500">Radius (km): {radiusKm}</label>
            <input type="range" min="0.5" max="10" step="0.5" value={radiusKm} onChange={onRadiusChange} className="w-full" />

            <label className="block mt-2 text-xs text-gray-500">Category</label>
            <select value={category} onChange={onCategoryChange} className="w-full border rounded px-2 py-1 text-sm">
              <option value="all">All</option>
              <option value="cafe">Cafe</option>
              <option value="restaurant">Restaurant</option>
              <option value="bakery">Bakery</option>
            </select>

            <label className="block mt-2 text-xs text-gray-500">Heat intensity</label>
            <input type="range" min="0.2" max="3" step="0.1" value={heatIntensity} onChange={onIntensityChange} className="w-full" />

            <div className="mt-2 flex gap-2">
              <button className="text-sm px-3 py-1 bg-blue-600 text-white rounded" onClick={() => fetchShops()}>
                Refresh
              </button>
              <button className="text-sm px-3 py-1 bg-gray-100 rounded" onClick={() => { setCategory("all"); setRadiusKm(2); setHeatIntensity(1.2); }}>
                Reset
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-600">Click on the map to recenter.</div>
          </div>
        </div>

        {/* Right: Analytics (50%) */}
        <div className="w-1/2 overflow-auto p-6 bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="text-xs text-gray-500">Total Places</div>
              <div className="text-2xl font-bold">{loading ? "..." : count}</div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <div className="text-xs text-gray-500">Active Hotspots</div>
              <div className="text-2xl font-bold">{clusters.length}</div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm col-span-2">
              <div className="text-xs text-gray-500">Top Hotspots (approx coords)</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {clusters.length === 0 && <div className="text-sm text-gray-500">No hotspots yet</div>}
                {clusters.map((c, i) => (
                  <div key={`${c.lat}-${c.lng}`} className="p-2 bg-gray-100 rounded">
                    <div className="text-sm font-medium">Hotspot {i + 1}</div>
                    <div className="text-xs text-gray-600">{c.lat.toFixed(4)}, {c.lng.toFixed(4)}</div>
                    <div className="text-xs text-gray-700">Count: {c.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm col-span-2">
              <div className="text-xs text-gray-500">Hotspot Distribution (Top 8)</div>
              <div className="mt-3">
                {/* Simple bar-like list to avoid external chart deps in this file — it's easy to swap for Recharts */}
                <div className="space-y-2">
                  {hotspots.map((h, idx) => (
                    <div key={h.name} className="flex items-center gap-3">
                      <div className="w-8 text-xs">{h.name}</div>
                      <div className="flex-1 bg-gray-200 rounded h-5 overflow-hidden">
                        <div style={{ width: `${Math.min(100, (h.value / Math.max(1, hotspots[0]?.value || 1)) * 100)}%` }} className="h-5 rounded bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500"></div>
                      </div>
                      <div className="w-8 text-right text-xs">{h.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Nearby Places (first 25)</div>
                <div className="text-xs text-gray-400">{shops.length} loaded</div>
              </div>

              <div className="mt-3 max-h-56 overflow-auto">
                <table className="w-full text-sm table-auto">
                  <thead className="text-left text-xs text-gray-500 sticky top-0 bg-white">
                    <tr>
                      <th className="px-2 py-1 w-8">#</th>
                      <th className="px-2 py-1">Name</th>
                      <th className="px-2 py-1 w-24">Category</th>
                      <th className="px-2 py-1 w-20">Dist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.slice(0, 25).map((s, i) => {
                      // compute approximate straight-line distance (km)
                      const R = 6371; // km
                      const dLat = (s.latitude - selectedLocation.lat) * Math.PI / 180;
                      const dLon = (s.longitude - selectedLocation.lng) * Math.PI / 180;
                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(selectedLocation.lat * Math.PI/180) * Math.cos(s.latitude * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                      const d = R * c;

                      return (
                        <tr key={s.id ?? i} className="border-t">
                          <td className="px-2 py-2 align-top">{i + 1}</td>
                          <td className="px-2 py-2 align-top">{s.name}</td>
                          <td className="px-2 py-2 align-top text-xs text-gray-600">{s.category ?? "-"}</td>
                          <td className="px-2 py-2 align-top text-xs text-gray-600">{d.toFixed(2)} km</td>
                        </tr>
                      );
                    })}
                    {shops.length === 0 && (
                      <tr><td colSpan={4} className="px-2 py-4 text-sm text-gray-500">No places found for current filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
