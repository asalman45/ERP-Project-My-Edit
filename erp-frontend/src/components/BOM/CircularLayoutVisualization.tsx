import React from 'react';
import { CircularLayout } from '@/utils/circularLayoutGenerator';

interface CircularLayoutVisualizationProps {
  layout: CircularLayout;
  title: string;
  width?: number;
  height?: number;
}

const CircularLayoutVisualization: React.FC<CircularLayoutVisualizationProps> = ({
  layout,
  title,
  width = 400,
  height = 320
}) => {
  const { circles, sheetWidth, sheetHeight, totalCircles, efficiency } = layout;
  
  // Calculate scale to fit the sheet in the visualization
  const scaleX = (width - 40) / sheetWidth;
  const scaleY = (height - 80) / sheetHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledSheetWidth = sheetWidth * scale;
  const scaledSheetHeight = sheetHeight * scale;
  const scaledDiameter = layout.circles[0]?.diameter * scale || 0;
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="text-sm text-gray-600">
          {totalCircles} circles • {efficiency}% efficiency
        </div>
      </div>
      
      <div className="flex justify-center">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="border border-gray-200 rounded"
        >
          {/* Sheet outline */}
          <rect
            x={20}
            y={40}
            width={scaledSheetWidth}
            height={scaledSheetHeight}
            fill="none"
            stroke="#374151"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Sheet label */}
          <text
            x={20 + scaledSheetWidth / 2}
            y={35}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            Sheet: {sheetWidth}×{sheetHeight}mm
          </text>
          
          {/* Circles */}
          {circles.map((circle, index) => (
            <circle
              key={circle.id}
              cx={20 + circle.x * scale}
              cy={40 + circle.y * scale}
              r={scaledDiameter / 2}
              fill="#3B82F6"
              fillOpacity="0.7"
              stroke="#1E40AF"
              strokeWidth="1"
            />
          ))}
          
          {/* Legend */}
          <g>
            <circle
              cx={20}
              cy={height - 20}
              r={scaledDiameter / 2}
              fill="#3B82F6"
              fillOpacity="0.7"
              stroke="#1E40AF"
              strokeWidth="1"
            />
            <text
              x={20 + scaledDiameter / 2 + 5}
              y={height - 15}
              className="text-xs fill-gray-600"
            >
              Circle: {layout.circles[0]?.diameter || 0}mm
            </text>
          </g>
        </svg>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total Circles:</span>
          <span className="ml-2 font-medium">{totalCircles}</span>
        </div>
        <div>
          <span className="text-gray-600">Efficiency:</span>
          <span className="ml-2 font-medium">{efficiency}%</span>
        </div>
        <div>
          <span className="text-gray-600">Sheet Size:</span>
          <span className="ml-2 font-medium">{sheetWidth}×{sheetHeight}mm</span>
        </div>
        <div>
          <span className="text-gray-600">Circle Diameter:</span>
          <span className="ml-2 font-medium">{layout.circles[0]?.diameter || 0}mm</span>
        </div>
      </div>
    </div>
  );
};

export default CircularLayoutVisualization;
