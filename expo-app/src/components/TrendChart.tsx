import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export interface TrendPoint {
  x: number;
  y: number;
}

interface TrendChartProps {
  points: TrendPoint[];
  height?: number;
  color?: string;
  minY?: number;
  maxY?: number;
}

const PADDING = 12;

export function TrendChart({ points, height = 160, color = '#FF4B4B', minY, maxY }: TrendChartProps) {
  const [width, setWidth] = React.useState(0);

  if (points.length === 0) {
    return <View style={{ height }} />;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = minY ?? Math.min(...ys);
  const yMax = maxY ?? Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const toScreen = (p: TrendPoint) => {
    const sx = PADDING + ((p.x - xMin) / xRange) * (width - PADDING * 2);
    const sy = height - PADDING - ((p.y - yMin) / yRange) * (height - PADDING * 2);
    return { x: sx, y: sy };
  };

  const screenPoints = points.map(toScreen);
  const path = screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line
            x1={PADDING}
            y1={height - PADDING}
            x2={width - PADDING}
            y2={height - PADDING}
            stroke="#8E8E93"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          <Path d={path} stroke={color} strokeWidth={2} fill="none" />
          {screenPoints.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
          ))}
        </Svg>
      )}
    </View>
  );
}
