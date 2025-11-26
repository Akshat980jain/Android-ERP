import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CHART_SIZE = Math.min(width - 80, 360);
const STROKE_WIDTH = 40;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface AttendanceData {
  physical: number;
  placement: number;
  absent: number;
  total: number;
}

interface CircularAttendanceChartProps {
  data: AttendanceData;
}

export default function CircularAttendanceChart({ data }: CircularAttendanceChartProps) {
  const { theme } = useTheme();
  
  // Calculate percentages
  const physicalPercentage = (data.physical / data.total) * 100;
  const placementPercentage = (data.placement / data.total) * 100;
  const absentPercentage = (data.absent / data.total) * 100;
  const overallPercentage = Math.round(((data.physical + data.placement) / data.total) * 100);

  // Calculate stroke dash offsets for each segment
  const physicalOffset = CIRCUMFERENCE - (physicalPercentage / 100) * CIRCUMFERENCE;
  const placementOffset = CIRCUMFERENCE - (placementPercentage / 100) * CIRCUMFERENCE;
  const absentOffset = CIRCUMFERENCE - (absentPercentage / 100) * CIRCUMFERENCE;

  // Calculate rotation angles for positioning
  const physicalRotation = -90;
  const placementRotation = -90 + (physicalPercentage * 360) / 100;
  const absentRotation = -90 + ((physicalPercentage + placementPercentage) * 360) / 100;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <G rotation={physicalRotation} originX={CHART_SIZE / 2} originY={CHART_SIZE / 2}>
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke="#2C3E50"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke="#10B981"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={physicalOffset}
              fill="none"
              strokeLinecap="round"
            />
          </G>
          <G rotation={placementRotation} originX={CHART_SIZE / 2} originY={CHART_SIZE / 2}>
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke="#3B82F6"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={placementOffset}
              fill="none"
              strokeLinecap="round"
            />
          </G>
          <G rotation={absentRotation} originX={CHART_SIZE / 2} originY={CHART_SIZE / 2}>
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke="#EF4444"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={absentOffset}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        </Svg>
        
        {/* Center Text */}
        <View style={styles.centerTextContainer}>
          <Text style={[styles.overallLabel, { color: theme.colors.textSecondary }]}>OVERALL</Text>
          <Text style={[styles.overallPercentage, { color: theme.colors.text }]}>{overallPercentage}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  chartContainer: {
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 8,
  },
  overallPercentage: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
});

