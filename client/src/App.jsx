import React from 'react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { MapProvider } from '@/context/MapContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import MapContainer from '@/components/map/MapContainer';
import Sidebar from '@/layout/Sidebar';
import Toolbar from '@/layout/Toolbar';
// import SummaryCard from '@/components/ui/SummaryCard';
// import ComparePanel from '@/components/ui/ComparePanel';
import IsochroneLayer from '@/components/map/IsochroneLayer';
import TileHeatmapLayer from '@/components/map/TileHeatmapLayer';
import POILayer from '@/components/map/POILayer';
import NearbyPlacesLayer from '@/components/map/NearbyPlacesLayer';
import CoffeeShopsLayer from '@/components/map/CoffeeShopsLayer';
import SelectedPinMarker from '@/components/map/SelectedPinMarker';
import CompareModeLayer from '@/components/map/CompareModeLayer';
import TopTilesLayer from '@/components/map/TopTilesLayer';
import { useScoreLocation } from '@/hooks/useScoreLocation';
import { useCompareLocations } from '@/hooks/useCompareLocations';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeatmapDashboardSplit from "@/pages/HeatmapDashboardSplit";

const queryClient = new QueryClient();

function AppContent() {
  const { mode, selectedLocation, compareLocationA, compareLocationB, filters, priorities } = useAppContext();
  
  const { data: scoreData, isLoading: scoreLoading } = useScoreLocation(
    selectedLocation, 
    filters, 
    priorities
  );

  const compareData = useCompareLocations(
    compareLocationA, 
    compareLocationB, 
    filters, 
    priorities
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Left */}
      <Sidebar />

      {/* Main Content - Map */}
      <div className="flex-1 relative">
        <MapContainer>
          {mode === 'scoring' ? (
            <>
              <IsochroneLayer data={scoreData?.isochrone} />
              <TileHeatmapLayer data={scoreData?.tiles} />
              <TopTilesLayer data={scoreData?.topTiles} />
              <POILayer data={scoreData?.pois} />
              <NearbyPlacesLayer />
              <CoffeeShopsLayer />
              <SelectedPinMarker location={selectedLocation} />
            </>
          ) : (
            <CompareModeLayer 
              locationA={compareLocationA}
              dataA={compareData.locationA}
              locationB={compareLocationB}
              dataB={compareData.locationB}
            />
          )}
        </MapContainer>

        <Toolbar />

        {/* Floating Summary Card (Scoring Mode) */}
        {mode === 'scoring' && selectedLocation && (
          <div className="absolute top-4 left-4 w-80 z-20">
             {/* Sidebar is on the left, so let's put this on the right or floating if sidebar is closed? 
                 Actually prompt says: "C. Right Summary Panel". 
                 Sidebar is Left. Main Map Area. Right Summary Panel.
             */}
          </div>
        )}
        
        {/* Right Panel */}
        {/* <div className="absolute top-0 right-0 h-full w-80 pointer-events-none flex flex-col justify-end p-4 z-10">
           {mode === 'scoring' ? (
             <div className="pointer-events-auto">
               <SummaryCard data={scoreData} loading={scoreLoading} />
             </div>
           ) : (
             <div className="pointer-events-auto h-full">
               <ComparePanel data={compareData} loading={compareData.isLoading} />
             </div>
           )}
        </div> */}
      </div>
    </div>
  );
}





export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <MapProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>

              {/* Existing Root */}
              <Route path="/" element={<AppContent />} />

              {/* ➕ Add Heatmap Dashboard Page */}
              <Route path="/heatmap-dashboard" element={<HeatmapDashboardSplit />} />

            </Routes>
          </BrowserRouter>
        </MapProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}