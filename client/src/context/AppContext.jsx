import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [mode, setMode] = useState('scoring'); // 'scoring' | 'compare'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [compareLocationA, setCompareLocationA] = useState(null);
  const [compareLocationB, setCompareLocationB] = useState(null);
  
  const [priorities, setPriorities] = useState({
    competition: 50,
    footfall: 50,
    amenities: 50,
  });

  const [filters, setFilters] = useState({
    transport: 'driving', // 'walking' | 'driving'
    timeBudget: 10,
    category: 'coffee',
  });

  // plusCategories drives our own locations (green points)
  const [plusCategories, setPlusCategories] = useState(['shop=bakery']);
  // competitorCategories drives competitor locations (red points)
  const [competitorCategories, setCompetitorCategories] = useState([]);
  // simple tick to request nearby refetches when categories change
  const [nearbyRefreshTick, setNearbyRefreshTick] = useState(0);

  return (
    <AppContext.Provider value={{
      mode, setMode,
      selectedLocation, setSelectedLocation,
      compareLocationA, setCompareLocationA,
      compareLocationB, setCompareLocationB,
      priorities, setPriorities,
      filters, setFilters,
      plusCategories, setPlusCategories,
      competitorCategories, setCompetitorCategories,
      nearbyRefreshTick, setNearbyRefreshTick
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
