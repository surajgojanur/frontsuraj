import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function HeatmapToggleControl({ className }) {
  const { heatmapEnabled, setHeatmapEnabled } = useAppContext();

  const handleToggle = () => {
    setHeatmapEnabled((prev) => !prev);
  };

  return (
    <div className={clsx('pointer-events-auto', className)}>
      <Button
        type="button"
        size="sm"
        variant={heatmapEnabled ? 'default' : 'outline'}
        className="shadow-md flex items-center gap-2"
        aria-pressed={heatmapEnabled}
        onClick={handleToggle}
      >
        {heatmapEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        <span className="text-xs font-medium uppercase tracking-wide">
          {heatmapEnabled ? 'Heatmap On' : 'Heatmap Off'}
        </span>
      </Button>
    </div>
  );
}
