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

  const [plusCategories, setPlusCategories] = useState(['shop=bakery']);
  const [competitorCategories, setCompetitorCategories] = useState([]);
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
