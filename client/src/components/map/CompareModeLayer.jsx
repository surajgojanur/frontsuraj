import React from 'react';
import IsochroneLayer from './IsochroneLayer';
import TileHeatmapLayer from './TileHeatmapLayer';
import POILayer from './POILayer';
import SelectedPinMarker from './SelectedPinMarker';

export default function CompareModeLayer({ locationA, dataA, locationB, dataB }) {
  return (
    <>
      {/* Location A Layers */}
      <IsochroneLayer data={dataA?.isochrone} idPrefix="locA" />
      <TileHeatmapLayer data={dataA?.tiles} idPrefix="locA" />
  <POILayer data={dataA?.pois} idPrefix="locA" />
  <SelectedPinMarker location={locationA} color="#22c55e" />

      {/* Location B Layers */}
      <IsochroneLayer data={dataB?.isochrone} idPrefix="locB" />
      <TileHeatmapLayer data={dataB?.tiles} idPrefix="locB" />
  <POILayer data={dataB?.pois} idPrefix="locB" />
  <SelectedPinMarker location={locationB} color="#22c55e" />
    </>
  );
}
