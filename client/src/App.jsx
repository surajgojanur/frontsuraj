import React from 'react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { MapProvider } from '@/context/MapContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import MapContainer from '@/components/map/MapContainer';
import Sidebar from '@/layout/Sidebar';
import IsochroneLayer from '@/components/map/IsochroneLayer';
import TileHeatmapLayer from '@/components/map/TileHeatmapLayer';
import CoffeeShopsLayer from '@/components/map/CoffeeShopsLayer';
import CompetitorLayer from '@/components/map/CompetitorLayer';
import SelectedPinMarker from '@/components/map/SelectedPinMarker';
import CompareModeLayer from '@/components/map/CompareModeLayer';
import TopTilesLayer from '@/components/map/TopTilesLayer';
import RadiusCircleLayer from '@/components/map/RadiusCircleLayer';
import HeatmapToggleControl from '@/components/map/HeatmapToggleControl';
import LegendControl from '@/components/map/LegendControl';
import ScorecardToggleControl from '@/components/map/ScorecardToggleControl';
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
    heatmapEnabled,
    scorecardVisible,
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
      <Sidebar />

      <div className="flex-1 relative">
        <MapContainer>
          {mode === 'scoring' ? (
            <>
              <RadiusCircleLayer radiusKm={2} />
              <IsochroneLayer data={scoreData?.isochrone} />
              {heatmapEnabled && (
                <TileHeatmapLayer data={scoreData?.tiles} heatmap={scoreData?.heatmap} />
              )}
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
              heatmapEnabled={heatmapEnabled}
            />
          )}
          <HeatmapToggleControl className="absolute right-16 bottom-20 z-30" />
          <ScorecardToggleControl className="absolute right-16 bottom-32 z-30" />
          <LegendControl className="absolute left-4 bottom-4 z-30" />
        </MapContainer>
        {mode === 'scoring' && scorecardVisible && (
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
              <Route path="/" element={<AppContent />} />
              <Route path="/heatmap-dashboard" element={<HeatmapDashboardSplit />} />
            </Routes>
          </BrowserRouter>
        </MapProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}