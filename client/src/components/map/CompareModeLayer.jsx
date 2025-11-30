import React from 'react';
import IsochroneLayer from './IsochroneLayer';
import TileHeatmapLayer from './TileHeatmapLayer';
import SelectedPinMarker from './SelectedPinMarker';

export default function CompareModeLayer({ locationA, dataA, locationB, dataB, heatmapEnabled = true }) {
  return (
    <>
      {/* Location A Layers */}
      <IsochroneLayer data={dataA?.isochrone} idPrefix="locA" />
      {heatmapEnabled && (
        <TileHeatmapLayer data={dataA?.tiles} heatmap={dataA?.heatmap} idPrefix="locA" />
      )}
      <SelectedPinMarker location={locationA} color="#22c55e" />

      {/* Location B Layers */}
      <IsochroneLayer data={dataB?.isochrone} idPrefix="locB" />
      {heatmapEnabled && (
        <TileHeatmapLayer data={dataB?.tiles} heatmap={dataB?.heatmap} idPrefix="locB" />
      )}
      <SelectedPinMarker location={locationB} color="#22c55e" />
    </>
  );
}
