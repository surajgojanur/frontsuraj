import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAppContext } from '@/context/AppContext';
import AddressInput from '@/components/ui/AddressInput';
import CategorySelect from '@/components/ui/CategorySelect';
import PrioritySliders from '@/components/ui/PrioritySliders';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Footprints, Car } from 'lucide-react';
import CategoryDropDown from '../components/ui/CategoryDropDown';

export default function Sidebar() {
  const { filters, setFilters, mode, setSelectedLocation, selectedLocation } = useAppContext();

  if (mode === 'compare') return null; // Sidebar hidden or different in compare mode

  return (
    <div className="h-full flex flex-col bg-white border-r shadow-xl z-10 w-80">
      <div className="p-4 border-b">
        <h1 className="font-bold text-xl tracking-tight text-primary flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Greenfield Radar logo"
            className="h-7 w-7 object-contain"
          />
          Greenfield Radar
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Micro-market opportunity detection</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Target Location</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pick a spot by typing an address or clicking anywhere on the map.
            </p>
            <AddressInput
              searchOrigin={selectedLocation}
              onSelect={(location) =>
                setSelectedLocation({
                  ...location,
                  latitude: location.lat,
                  longitude: location.lng,
                  source: 'search',
                  updatedAt: Date.now(),
                })
              }
            />
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Market Analysis</h2>
            <CategoryDropDown />
            <CategorySelect />
          </section>

        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-secondary/20">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0 • Greenfield Radar System
        </div>
      </div>
    </div>
  );
}
