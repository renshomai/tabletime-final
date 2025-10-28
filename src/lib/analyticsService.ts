import { supabase } from './supabase';

export interface AnalyticsData {
  totalCustomersToday: number;
  averageWaitTime: number;
  peakHours: { hour: number; count: number }[];
  tableUtilization: number;
  completedReservations: number;
  cancelledReservations: number;
}

export async function getDashboardAnalytics(): Promise<AnalyticsData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [customers, waitTimes, peakData, tableStats, reservations] = await Promise.all([
    getTotalCustomersToday(today),
    getAverageWaitTime(today),
    getPeakHours(today),
    getTableUtilization(),
    getReservationStats(today),
  ]);

  return {
    totalCustomersToday: customers,
    averageWaitTime: waitTimes,
    peakHours: peakData,
    tableUtilization: tableStats,
    completedReservations: reservations.completed,
    cancelledReservations: reservations.cancelled,
  };
}

async function getTotalCustomersToday(startDate: Date): Promise<number> {
  const { count, error } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .gte('joined_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching customers:', error);
    return 0;
  }

  return count || 0;
}

async function getAverageWaitTime(startDate: Date): Promise<number> {
  const { data, error } = await supabase
    .from('wait_time_history')
    .select('actual_wait_time')
    .gte('created_at', startDate.toISOString())
    .not('actual_wait_time', 'is', null);

  if (error || !data || data.length === 0) return 0;

  const total = data.reduce((sum, record) => sum + (record.actual_wait_time || 0), 0);
  return Math.round(total / data.length);
}

async function getPeakHours(startDate: Date): Promise<{ hour: number; count: number }[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('joined_at')
    .gte('joined_at', startDate.toISOString());

  if (error || !data) return [];

  const hourCounts: { [key: number]: number } = {};

  data.forEach((entry) => {
    const hour = new Date(entry.joined_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function getTableUtilization(): Promise<number> {
  const { data, error } = await supabase.from('tables').select('status');

  if (error || !data) return 0;

  const occupied = data.filter((t) => t.status === 'occupied').length;
  const total = data.length;

  return total > 0 ? Math.round((occupied / total) * 100) : 0;
}

async function getReservationStats(startDate: Date): Promise<{
  completed: number;
  cancelled: number;
}> {
  const { data: completed } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'seated')
    .gte('joined_at', startDate.toISOString());

  const { data: cancelled } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('joined_at', startDate.toISOString());

  return {
    completed: completed || 0,
    cancelled: cancelled || 0,
  };
}

export async function getWeeklyReport(): Promise<any[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .gte('joined_at', weekAgo.toISOString())
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching weekly report:', error);
    return [];
  }

  return data || [];
}

export async function getActivityLogs(limit: number = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return data || [];
}
