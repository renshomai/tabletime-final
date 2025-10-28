import { supabase, Table } from './supabase';

export async function getAllTables(): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAvailableTables(): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('status', 'available')
    .order('capacity', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getTableById(tableId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createTable(
  tableNumber: string,
  capacity: number,
  userId: string
): Promise<Table> {
  const { data, error } = await supabase
    .from('tables')
    .insert({
      table_number: tableNumber,
      capacity: capacity,
      status: 'available',
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'create_table',
    entity_type: 'table',
    entity_id: data.id,
    details: { table_number: tableNumber, capacity: capacity },
  });

  return data;
}

export async function updateTable(
  tableId: string,
  updates: Partial<Table>,
  userId: string
): Promise<Table> {
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'update_table',
    entity_type: 'table',
    entity_id: tableId,
    details: updates,
  });

  return data;
}

export async function deleteTable(tableId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('tables').delete().eq('id', tableId);

  if (error) throw error;

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'delete_table',
    entity_type: 'table',
    entity_id: tableId,
    details: {},
  });
}

export async function getTableUtilization(): Promise<{
  total: number;
  available: number;
  occupied: number;
  reserved: number;
}> {
  const { data, error } = await supabase.from('tables').select('status');

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    available: 0,
    occupied: 0,
    reserved: 0,
  };

  data?.forEach((table) => {
    if (table.status === 'available') stats.available++;
    else if (table.status === 'occupied') stats.occupied++;
    else if (table.status === 'reserved') stats.reserved++;
  });

  return stats;
}

export async function changeTableStatus(
  tableId: string,
  status: 'available' | 'occupied' | 'reserved',
  userId: string
): Promise<void> {
  if (status === 'available') {
    const { data: activeReservation } = await supabase
      .from('reservations')
      .select('*, queue_entries(*)')
      .eq('table_id', tableId)
      .is('completed_at', null)
      .maybeSingle();

    if (activeReservation && activeReservation.queue_entries) {
      const queueEntry = activeReservation.queue_entries as any;

      const duration = Math.floor(
        (new Date().getTime() - new Date(activeReservation.seated_at).getTime()) / 60000
      );

      await supabase
        .from('reservations')
        .update({
          completed_at: new Date().toISOString(),
          duration_minutes: duration,
        })
        .eq('id', activeReservation.id);

      await supabase
        .from('queue_entries')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', queueEntry.id);
    }
  }

  const { error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', tableId);

  if (error) throw error;

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'change_table_status',
    entity_type: 'table',
    entity_id: tableId,
    details: { status },
  });
}
