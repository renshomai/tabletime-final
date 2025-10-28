import { useEffect, useState } from 'react';
import {
  Clock,
  LogOut,
  Users,
  QrCode,
  CheckCircle,
  X,
  Send,
  Table as TableIcon,
} from 'lucide-react';
import { User, QueueEntry, Table } from '../lib/supabase';
import { signOut } from '../lib/auth';
import {
  getActiveQueue,
  notifyCustomer,
  seatCustomer,
  cancelQueueEntry,
  validateQRCode,
} from '../lib/queueService';
import { getAllTables, getTableUtilization, changeTableStatus } from '../lib/tableService';

interface StaffDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export default function StaffDashboard({ user }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'tables' | 'qr'>('queue');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tableUtilization, setTableUtilization] = useState({ total: 0, available: 0, occupied: 0, reserved: 0 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [queueData, tablesData, utilization] = await Promise.all([
        getActiveQueue(),
        getAllTables(),
        getTableUtilization(),
      ]);

      setQueue(queueData);
      setTables(tablesData);
      setTableUtilization(utilization);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyCustomer = async (queueEntryId: string) => {
    try {
      await notifyCustomer(queueEntryId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error notifying customer:', error);
      alert('Failed to notify customer');
    }
  };

  const handleSeatCustomer = async (queueEntryId: string, tableId: string) => {
    try {
      await seatCustomer(queueEntryId, tableId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error seating customer:', error);
      alert('Failed to seat customer');
    }
  };

  const handleCancelQueue = async (queueEntryId: string) => {
    if (!confirm('Cancel this queue entry?')) return;

    try {
      await cancelQueueEntry(queueEntryId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error cancelling queue:', error);
      alert('Failed to cancel queue entry');
    }
  };

  const handleValidateQR = async () => {
    setQrResult(null);
    try {
      const entry = await validateQRCode(qrInput);
      if (entry) {
        setQrResult({ success: true, message: `Valid ticket for party of ${entry.party_size}` });
      } else {
        setQrResult({ success: false, message: 'Invalid or expired QR code' });
      }
    } catch (error) {
      setQrResult({ success: false, message: 'Error validating QR code' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <span className="text-lg sm:text-2xl font-bold text-slate-900">TableTime <span className="hidden sm:inline">Staff</span></span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-base text-slate-600 hidden md:inline">Staff: {user.full_name}</span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="In Queue"
            value={queue.length}
            icon={<Users className="h-8 w-8 text-blue-500" />}
            color="blue"
          />
          <StatCard
            title="Available Tables"
            value={tableUtilization.available}
            icon={<TableIcon className="h-8 w-8 text-emerald-500" />}
            color="emerald"
          />
          <StatCard
            title="Occupied Tables"
            value={tableUtilization.occupied}
            icon={<TableIcon className="h-8 w-8 text-amber-500" />}
            color="amber"
          />
          <StatCard
            title="Total Tables"
            value={tableUtilization.total}
            icon={<TableIcon className="h-8 w-8 text-slate-500" />}
            color="slate"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex">
              <TabButton
                active={activeTab === 'queue'}
                onClick={() => setActiveTab('queue')}
                icon={<Users className="h-5 w-5" />}
                label="Queue Management"
              />
              <TabButton
                active={activeTab === 'tables'}
                onClick={() => setActiveTab('tables')}
                icon={<TableIcon className="h-5 w-5" />}
                label="Table Status"
              />
              <TabButton
                active={activeTab === 'qr'}
                onClick={() => setActiveTab('qr')}
                icon={<QrCode className="h-5 w-5" />}
                label="QR Scanner"
              />
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <>
                {activeTab === 'queue' && (
                  <QueueTab
                    queue={queue}
                    tables={tables}
                    onNotify={handleNotifyCustomer}
                    onSeat={handleSeatCustomer}
                    onCancel={handleCancelQueue}
                  />
                )}
                {activeTab === 'tables' && (
                  <TablesTab tables={tables} onRefresh={loadData} user={user} />
                )}
                {activeTab === 'qr' && (
                  <QRTab
                    qrInput={qrInput}
                    setQrInput={setQrInput}
                    onValidate={handleValidateQR}
                    result={qrResult}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className="scale-90 sm:scale-100">{icon}</div>
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
          ? 'text-blue-600 border-b-2 border-blue-600'
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

function QueueTab({
  queue,
  tables,
  onNotify,
  onSeat,
  onCancel,
}: {
  queue: QueueEntry[];
  tables: Table[];
  onNotify: (id: string) => void;
  onSeat: (queueId: string, tableId: string) => void;
  onCancel: (id: string) => void;
}) {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');

  const availableTables = tables.filter((t) => t.status === 'available');

  if (queue.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No customers in queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queue.map((entry) => (
        <div
          key={entry.id}
          className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-blue-600">{entry.position}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base text-slate-900">
                  Party of {entry.party_size}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">
                  Wait: ~{entry.estimated_wait_time} min
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  QR: {entry.qr_code}
                </div>
                <div className="text-xs text-slate-500">
                  Joined: {new Date(entry.joined_at).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {entry.status === 'waiting' && (
                <button
                  onClick={() => onNotify(entry.id)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Notify</span>
                </button>
              )}

              {entry.status === 'notified' && (
                <button
                  onClick={() => setSelectedQueue(entry.id)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-emerald-500 text-white text-xs sm:text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Seat</span>
                </button>
              )}

              <button
                onClick={() => onCancel(entry.id)}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {selectedQueue === entry.id && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Table
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a table...</option>
                  {availableTables
                    .filter((t) => {
                      const partySize = entry.party_size;
                      if (partySize <= 2) return t.capacity === 2;
                      if (partySize <= 4) return t.capacity === 4;
                      return t.capacity === 6;
                    })
                    .map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.table_number} (Capacity: {table.capacity})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedTable) {
                      onSeat(entry.id, selectedTable);
                      setSelectedQueue(null);
                      setSelectedTable('');
                    }
                  }}
                  disabled={!selectedTable}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setSelectedQueue(null)}
                  className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TablesTab({
  tables,
  onRefresh,
  user,
}: {
  tables: Table[];
  onRefresh: () => void;
  user: User;
}) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleChangeStatus = async (tableId: string, newStatus: 'available' | 'occupied' | 'reserved') => {
    try {
      await changeTableStatus(tableId, newStatus, user.id);
      await onRefresh();
      setSelectedTable(null);
    } catch (error) {
      console.error('Error changing table status:', error);
      alert('Failed to change table status');
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Table Status</h3>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-w-0">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`border-2 rounded-lg p-4 text-center transition-all min-w-0 ${
              table.status === 'available'
                ? 'border-emerald-300 bg-emerald-50'
                : table.status === 'occupied'
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            <div className="text-2xl font-bold mb-2 break-words">{table.table_number}</div>
            <div className="text-sm text-slate-600 mb-2 whitespace-nowrap">Seats: {table.capacity}</div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                table.status === 'available'
                  ? 'bg-emerald-200 text-emerald-800'
                  : table.status === 'occupied'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
            </div>

            {selectedTable === table.id ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleChangeStatus(table.id, 'available')}
                  className="w-full px-3 py-2 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 transition-colors"
                >
                  Available
                </button>
                <button
                  onClick={() => handleChangeStatus(table.id, 'occupied')}
                  className="w-full px-3 py-2 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors"
                >
                  Occupied
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-full px-3 py-2 bg-slate-300 text-slate-700 text-sm rounded hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectedTable(table.id)}
                className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors font-medium"
              >
                Change Status
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QRTab({
  qrInput,
  setQrInput,
  onValidate,
  result,
}: {
  qrInput: string;
  setQrInput: (value: string) => void;
  onValidate: () => void;
  result: { success: boolean; message: string } | null;
}) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <QrCode className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">QR Code Validation</h3>
        <p className="text-slate-600">Enter the QR code to validate customer tickets</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="qr" className="block text-sm font-medium text-slate-700 mb-2">
            QR Code
          </label>
          <input
            id="qr"
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onValidate()}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="QR-1234567890-abcdef"
          />
        </div>

        <button
          onClick={onValidate}
          disabled={!qrInput}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Validate QR Code
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg flex items-start space-x-3 ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={result.success ? 'text-emerald-700' : 'text-red-700'}>
              {result.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
