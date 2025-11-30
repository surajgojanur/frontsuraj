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
        <h1 className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
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
            
            {/* <div className="space-y-2">
               <label className="text-sm font-medium">Transport Mode</label>
               <Tabs 
                 value={filters.transport} 
                 onValueChange={(v) => setFilters(prev => ({...prev, transport: v}))}
                 className="w-full"
               >
                 <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="walking"><Footprints className="w-4 h-4 mr-2"/> Walking</TabsTrigger>
                   <TabsTrigger value="driving"><Car className="w-4 h-4 mr-2"/> Driving</TabsTrigger>
                 </TabsList>
               </Tabs>
            </div> */}

            {/* <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Time Budget
                <span className="text-muted-foreground font-normal">{filters.timeBudget} min</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="30" 
                step="5"
                className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                value={filters.timeBudget}
                onChange={(e) => setFilters(prev => ({...prev, timeBudget: parseInt(e.target.value)}))}
              />
            </div> */}
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Market Analysis</h2>
            <CategoryDropDown />
            <CategorySelect />
            {/* <PrioritySliders /> */}
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
