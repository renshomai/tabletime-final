import { supabase, QueueEntry } from './supabase';
import { predictWaitTime } from './aiPrediction';

export async function joinQueue(customerId: string, partySize: number): Promise<QueueEntry> {
  const waitingCount = await getWaitingCount();

  // Check if queue is full (max 8 tables)
  if (waitingCount >= 8) {
    const position = waitingCount + 1;
    const estimatedWaitTime = await predictWaitTime(partySize, position);
    throw new Error(`QUEUE_FULL:${estimatedWaitTime}`);
  }

  const qrCode = generateQRCode();
  const position = waitingCount + 1;
  const estimatedWaitTime = await predictWaitTime(partySize, position);

  const { data, error } = await supabase
    .from('queue_entries')
    .insert({
      customer_id: customerId,
      party_size: partySize,
      qr_code: qrCode,
      position: position,
      estimated_wait_time: estimatedWaitTime,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) throw error;

  await logWaitTimePrediction(data.id, estimatedWaitTime, position);

  await logActivity(customerId, 'join_queue', 'queue_entry', data.id, {
    party_size: partySize,
    position: position,
  });

  return data;
}

export async function getQueueEntry(queueEntryId: string): Promise<QueueEntry | null> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('id', queueEntryId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCustomerQueue(customerId: string): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveQueue(): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .in('status', ['waiting', 'notified'])
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function cancelQueueEntry(queueEntryId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('queue_entries')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', queueEntryId);

  if (error) throw error;

  await reorderQueue();

  await logActivity(userId, 'cancel_queue', 'queue_entry', queueEntryId, {});
}

export async function notifyCustomer(queueEntryId: string, staffId: string): Promise<void> {
  const { data: queueEntry, error: queueError } = await supabase
    .from('queue_entries')
    .select('*, users!queue_entries_customer_id_fkey(full_name)')
    .eq('id', queueEntryId)
    .single();

  if (queueError) throw queueError;

  const { error: updateError } = await supabase
    .from('queue_entries')
    .update({
      status: 'notified',
      notified_at: new Date().toISOString(),
    })
    .eq('id', queueEntryId);

  if (updateError) throw updateError;

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: queueEntry.customer_id,
      queue_entry_id: queueEntryId,
      type: 'table_ready',
      title: 'Your Table is Ready!',
      message: 'Please proceed to the entrance to be seated. Confirm within 10 minutes to avoid auto cancellation.',
    });

  if (notifError) throw notifError;

  await logActivity(staffId, 'notify_customer', 'queue_entry', queueEntryId, {});
}

export async function seatCustomer(
  queueEntryId: string,
  tableId: string,
  staffId: string
): Promise<void> {
  const queueEntry = await getQueueEntry(queueEntryId);
  if (!queueEntry) throw new Error('Queue entry not found');

  // Get table information
  const { data: table, error: tableGetError } = await supabase
    .from('tables')
    .select('table_number')
    .eq('id', tableId)
    .single();

  if (tableGetError) throw tableGetError;

  const { error: queueUpdateError } = await supabase
    .from('queue_entries')
    .update({
      status: 'seated',
      seated_at: new Date().toISOString(),
    })
    .eq('id', queueEntryId);

  if (queueUpdateError) throw queueUpdateError;

  const { error: tableError } = await supabase
    .from('tables')
    .update({ status: 'occupied' })
    .eq('id', tableId);

  if (tableError) throw tableError;

  const { error: reservationError } = await supabase
    .from('reservations')
    .insert({
      queue_entry_id: queueEntryId,
      table_id: tableId,
      customer_id: queueEntry.customer_id,
      staff_id: staffId,
      party_size: queueEntry.party_size,
      seated_at: new Date().toISOString(),
    });

  if (reservationError) throw reservationError;

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: queueEntry.customer_id,
      queue_entry_id: queueEntryId,
      type: 'seated',
      title: 'Seat Secured!',
      message: `Your seat has been secured. Thank you for waiting! Please proceed to Table ${table.table_number}.`,
    });

  if (notifError) throw notifError;

  const actualWaitTime = Math.floor(
    (new Date().getTime() - new Date(queueEntry.joined_at).getTime()) / 60000
  );

  await updateWaitTimeHistory(queueEntryId, actualWaitTime);

  await reorderQueue();

  await logActivity(staffId, 'seat_customer', 'queue_entry', queueEntryId, {
    table_id: tableId,
    actual_wait_time: actualWaitTime,
  });
}

export async function completeReservation(reservationId: string, staffId: string): Promise<void> {
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single();

  if (fetchError) throw fetchError;

  const duration = Math.floor(
    (new Date().getTime() - new Date(reservation.seated_at).getTime()) / 60000
  );

  const { error: updateError } = await supabase
    .from('reservations')
    .update({
      completed_at: new Date().toISOString(),
      duration_minutes: duration,
    })
    .eq('id', reservationId);

  if (updateError) throw updateError;

  if (reservation.table_id) {
    const { error: tableError } = await supabase
      .from('tables')
      .update({ status: 'available' })
      .eq('id', reservation.table_id);

    if (tableError) throw tableError;
  }

  await logActivity(staffId, 'complete_reservation', 'reservation', reservationId, {
    duration_minutes: duration,
  });
}

async function reorderQueue(): Promise<void> {
  const activeQueue = await getActiveQueue();

  for (let i = 0; i < activeQueue.length; i++) {
    const entry = activeQueue[i];
    if (entry.position !== i + 1) {
      await supabase
        .from('queue_entries')
        .update({ position: i + 1 })
        .eq('id', entry.id);
    }
  }
}

async function getWaitingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .in('status', ['waiting', 'notified']);

  if (error) throw error;
  return count || 0;
}

function generateQRCode(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

async function logWaitTimePrediction(
  queueEntryId: string,
  predictedWaitTime: number,
  queueLength: number
): Promise<void> {
  const { count: availableTables } = await supabase
    .from('tables')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');

  const now = new Date();

  await supabase.from('wait_time_history').insert({
    queue_entry_id: queueEntryId,
    predicted_wait_time: predictedWaitTime,
    queue_length: queueLength,
    available_tables: availableTables || 0,
    hour_of_day: now.getHours(),
    day_of_week: now.getDay(),
  });
}

async function updateWaitTimeHistory(queueEntryId: string, actualWaitTime: number): Promise<void> {
  await supabase
    .from('wait_time_history')
    .update({ actual_wait_time: actualWaitTime })
    .eq('queue_entry_id', queueEntryId);
}

async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: any
): Promise<void> {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: action,
    entity_type: entityType,
    entity_id: entityId,
    details: details,
  });
}

export async function validateQRCode(qrCode: string): Promise<QueueEntry | null> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('qr_code', qrCode)
    .eq('status', 'notified')
    .maybeSingle();

  if (error) throw error;
  return data;
}
