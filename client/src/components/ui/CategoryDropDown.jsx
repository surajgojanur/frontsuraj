import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Label } from "@/components/ui/label";

// Combined category list
const CATEGORY_OPTIONS = [
  { label: "Cafe", value: "amenity=cafe" },
  { label: "Restaurant", value: "amenity=restaurant" },
  { label: "Bank", value: "amenity=bank" },
  { label: "School", value: "amenity=school" },
  { label: "Hospital", value: "amenity=hospital" },
  { label: "Bar", value: "amenity=bar" },
  { label: "Bakery", value: "shop=bakery" },
  { label: "Grocery", value: "shop=grocery" },
  { label: "Supermarket", value: "shop=supermarket" },
  { label: "Clothes", value: "shop=clothes" },
  { label: "Electronics", value: "shop=electronics" },
  { label: "Convenience Store", value: "shop=convenience" },
  { label: "Gym", value: "leisure=fitness_centre" },
  { label: "Petrol Bunk", value: "amenity=fuel" },
  { label: "Police Station", value: "amenity=police" },
  { label: "College", value: "amenity=college" },
  { label: "Cinema Theater", value: "amenity=cinema" }
];

export default function CategoryDropDown({ onChange } = {}) {
  const { competitorCategories, setCompetitorCategories, setNearbyRefreshTick } =
    useAppContext();

  const selected = competitorCategories[0] || "";

  const handleSelect = (e) => {
    const newValue = e.target.value;
    const next = newValue ? [newValue] : [];

    setCompetitorCategories(next); // only ONE category

    if (typeof onChange === "function") {
      onChange(next); // always array for compatibility
    }

    setNearbyRefreshTick((t) => (t || 0) + 1); // refresh map
  };

  return (
    <div className="space-y-2">
      <Label>Select Category</Label>

      <select
        value={selected}
        onChange={handleSelect}
        className="w-full p-2 border rounded-md bg-white"
      >
        <option value="">-- Select Category --</option>

        {CATEGORY_OPTIONS.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
    </div>
  );
}