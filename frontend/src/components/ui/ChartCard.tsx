import React from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'gradient';
  actions?: React.ReactNode;
}

export function ChartCard({ 
  title, 
  subtitle, 
  children, 
  className, 
  variant = 'default',
  actions 
}: ChartCardProps) {
  return (
    <Card variant={variant} className={clsx('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced pie chart with better styling
export function PieChartCard({ 
  title, 
  data, 
  className 
}: { 
  title: string; 
  data: Array<{ name: string; value: number; color: string }>;
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      <div className="relative h-64 p-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {data.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// Enhanced bar chart with better styling
export function BarChartCard({ 
  title, 
  data, 
  xAxis, 
  yAxis, 
  className 
}: { 
  title: string; 
  data: Array<{ name: string; value: number }>;
  xAxis?: string;
  yAxis?: string;
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      <div className="h-64 p-6">
        <div className="flex justify-between items-center mb-4">
          {xAxis && <span className="text-sm text-gray-600">{xAxis}</span>}
          {yAxis && <span className="text-sm text-gray-600">{yAxis}</span>}
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm text-gray-600 truncate">{item.name}</div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm font-medium text-gray-900">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
