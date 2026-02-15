// src/components/BOM/SheetLayoutVisualization.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Scissors, TrendingUp } from 'lucide-react';

interface BlankPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  isPrimary?: boolean;
  fromLeftover?: boolean;
  leftoverType?: string;
  rotation?: number;
}

interface LeftoverArea {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  orientation: string;
}

interface SheetLayoutData {
  direction: 'HORIZONTAL' | 'VERTICAL';
  sheetDimensions: {
    width: number;
    height: number;
  };
  blankDimensions: {
    width: number;
    height: number;
    actualWidth: number;
    actualHeight: number;
  };
  blanks: BlankPosition[];
  leftoverAreas: LeftoverArea[];
  extraBlanks: BlankPosition[];
  stats: {
    totalBlanks: number;
    primaryBlanks: number;
    extraBlanks: number;
    blanksAcross: number;
    blanksAlong: number;
    efficiency: number;
    scrapPercentage: number;
    usedArea: number;
    leftoverArea: number;
    totalSheetArea: number;
    leftoverWidth: number;
    leftoverLength: number;
  };
}

interface SheetLayoutVisualizationProps {
  layout: SheetLayoutData;
  title?: string;
  width?: number;
  height?: number;
  showStats?: boolean;
  highlightBest?: boolean;
  compact?: boolean;
}

const SheetLayoutVisualization: React.FC<SheetLayoutVisualizationProps> = ({
  layout,
  title,
  width = 500,
  height = 400,
  showStats = true,
  highlightBest = false,
  compact = false
}) => {
  if (!layout) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No layout data available
        </CardContent>
      </Card>
    );
  }

  const { sheetDimensions, blanks, leftoverAreas, extraBlanks, stats, direction } = layout;

  // Calculate scale to fit the sheet in the SVG viewport
  const padding = 40;
  const availableWidth = width - (padding * 2);
  const availableHeight = height - (padding * 2);
  
  const scaleX = availableWidth / sheetDimensions.width;
  const scaleY = availableHeight / sheetDimensions.height;
  const scale = Math.min(scaleX, scaleY);

  // Scaled dimensions
  const scaledSheetWidth = sheetDimensions.width * scale;
  const scaledSheetHeight = sheetDimensions.height * scale;

  // Center the sheet in the viewport
  const offsetX = (width - scaledSheetWidth) / 2;
  const offsetY = (height - scaledSheetHeight) / 2;

  // Helper function to scale and position rectangles
  const scaleRect = (rect: { x: number; y: number; width: number; height: number }) => ({
    x: offsetX + (rect.x * scale),
    y: offsetY + (rect.y * scale),
    width: rect.width * scale,
    height: rect.height * scale
  });

  const allBlanks = [...blanks, ...extraBlanks];

  return (
    <Card className={highlightBest ? 'border-2 border-green-500 shadow-lg' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            {title || `${direction} Cutting`}
            {highlightBest && (
              <Badge className="bg-green-600 text-white ml-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                Best
              </Badge>
            )}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {stats.efficiency.toFixed(1)}% Efficiency
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-3' : 'p-4'}>
        {/* SVG Visualization */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto border border-gray-300 rounded-lg bg-gray-50"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Sheet outline */}
          <rect
            x={offsetX}
            y={offsetY}
            width={scaledSheetWidth}
            height={scaledSheetHeight}
            fill="white"
            stroke="#94a3b8"
            strokeWidth="2"
            rx="4"
          />

          {/* Leftover areas (red/orange) */}
          {leftoverAreas.map((area, idx) => {
            const scaled = scaleRect(area);
            return (
              <rect
                key={`leftover-${idx}`}
                x={scaled.x}
                y={scaled.y}
                width={scaled.width}
                height={scaled.height}
                fill={area.type === 'corner' ? '#fca5a5' : '#fecaca'}
                fillOpacity="0.6"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
            );
          })}

          {/* Primary blanks (green) */}
          {blanks.map((blank) => {
            const scaled = scaleRect(blank);
            return (
              <g key={`blank-${blank.index}`}>
                <rect
                  x={scaled.x}
                  y={scaled.y}
                  width={scaled.width}
                  height={scaled.height}
                  fill="#86efac"
                  fillOpacity="0.8"
                  stroke="#22c55e"
                  strokeWidth="1.5"
                  rx="2"
                />
                {/* Blank number (only show if large enough) */}
                {scaled.width > 30 && scaled.height > 20 && (
                  <text
                    x={scaled.x + scaled.width / 2}
                    y={scaled.y + scaled.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#15803d"
                    fontWeight="600"
                  >
                    {blank.index + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Extra blanks from leftover (lighter green with pattern) */}
          {extraBlanks.map((blank) => {
            const scaled = scaleRect(blank);
            return (
              <g key={`extra-${blank.index}`}>
                <rect
                  x={scaled.x}
                  y={scaled.y}
                  width={scaled.width}
                  height={scaled.height}
                  fill="#bbf7d0"
                  fillOpacity="0.9"
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeDasharray="3,2"
                  rx="2"
                />
                {/* Extra blank indicator */}
                {scaled.width > 30 && scaled.height > 20 && (
                  <>
                    <text
                      x={scaled.x + scaled.width / 2}
                      y={scaled.y + scaled.height / 2 - 5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fill="#15803d"
                      fontWeight="600"
                    >
                      {blank.index + 1}
                    </text>
                    <text
                      x={scaled.x + scaled.width / 2}
                      y={scaled.y + scaled.height / 2 + 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="7"
                      fill="#16a34a"
                      fontWeight="500"
                    >
                      +
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Direction label */}
          <text
            x={width / 2}
            y={20}
            textAnchor="middle"
            fontSize="12"
            fill="#475569"
            fontWeight="600"
          >
            {direction}
          </text>

          {/* Dimensions label */}
          <text
            x={offsetX + scaledSheetWidth / 2}
            y={offsetY - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {sheetDimensions.width} × {sheetDimensions.height} mm
          </text>
        </svg>

        {/* Statistics */}
        {showStats && (
          <div className={`grid grid-cols-2 gap-2 ${compact ? 'mt-2' : 'mt-4'}`}>
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-700">{stats.totalBlanks}</div>
              <div className="text-xs text-green-600">Total Blanks</div>
              {stats.extraBlanks > 0 && (
                <div className="text-[10px] text-green-500 mt-0.5">
                  ({stats.primaryBlanks} + {stats.extraBlanks} extra)
                </div>
              )}
            </div>
            
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-700">
                {stats.efficiency.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600">Efficiency</div>
              <div className="text-[10px] text-red-500 mt-0.5">
                {stats.scrapPercentage.toFixed(1)}% scrap
              </div>
            </div>

            {!compact && (
              <>
                <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm font-semibold text-gray-700">
                    {stats.blanksAcross} × {stats.blanksAlong}
                  </div>
                  <div className="text-xs text-gray-600">Grid Pattern</div>
                </div>
                
                <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm font-semibold text-orange-700">
                    {stats.leftoverWidth.toFixed(0)} × {stats.leftoverLength.toFixed(0)}
                  </div>
                  <div className="text-xs text-orange-600">Leftover (mm)</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        {!compact && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-300 border border-green-500 rounded"></div>
              <span className="text-gray-600">Primary Blanks</span>
            </div>
            {stats.extraBlanks > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 border border-green-500 border-dashed rounded"></div>
                <span className="text-gray-600">From Leftover</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 border border-red-400 border-dashed rounded"></div>
              <span className="text-gray-600">Scrap</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SheetLayoutVisualization;

