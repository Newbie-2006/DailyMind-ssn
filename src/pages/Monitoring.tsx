import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronRight,
  Radio,
  RefreshCw,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { useHardwareEvents } from '../hooks/useHardwareEvents';
import type { HardwareEvent } from '../types/hardware';

function formatTimeAgo(isoDate: string | null): string {
  if (!isoDate) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function eventLabel(type: string): string {
  switch (type) {
    case 'sos_button': return 'SOS Button Pressed';
    case 'suspected_fall': return 'Suspected Fall';
    case 'sensor_fault': return 'Sensor Fault';
    case 'device_status': return 'Device Check-in';
    default: return type;
  }
}

function eventTone(type: string): string {
  switch (type) {
    case 'sos_button': return 'text-red-700 bg-red-50';
    case 'suspected_fall': return 'text-amber-700 bg-amber-50';
    case 'sensor_fault': return 'text-ink-soft bg-surface-sunk';
    default: return 'text-forest-soft bg-sage-wash';
  }
}

function MostRecentAlert({ event }: { event: HardwareEvent | undefined }) {
  if (!event) {
    return (
      <Card surface="sage" className="flex items-center gap-3 px-4 py-4">
        <Shield size={18} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-forest-soft" />
        <p className="text-[0.875rem] leading-relaxed text-forest-deep">
          No alerts yet. When the wearable detects something or the SOS button is pressed, it will
          appear here.
        </p>
      </Card>
    );
  }

  const isAlert = event.eventType === 'sos_button' || event.eventType === 'suspected_fall';

  return (
    <Card
      surface={isAlert ? 'plain' : 'sage'}
      className={`px-4 py-4 ${isAlert ? 'ring-2 ring-red-200' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${eventTone(event.eventType)}`}
        >
          {event.eventType === 'sos_button' ? (
            <Radio size={17} strokeWidth={2} />
          ) : event.eventType === 'suspected_fall' ? (
            <AlertTriangle size={17} strokeWidth={2} />
          ) : (
            <Activity size={17} strokeWidth={1.7} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-medium text-ink">
            {eventLabel(event.eventType)}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-faint">
            {formatTimeAgo(event.receivedAt)} · {event.deviceId}
          </p>
          {!event.acknowledged && isAlert && (
            <span className="mt-1.5 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[0.75rem] font-medium text-red-700">
              Needs attention
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export function Monitoring() {
  const { events, devices, loading, error, refresh, unacknowledgedCount } =
    useHardwareEvents();

  const latestAlert = events.find(
    (e) => e.eventType === 'sos_button' || e.eventType === 'suspected_fall',
  );

  const wearableDevice = devices.find((d) => d.deviceId?.startsWith('dailyMind-imu'));
  const wearableOnline = wearableDevice?.online ?? false;

  return (
    <div className="pb-10">
      <PageHeader
        title="Safety monitoring"
        onBack
        fallbackTo="/profile"
        actions={
          <button
            type="button"
            aria-label="Refresh"
            onClick={refresh}
            className="tap inline-flex size-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-sunk active:bg-beige"
          >
            <RefreshCw
              size={18}
              strokeWidth={1.8}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        }
      />

      <div className="space-y-6 px-5 pt-2">
        {/* --- Error banner --- */}
        {error && (
          <Card className="flex items-start gap-3 bg-red-50 px-4 py-3">
            <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-[0.8125rem] text-red-700">{error}</p>
          </Card>
        )}

        {/* --- Device status row --- */}
        <section>
          <SectionTitle>Devices</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {/* Camera */}
            <Link
              to="/monitoring/camera"
              className="tap flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-surface-sunk"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft">
                <Camera size={17} strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] text-ink">Room camera</span>
                <span className="block text-[0.8125rem] text-ink-faint">
                  Tap to view live feed
                </span>
              </span>
              <ChevronRight size={18} strokeWidth={1.7} className="shrink-0 text-ink-faint" />
            </Link>

            {/* Wearable */}
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  wearableOnline ? 'bg-sage-wash text-forest-soft' : 'bg-surface-sunk text-ink-faint'
                }`}
              >
                {wearableOnline ? (
                  <Wifi size={17} strokeWidth={1.7} />
                ) : (
                  <WifiOff size={17} strokeWidth={1.7} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] text-ink">
                  Wearable IMU
                </span>
                <span className="block text-[0.8125rem] text-ink-faint">
                  {wearableOnline
                    ? `Online · Last seen ${formatTimeAgo(wearableDevice?.lastSeen ?? null)}`
                    : 'Offline'}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.75rem] ${
                  wearableOnline
                    ? 'bg-sage-wash text-forest-soft'
                    : 'bg-surface-sunk text-ink-faint'
                }`}
              >
                {wearableOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </Card>
        </section>

        {/* --- Most recent alert --- */}
        <section>
          <SectionTitle
            action={
              events.length > 0 ? (
                <Link
                  to="/monitoring/alerts"
                  className="tap text-[0.8125rem] font-medium text-forest underline-offset-4 hover:underline"
                >
                  View all{unacknowledgedCount > 0 ? ` (${unacknowledgedCount})` : ''}
                </Link>
              ) : undefined
            }
          >
            Latest alert
          </SectionTitle>
          <MostRecentAlert event={latestAlert} />
        </section>

        {/* --- Quick actions --- */}
        <section>
          <SectionTitle>Quick actions</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/monitoring/camera"
              className="tap flex flex-col items-center gap-2 rounded-card bg-surface px-4 py-5 shadow-soft transition-transform active:scale-[0.98]"
            >
              <Camera size={22} strokeWidth={1.5} className="text-forest" />
              <span className="text-[0.8125rem] font-medium text-ink">Open camera</span>
            </Link>
            <Link
              to="/monitoring/alerts"
              className="tap relative flex flex-col items-center gap-2 rounded-card bg-surface px-4 py-5 shadow-soft transition-transform active:scale-[0.98]"
            >
              <Activity size={22} strokeWidth={1.5} className="text-forest" />
              <span className="text-[0.8125rem] font-medium text-ink">Alert history</span>
              {unacknowledgedCount > 0 && (
                <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-red-500 text-[0.625rem] font-bold text-white">
                  {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                </span>
              )}
            </Link>
          </div>
        </section>

        {/* --- Privacy note --- */}
        <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
          <Shield size={18} strokeWidth={1.6} aria-hidden="true" className="mt-0.5 shrink-0 text-forest-soft" />
          <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
            The camera only streams when explicitly started. No video is saved or uploaded
            by default. Fall detections are labelled as <em>suspected</em> — they are not
            medical diagnoses.
          </p>
        </Card>
      </div>
    </div>
  );
}
