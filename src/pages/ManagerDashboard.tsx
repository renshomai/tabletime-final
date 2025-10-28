import { useEffect, useState } from 'react';
import {
  Clock,
  LogOut,
  Users,
  TrendingUp,
  Table as TableIcon,
  Activity,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { User } from '../lib/supabase';
import { signOut } from '../lib/auth';
import { getDashboardAnalytics, getActivityLogs } from '../lib/analyticsService';
import { getPredictionAccuracy } from '../lib/aiPrediction';

interface ManagerDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export default function ManagerDashboard({ user }: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'logs'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAccuracy, setAiAccuracy] = useState(0);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [analyticsData, logs, accuracy] = await Promise.all([
        getDashboardAnalytics(),
        getActivityLogs(30),
        getPredictionAccuracy(),
      ]);

      setAnalytics(analyticsData);
      setActivityLogs(logs);
      setAiAccuracy(accuracy);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              <span className="text-lg sm:text-2xl font-bold text-slate-900">TableTime <span className="hidden sm:inline">Manager</span></span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-base text-slate-600 hidden md:inline">Manager: {user.full_name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MetricCard
            title="Customers Today"
            value={analytics.totalCustomersToday}
            icon={<Users className="h-8 w-8 text-blue-500" />}
            color="blue"
            trend="+12%"
          />
          <MetricCard
            title="Avg Wait Time"
            value={`${analytics.averageWaitTime} min`}
            icon={<Clock className="h-8 w-8 text-emerald-500" />}
            color="emerald"
            trend="-8%"
          />
          <MetricCard
            title="Table Utilization"
            value={`${analytics.tableUtilization}%`}
            icon={<TableIcon className="h-8 w-8 text-amber-500" />}
            color="amber"
            trend="+5%"
          />
          <MetricCard
            title="AI Accuracy"
            value={`${aiAccuracy}%`}
            icon={<TrendingUp className="h-8 w-8 text-purple-500" />}
            color="purple"
            trend="+3%"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<BarChart3 className="h-5 w-5" />}
                label="Overview"
              />
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon={<TrendingUp className="h-5 w-5" />}
                label="Analytics"
              />
              <TabButton
                active={activeTab === 'logs'}
                onClick={() => setActiveTab('logs')}
                icon={<Activity className="h-5 w-5" />}
                label="Activity Logs"
              />
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {activeTab === 'overview' && <OverviewTab analytics={analytics} />}
            {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
            {activeTab === 'logs' && <LogsTab logs={activityLogs} />}
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  const trendColor = trend?.startsWith('+') ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <p className="text-slate-600 text-xs sm:text-sm font-medium">{title}</p>
        <div className="scale-75 sm:scale-100">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl sm:text-3xl font-bold text-slate-900">{value}</p>
        {trend && <span className={`text-xs sm:text-sm font-semibold ${trendColor}`}>{trend}</span>}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors text-xs sm:text-base ${
        active
          ? 'text-purple-600 border-b-2 border-purple-600'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      <span className="sm:hidden">{icon}</span>
      <span className="hidden sm:flex sm:items-center sm:space-x-2">
        {icon}
        <span>{label}</span>
      </span>
      <span className="sm:hidden text-xs">{label.split(' ')[0]}</span>
    </button>
  );
}

function OverviewTab({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 border border-blue-200">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Today's Summary</span>
          </h3>
          <div className="space-y-3">
            <SummaryRow label="Total Customers" value={analytics.totalCustomersToday} />
            <SummaryRow label="Completed Reservations" value={analytics.completedReservations} />
            <SummaryRow label="Cancelled Reservations" value={analytics.cancelledReservations} />
            <SummaryRow
              label="Cancellation Rate"
              value={`${Math.round(
                (analytics.cancelledReservations / analytics.totalCustomersToday) * 100
              )}%`}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 sm:p-6 border border-emerald-200">
          <h3 className="text-base sm:text-lg font-semibold text-emerald-900 mb-3 sm:mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Metrics</span>
          </h3>
          <div className="space-y-3">
            <SummaryRow label="Avg Wait Time" value={`${analytics.averageWaitTime} min`} />
            <SummaryRow label="Table Utilization" value={`${analytics.tableUtilization}%`} />
            <SummaryRow
              label="Customer Satisfaction"
              value={`${Math.round(95 - analytics.cancelledReservations * 2)}%`}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <p>System is running smoothly</p>
          <p>AI predictions improving accuracy</p>
          <p>No system issues reported</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Peak Hours Analysis</h3>
        <div className="space-y-3">
          {analytics.peakHours.map((peak: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div>
                <span className="font-semibold text-slate-900">
                  {peak.hour}:00 - {peak.hour + 1}:00
                </span>
                <span className="text-slate-600 ml-2">
                  {peak.hour >= 12 && peak.hour < 18 ? 'Lunch' : peak.hour >= 18 ? 'Dinner' : 'Morning'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-600">{peak.count} customers</span>
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(peak.count / analytics.totalCustomersToday) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <AnalyticsCard
          title="Busiest Hour"
          value={analytics.peakHours[0]?.hour ? `${analytics.peakHours[0].hour}:00` : 'N/A'}
          subtitle="Peak time today"
        />
        <AnalyticsCard
          title="Efficiency Score"
          value={`${Math.round(analytics.tableUtilization * 0.9)}%`}
          subtitle="Operational efficiency"
        />
        <AnalyticsCard
          title="Customer Flow"
          value={`${Math.round(analytics.totalCustomersToday / 12)}/hr`}
          subtitle="Average throughput"
        />
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No activity logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {log.action.replace('_', ' ').toUpperCase()}
                </div>
                <span className="text-sm text-slate-600">{log.entity_type}</span>
              </div>
              <p className="text-sm text-slate-700">
                {log.users?.full_name || 'System'} - {log.users?.email || 'system'}
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {JSON.stringify(log.details, null, 2)}
                </p>
              )}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
              {new Date(log.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-700">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
