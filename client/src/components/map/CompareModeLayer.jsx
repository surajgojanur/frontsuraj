import React from 'react';
import IsochroneLayer from './IsochroneLayer';
import TileHeatmapLayer from './TileHeatmapLayer';
import SelectedPinMarker from './SelectedPinMarker';

export default function CompareModeLayer({ locationA, dataA, locationB, dataB }) {
  return (
    <>
      {/* Location A Layers */}
      <IsochroneLayer data={dataA?.isochrone} idPrefix="locA" />
      <TileHeatmapLayer data={dataA?.tiles} idPrefix="locA" />
  <SelectedPinMarker location={locationA} color="#22c55e" />

      {/* Location B Layers */}
      <IsochroneLayer data={dataB?.isochrone} idPrefix="locB" />
      <TileHeatmapLayer data={dataB?.tiles} idPrefix="locB" />
  <SelectedPinMarker location={locationB} color="#22c55e" />
    </>
  );
}
