import React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  FileText,
  BookOpen,
  CreditCard,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '../ui/Card';
import { Button, QuickActionButton } from '../ui/Button';
import { DataTable } from '../ui/DataTable';
import { ChartCard } from '../ui/ChartCard';

// Sample data for demo
const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Student', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Faculty', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Admin', status: 'Inactive' },
];

const sampleColumns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
];

export function PremiumUIDemo() {
  return (
    <div className="min-h-screen bg-gray-50/30 p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Premium ERP UI Components</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Professional, modern, and ready for production. These components are designed to make your ERP application look premium and professional.
        </p>
      </div>

      {/* Enhanced Cards Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Card Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="default" hover>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Default Card</h3>
              <p className="text-gray-600">Clean and simple with hover effects</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated" hover>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Elevated Card</h3>
              <p className="text-gray-600">Enhanced shadows and depth</p>
            </CardContent>
          </Card>
          
          <Card variant="outlined" hover>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Outlined Card</h3>
              <p className="text-gray-600">Subtle borders with backdrop blur</p>
            </CardContent>
          </Card>
          
          <Card variant="gradient" hover>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Gradient Card</h3>
              <p className="text-gray-600">Beautiful gradient backgrounds</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stat Cards Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Premium Stat Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value="$124,563"
            icon={DollarSign}
            trend="up"
            trendValue="+12.5% from last month"
          />
          
          <StatCard
            title="Active Users"
            value="2,847"
            icon={Users}
            trend="up"
            trendValue="+8.2% from last week"
          />
          
          <StatCard
            title="Conversion Rate"
            value="3.24%"
            icon={TrendingUp}
            trend="down"
            trendValue="-0.8% from last month"
          />
          
          <StatCard
            title="System Health"
            value="98.5%"
            icon={Activity}
            trend="neutral"
            trendValue="All systems operational"
          />
        </div>
      </div>

      {/* Enhanced Buttons Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Premium Button Components</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" icon={Download}>Download Report</Button>
            <Button variant="secondary" icon={Search}>Search</Button>
            <Button variant="outline" icon={Filter}>Filter</Button>
            <Button variant="ghost" icon={Eye}>View</Button>
            <Button variant="success" icon={CheckCircle}>Approve</Button>
            <Button variant="danger" icon={AlertCircle}>Delete</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button size="sm" variant="primary">Small Button</Button>
            <Button size="md" variant="primary">Medium Button</Button>
            <Button size="lg" variant="primary">Large Button</Button>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Quick Action Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon={FileText}
            title="Assignments"
            subtitle="View & Submit"
            variant="primary"
            onClick={() => console.log('Assignments clicked')}
          />
          <QuickActionButton
            icon={CreditCard}
            title="Pay Fees"
            subtitle="Online Payment"
            variant="success"
            onClick={() => console.log('Fees clicked')}
          />
          <QuickActionButton
            icon={BookOpen}
            title="Library"
            subtitle="Search & Issue"
            variant="secondary"
            onClick={() => console.log('Library clicked')}
          />
          <QuickActionButton
            icon={Trophy}
            title="Placements"
            subtitle="Job Opportunities"
            variant="warning"
            onClick={() => console.log('Placements clicked')}
          />
        </div>
      </div>

      {/* Data Table Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Premium Data Table</h2>
        <DataTable
          data={sampleData}
          columns={sampleColumns}
          title="User Management"
          searchable={true}
          sortable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </div>

      {/* Chart Cards Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Chart Cards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Attendance Overview" 
            subtitle="Student attendance performance"
            variant="elevated"
          >
            <div className="h-64 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">85%</div>
                <div className="text-gray-600">Overall Attendance Rate</div>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Present: 85</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Absent: 15</span>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard 
            title="Academic Performance" 
            subtitle="Student marks across subjects"
            variant="elevated"
          >
            <div className="h-64 p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-24 text-sm text-gray-600">Mathematics</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">85%</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 text-sm text-gray-600">Physics</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">92%</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 text-sm text-gray-600">Chemistry</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">78%</div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Ready for Production</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            These premium UI components are designed with enterprise-grade quality, featuring modern design patterns, 
            accessibility compliance, and responsive layouts that work seamlessly across all devices.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Production Ready</h3>
              <p className="text-gray-600">Built with TypeScript, tested, and optimized for performance</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Modern Design</h3>
              <p className="text-gray-600">Contemporary UI patterns with smooth animations and interactions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">User Experience</h3>
              <p className="text-gray-600">Intuitive interfaces designed for optimal user engagement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
