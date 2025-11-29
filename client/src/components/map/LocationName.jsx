import React, { useEffect, useState } from "react";
import axios from "axios";
import { useMapContext } from "@/context/MapContext";

export default function LocationName() {
  const { map, isLoaded } = useMapContext();
  const [address, setAddress] = useState("Move map to load location...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !map) return;

    const fetchAddress = async () => {
      const center = map.getCenter();
      const lat = center.lat;
      const lon = center.lng;

      setLoading(true);

      try {
        const res = await axios.post("/api/address", null, {
          params: { lat, lon },
        });

        const place =
          res.data?.results?.[0]?.formatted_address ||
          res.data?.address ||
          "Unknown location";

        setAddress(place);
      } catch (err) {
        console.error("Reverse Geocode Error:", err);
        setAddress("Failed to load address");
      } finally {
        setLoading(false);
      }
    };

    // on movement end
    map.on("moveend", fetchAddress);

    // initial call
    fetchAddress();

    return () => map.off("moveend", fetchAddress);
  }, [map, isLoaded]);

  return (
    <div className="p-4 bg-white rounded shadow text-sm border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-2">📍 Current Location</h3>

      <p className="text-gray-600 break-words">
        {loading ? "Loading..." : address}
      </p>
    </div>
  );
}