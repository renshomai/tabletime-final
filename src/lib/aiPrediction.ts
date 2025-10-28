import { supabase } from './supabase';

export async function predictWaitTime(partySize: number, queuePosition: number): Promise<number> {
  const historicalData = await getHistoricalData();

  if (historicalData.length < 10) {
    return heuristicPrediction(partySize, queuePosition);
  }

  return machineLearningPrediction(partySize, queuePosition, historicalData);
}

function heuristicPrediction(partySize: number, queuePosition: number): number {
  const BASE_WAIT_PER_PARTY = 15;
  const PARTY_SIZE_MULTIPLIER = 1.2;

  const partySizeFactor = Math.pow(PARTY_SIZE_MULTIPLIER, partySize - 2);

  const estimatedWait = Math.round(queuePosition * BASE_WAIT_PER_PARTY * partySizeFactor);

  return Math.max(estimatedWait, 5);
}

async function machineLearningPrediction(
  partySize: number,
  queuePosition: number,
  historicalData: any[]
): Promise<number> {
  const similarScenarios = historicalData.filter((record) => {
    const queueDiff = Math.abs(record.queue_length - queuePosition);
    return queueDiff <= 3;
  });

  if (similarScenarios.length === 0) {
    return heuristicPrediction(partySize, queuePosition);
  }

  const avgActualWait =
    similarScenarios.reduce((sum, record) => sum + (record.actual_wait_time || 0), 0) /
    similarScenarios.length;

  const timeOfDayFactor = await getTimeOfDayFactor();
  const partySizeFactor = Math.pow(1.15, partySize - 2);

  const predictedWait = Math.round(avgActualWait * timeOfDayFactor * partySizeFactor);

  return Math.max(predictedWait, 5);
}

async function getHistoricalData(): Promise<any[]> {
  const { data, error } = await supabase
    .from('wait_time_history')
    .select('*')
    .not('actual_wait_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }

  return data || [];
}

async function getTimeOfDayFactor(): Promise<number> {
  const hour = new Date().getHours();

  if (hour >= 12 && hour <= 13) return 1.4;
  if (hour >= 18 && hour <= 20) return 1.5;
  if (hour >= 14 && hour <= 17) return 0.8;
  if (hour >= 21 && hour <= 22) return 0.9;

  return 1.0;
}

export async function getAverageWaitTime(): Promise<number> {
  const { data, error } = await supabase
    .from('wait_time_history')
    .select('actual_wait_time')
    .not('actual_wait_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) return 0;

  const total = data.reduce((sum, record) => sum + (record.actual_wait_time || 0), 0);
  return Math.round(total / data.length);
}

export async function getPredictionAccuracy(): Promise<number> {
  const { data, error } = await supabase
    .from('wait_time_history')
    .select('predicted_wait_time, actual_wait_time')
    .not('actual_wait_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) return 0;

  const accuracies = data.map((record) => {
    const predicted = record.predicted_wait_time;
    const actual = record.actual_wait_time;
    const error = Math.abs(predicted - actual);
    const accuracy = Math.max(0, 100 - (error / actual) * 100);
    return accuracy;
  });

  const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  return Math.round(avgAccuracy);
}
