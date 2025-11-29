import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";  // If you use shadcn switch
import { Button } from "@/components/ui/button";  // optional
import { ScrollArea } from "@/components/ui/scroll-area"; // optional

export default function RightPanelList({ items = [], title = "Items" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-0 right-0 h-full z-30 flex flex-col">

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -left-14 top-4 bg-primary text-white px-3 py-1 rounded shadow"
      >
        {open ? "Close" : "Show"}
      </button>

      {/* Slide-In Panel */}
      <div
        className={cn(
          "h-full w-80 bg-white border-l shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>

          {/* ShadCN Switch Toggle (open/close) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">On</span>
            <Switch checked={open} onCheckedChange={setOpen} />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="h-[calc(100%-60px)] p-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No items found.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="p-3 rounded border bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="font-medium">{item.name ?? "Unknown"}</p>
                  <p className="text-xs text-gray-600">
                    {item.category ?? "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}