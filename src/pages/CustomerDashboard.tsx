import { useEffect, useState } from 'react';
import {
  Clock,
  LogOut,
  Users,
  Bell,
  History,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { User, QueueEntry } from '../lib/supabase';
import { signOut } from '../lib/auth';
import {
  joinQueue,
  getCustomerQueue,
  cancelQueueEntry,
  getActiveQueue,
} from '../lib/queueService';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  subscribeToNotifications,
} from '../lib/notificationService';

interface CustomerDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export default function CustomerDashboard({ user }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'notifications'>('queue');
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      loadData();
    });

    const interval = setInterval(loadData, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user.id]);

  const loadData = async () => {
    try {
      const [entries, notifs, unread] = await Promise.all([
        getCustomerQueue(user.id),
        getUserNotifications(user.id),
        getUnreadCount(user.id),
      ]);

      setQueueEntries(entries);
      setNotifications(notifs);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    setJoining(true);
    try {
      await joinQueue(user.id, partySize);
      await loadData();
      setShowJoinModal(false);
      setPartySize(2);
    } catch (error: any) {
      console.error('Error joining queue:', error);
      if (error.message?.startsWith('QUEUE_FULL:')) {
        const estimatedWaitTime = error.message.split(':')[1];
        alert(`All tables are fully reserved right now. Please wait for a while.\n\nEstimated wait time: ${estimatedWaitTime} minutes`);
      } else {
        alert('Failed to join queue');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleCancelQueue = async (queueEntryId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await cancelQueueEntry(queueEntryId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error cancelling queue:', error);
      alert('Failed to cancel reservation');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const activeEntry = queueEntries.find(
    (entry) => entry.status === 'waiting' || entry.status === 'notified' || entry.status === 'seated'
  );

  const latestSeatedNotification = notifications.find(
    (notif) => notif.type === 'seated' && activeEntry && notif.queue_entry_id === activeEntry.id
  );

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-cream border-b border-[#f0e8d8] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-cyan" />
              <span className="text-xl sm:text-2xl font-display text-[#111]">TableTime</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm sm:text-base text-[#444] hidden sm:inline">Hi, {user.full_name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-[#444] hover:text-[#111] transition-colors"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeEntry ? (
          <ActiveQueueCard
            entry={activeEntry}
            onCancel={handleCancelQueue}
            seatedMessage={latestSeatedNotification?.message}
          />
        ) : (
          <EmptyQueueCard onJoinQueue={() => setShowJoinModal(true)} userName={user.full_name} />
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-[#f0e8d8]">
          <div className="border-b border-[#f0e8d8]">
            <nav className="flex">
              <TabButton
                active={activeTab === 'queue'}
                onClick={() => setActiveTab('queue')}
                icon={<Users className="h-5 w-5" />}
                label="Current Queue"
              />
              <TabButton
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                icon={<History className="h-5 w-5" />}
                label="History"
              />
              <TabButton
                active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
                icon={<Bell className="h-5 w-5" />}
                label="Notifications"
                badge={unreadCount}
              />
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mx-auto"></div>
              </div>
            ) : (
              <>
                {activeTab === 'queue' && <QueueTab entries={queueEntries} user={user} />}
                {activeTab === 'history' && <HistoryTab entries={queueEntries} />}
                {activeTab === 'notifications' && (
                  <NotificationsTab
                    notifications={notifications}
                    onMarkAsRead={async (id) => {
                      await markAsRead(id);
                      await loadData();
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {showJoinModal && (
        <JoinQueueModal
          partySize={partySize}
          setPartySize={setPartySize}
          onJoin={handleJoinQueue}
          onClose={() => setShowJoinModal(false)}
          loading={joining}
        />
      )}
    </div>
  );
}

function ActiveQueueCard({
  entry,
  onCancel,
  seatedMessage,
}: {
  entry: QueueEntry;
  onCancel: (id: string) => void;
  seatedMessage?: string;
}) {
  const [, setQueueLength] = useState(0);

  useEffect(() => {
    getActiveQueue().then((queue) => setQueueLength(queue.length));
  }, []);

  if (entry.status === 'seated' && seatedMessage) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl shadow-lg p-6 sm:p-8 text-center max-w-3xl mx-auto">
        <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Seat Secured!</h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8">{seatedMessage}</p>
        <div className="bg-white rounded-lg p-4 sm:p-6 inline-block">
          <p className="text-gray-600 text-sm">Party of {entry.party_size}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream rounded-xl shadow-lg p-4 sm:p-8 text-center max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-5xl font-bold text-[#111] mb-2 sm:mb-4">TableTime</h1>
      <h2 className="text-lg sm:text-2xl text-[#444] mb-4 sm:mb-6">
        {entry.status === 'notified' ? 'Your table is ready!' : 'You are in the queue'}
      </h2>
      <div className="text-6xl sm:text-8xl font-bold text-cyan mb-4 sm:mb-6">{entry.position || '-'}</div>
      <p className="text-base sm:text-xl text-[#666] mb-2">Estimated wait: {entry.estimated_wait_time} minutes</p>
      <p className="text-sm sm:text-base text-[#444] mb-4 sm:mb-6">Party of {entry.party_size}</p>
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 inline-block mx-auto">
        <QRCodeSVG
          value={entry.qr_code}
          size={128}
          level="H"
          className="mx-auto"
        />
        <p className="text-[#444] text-xs sm:text-sm mt-2 sm:mt-3 font-mono break-all">{entry.qr_code}</p>
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => onCancel(entry.id)}
          className="px-6 py-3 bg-[#ff6b6b] text-white rounded-xl hover:bg-[#ff5252] transition-colors font-semibold text-sm sm:text-base"
        >
          Cancel Reservation
        </button>
      </div>
    </div>
  );
}

function EmptyQueueCard({ onJoinQueue, userName }: { onJoinQueue: () => void; userName: string }) {
  const [estimatedWait, setEstimatedWait] = useState(0);

  useEffect(() => {
    getActiveQueue().then((queue) => {
      const avgWaitTime = 15;
      setEstimatedWait(queue.length * avgWaitTime);
    });
  }, []);

  const firstName = userName.split(' ')[0];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-12 text-center shadow-sm border border-gray-100 max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2">
        Welcome Back, <br />
        {firstName}
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 mt-4 sm:mt-6 mb-2">Ready to join the queue?</p>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
        <span className="font-semibold">Estimated wait:</span> {estimatedWait} minutes
      </p>
      <button
        onClick={onJoinQueue}
        className="w-full max-w-2xl mx-auto py-3 sm:py-4 bg-cyan-500 text-white text-base sm:text-lg rounded-2xl hover:bg-cyan-600 transition-colors font-semibold shadow-lg"
      >
        Join Queue
      </button>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors relative text-sm sm:text-base ${
        active
          ? 'text-cyan border-b-2 border-cyan'
          : 'text-[#444] hover:text-[#111]'
      }`}
    >
      <span className="hidden sm:inline">{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-[#ff6b6b] text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function QueueTab({ entries }: { entries: QueueEntry[]; user: User }) {
  const activeEntries = entries.filter(
    (entry) => entry.status === 'waiting' || entry.status === 'notified'
  );

  if (activeEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No active queue entries</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeEntries.map((entry) => (
        <div
          key={entry.id}
          className="border border-slate-200 rounded-lg p-4 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold text-slate-900">Position: {entry.position}</div>
            <div className="text-sm text-slate-600">
              Party of {entry.party_size} • ~{entry.estimated_wait_time} min wait
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {entry.status === 'notified' ? 'Table Ready!' : 'Waiting...'}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            entry.status === 'notified'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {entry.status === 'notified' ? 'Ready' : 'Waiting'}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ entries }: { entries: QueueEntry[] }) {
  const historyEntries = entries.filter(
    (entry) => entry.status === 'seated' || entry.status === 'cancelled' || entry.status === 'no_show'
  );

  if (historyEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {historyEntries.map((entry) => (
        <div
          key={entry.id}
          className="border border-slate-200 rounded-lg p-4 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold text-slate-900">
              Party of {entry.party_size}
            </div>
            <div className="text-sm text-slate-600">
              {new Date(entry.joined_at).toLocaleDateString()} at{' '}
              {new Date(entry.joined_at).toLocaleTimeString()}
            </div>
          </div>
          <StatusBadge status={entry.status} />
        </div>
      ))}
    </div>
  );
}

function NotificationsTab({
  notifications,
  onMarkAsRead,
}: {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`border border-slate-200 rounded-lg p-4 ${
            !notif.read ? 'bg-emerald-50' : ''
          }`}
          onClick={() => !notif.read && onMarkAsRead(notif.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{notif.title}</h3>
              <p className="text-slate-600 text-sm mt-1">{notif.message}</p>
              <p className="text-slate-500 text-xs mt-2">
                {new Date(notif.created_at).toLocaleString()}
              </p>
            </div>
            {!notif.read && (
              <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    seated: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Seated', icon: CheckCircle },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled', icon: X },
    no_show: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'No Show', icon: AlertCircle },
  };

  const config = configs[status as keyof typeof configs] || configs.cancelled;
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}

function JoinQueueModal({
  partySize,
  setPartySize,
  onJoin,
  onClose,
  loading,
}: {
  partySize: number;
  setPartySize: (size: number) => void;
  onJoin: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-cream rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-[#111]">Join Queue</h2>
          <button
            onClick={onClose}
            className="text-[#444] hover:text-[#111] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#222] mb-3">Party Size</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((size) => (
              <button
                key={size}
                onClick={() => setPartySize(size)}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  partySize === size
                    ? 'bg-cyan text-white shadow-lg'
                    : 'bg-white text-[#444] hover:bg-[#f5f5f5]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onJoin}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Queue'}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-[#ddd] text-[#444] rounded-xl hover:bg-white transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
