'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';

interface ImageSegmentationProps {
  imageUrl: string;
  toolType?: 'rectangle' | 'polygon' | 'both';
  allowMultiple?: boolean;
  onAreaSelected: (coordinates: any) => void;
}

export function ImageSegmentation({
  imageUrl,
  toolType = 'polygon',
  allowMultiple = false,
  onAreaSelected,
}: ImageSegmentationProps) {
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);

  // Simulated area selection for POC
  const handleSimulateSelection = () => {
    const mockArea = {
      type: toolType,
      coordinates: toolType === 'polygon' 
        ? [[100, 100], [200, 100], [200, 200], [100, 200]] // Mock polygon
        : { x: 100, y: 100, width: 100, height: 100 }, // Mock rectangle
      timestamp: new Date().toISOString(),
    };

    if (allowMultiple) {
      const newAreas = [...areas, mockArea];
      setAreas(newAreas);
      setSelectedArea(mockArea);
    } else {
      setSelectedArea(mockArea);
    }
  };

  const handleConfirm = () => {
    if (allowMultiple && areas.length > 0) {
      onAreaSelected(areas);
    } else if (selectedArea) {
      onAreaSelected(selectedArea);
    }
  };

  const handleClear = () => {
    setSelectedArea(null);
    setAreas([]);
  };

  return (
    <div className="space-y-4">
      {/* Image Display */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        <div className="aspect-video flex items-center justify-center">
          {imageUrl ? (
            <div className="text-center p-8">
              <p className="text-sm text-gray-600 mb-2">Image: {imageUrl}</p>
              <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt="Segmentation Source" 
                  className="max-h-60 object-contain rounded-lg shadow-md"
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No image source provided</p>
          )}
        </div>

        {/* Selection overlay */}
        {selectedArea && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
            ✓ Area Selected
          </div>
        )}
      </div>

      {/* Tool Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Tool:</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
          {toolType === 'polygon' ? '📐 Polygon' : '▭ Rectangle'}
        </span>
        {allowMultiple && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
            Multiple areas allowed
          </span>
        )}
      </div>

      {/* Areas counter for multiple selection */}
      {allowMultiple && areas.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            {areas.length} area{areas.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Simulation Controls */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded space-y-3">
        <p className="text-xs text-yellow-800">
          🚧 POC Mode: Click to simulate area selection
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleSimulateSelection}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Simulate Selection
          </Button>
          {(selectedArea || areas.length > 0) && (
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={!selectedArea && areas.length === 0}
        className="w-full"
        size="lg"
      >
        {allowMultiple 
          ? `Confirm ${areas.length} Area${areas.length !== 1 ? 's' : ''}`
          : 'Confirm Area Selection'
        }
      </Button>
    </div>
  );
}
