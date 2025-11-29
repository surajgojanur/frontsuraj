import React from 'react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { MapProvider } from '@/context/MapContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import MapContainer from '@/components/map/MapContainer';
import Sidebar from '@/layout/Sidebar';
// import Toolbar from '@/layout/Toolbar';
// import SummaryCard from '@/components/ui/SummaryCard';
// import ComparePanel from '@/components/ui/ComparePanel';
import IsochroneLayer from '@/components/map/IsochroneLayer';
import TileHeatmapLayer from '@/components/map/TileHeatmapLayer';
import CoffeeShopsLayer from '@/components/map/CoffeeShopsLayer';
import CompetitorLayer from '@/components/map/CompetitorLayer';
import SelectedPinMarker from '@/components/map/SelectedPinMarker';
import CompareModeLayer from '@/components/map/CompareModeLayer';
import TopTilesLayer from '@/components/map/TopTilesLayer';
import RadiusCircleLayer from '@/components/map/RadiusCircleLayer';
import LocationScoreCard from '@/components/ui/LocationScoreCard';
import { useScoreLocation } from '@/hooks/useScoreLocation';
import { useCompareLocations } from '@/hooks/useCompareLocations';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeatmapDashboardSplit from "@/pages/HeatmapDashboardSplit";

const queryClient = new QueryClient();

function AppContent() {
  const {
    mode,
    selectedLocation,
    compareLocationA,
    compareLocationB,
    filters,
    priorities,
    plusCategories,
    competitorCategories,
  } = useAppContext();
  
  const { data: scoreData, isLoading: scoreLoading } = useScoreLocation(
    selectedLocation, 
    filters, 
    priorities,
    plusCategories,
    competitorCategories
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
              <RadiusCircleLayer radiusKm={2} />
              <IsochroneLayer data={scoreData?.isochrone} />
              <TileHeatmapLayer data={scoreData?.tiles} />
              <TopTilesLayer data={scoreData?.topTiles} />
              <CoffeeShopsLayer />
              <CompetitorLayer />
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

        {/* <Toolbar /> */}

        {mode === 'scoring' && (
          <div className="absolute top-4 right-4 z-30">
            <LocationScoreCard data={scoreData} loading={scoreLoading} />
          </div>
        )}
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