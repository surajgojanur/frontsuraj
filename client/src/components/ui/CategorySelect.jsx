import React from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Coffee,
  Utensils,
  Building2,
  GraduationCap,
  Hospital,
  Beer,
  ShoppingBag,
  Shirt,
  Store,
  Laptop,
  ShoppingCart,
  Dumbbell,
  Fuel,
  Shield,
  BookOpen,
  Clapperboard,
} from "lucide-react";

const CATEGORY_DEFINITIONS = [
  { value: "amenity=cafe", label: "Cafe", icon: Coffee },
  { value: "amenity=restaurant", label: "Restaurant", icon: Utensils },
  { value: "amenity=bank", label: "Bank", icon: Building2 },
  { value: "amenity=school", label: "School", icon: GraduationCap },
  { value: "amenity=hospital", label: "Hospital", icon: Hospital },
  { value: "amenity=bar", label: "Bar", icon: Beer },
  { value: "shop=bakery", label: "Bakery", icon: Store },
  { value: "shop=grocery", label: "Grocery", icon: ShoppingCart },
  { value: "shop=supermarket", label: "Supermarket", icon: ShoppingBag },
  { value: "shop=clothes", label: "Clothes", icon: Shirt },
  { value: "shop=electronics", label: "Electronics", icon: Laptop },
  { value: "shop=convenience", label: "Convenience", icon: Store },
  { value: "leisure=fitness_centre", label: "Gym", icon: Dumbbell },
  { value: "amenity=fuel", label: "Petrol Bunk", icon: Fuel },
  { value: "amenity=police", label: "Police Station", icon: Shield },
  { value: "amenity=college", label: "College", icon: BookOpen },
  { value: "amenity=cinema", label: "Cinema Theater", icon: Clapperboard },
];

export default function CategorySelect({ onChange } = {}) {
  const { plusCategories, setPlusCategories, setNearbyRefreshTick } =
    useAppContext();

  const toggleCategory = (cat) => {
    setPlusCategories((prev) => {
      const exists = prev.includes(cat);
      const next = exists ? prev.filter((c) => c !== cat) : [...prev, cat];

      if (typeof onChange === "function") onChange(next);
      setNearbyRefreshTick((tick) => (tick || 0) + 1);

      return next;
    });
  };

  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">🎯 Targeted Customer</h2>
      <p className="text-sm text-muted-foreground">
        Select customer types to customize targeted reach
      </p>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_DEFINITIONS.map(({ value, label, icon: Icon }) => {
          const selected = plusCategories.includes(value);

          return (
            <button
              key={value}
              onClick={() => toggleCategory(value)}
              className={`
                flex items-center gap-2 p-3 rounded-lg border transition
                ${selected
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white hover:bg-accent border-border"}
              `}
            >
              <Icon
                className={`h-5 w-5 ${selected ? "text-white" : "text-primary"}`}
              />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}