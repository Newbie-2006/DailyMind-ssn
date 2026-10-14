import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle,
  Radio,
  RefreshCw,
  Server,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useHardwareEvents } from '../hooks/useHardwareEvents';
import type { HardwareEvent } from '../types/hardware';

function eventLabel(type: string): string {
  switch (type) {
    case 'sos_button': return 'SOS Button Pressed';
    case 'suspected_fall': return 'Suspected Fall';
    case 'sensor_fault': return 'Sensor Fault';
    case 'device_status': return 'Device Check-in';
    default: return type;
  }
}

function eventIcon(type: string) {
  switch (type) {
    case 'sos_button':
      return <Radio size={17} strokeWidth={2} />;
    case 'suspected_fall':
      return <AlertTriangle size={17} strokeWidth={2} />;
    case 'sensor_fault':
      return <Server size={17} strokeWidth={1.7} />;
    default:
      return <Activity size={17} strokeWidth={1.7} />;
  }
}

function eventToneClasses(type: string): string {
  switch (type) {
    case 'sos_button': return 'text-red-700 bg-red-50';
    case 'suspected_fall': return 'text-amber-700 bg-amber-50';
    case 'sensor_fault': return 'text-ink-soft bg-surface-sunk';
    default: return 'text-forest-soft bg-sage-wash';
  }
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function EventRow({
  event,
  onAcknowledge,
}: {
  event: HardwareEvent;
  onAcknowledge: (id: string) => void;
}) {
  const isAlert =
    event.eventType === 'sos_button' || event.eventType === 'suspected_fall';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 ${
        isAlert && !event.acknowledged ? 'bg-red-50/40' : ''
      }`}
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${eventToneClasses(event.eventType)}`}
      >
        {eventIcon(event.eventType)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-medium text-ink">
          {eventLabel(event.eventType)}
        </p>
        <p className="mt-0.5 text-[0.8125rem] text-ink-faint">
          {formatTs(event.receivedAt)} · {event.deviceId}
        </p>

        {event.data.accelerationMagnitude !== null && (
          <p className="mt-1 text-[0.75rem] text-ink-faint">
            Accel: {event.data.accelerationMagnitude.toFixed(2)} g
            {event.data.angularVelocityMagnitude !== null
              ? ` · Gyro: ${event.data.angularVelocityMagnitude.toFixed(1)} °/s`
              : ''}
          </p>
        )}

        {isAlert && !event.acknowledged && (
          <button
            type="button"
            onClick={() => onAcknowledge(event.id)}
            className="tap mt-2 inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-[0.8125rem] font-medium text-canvas transition-colors hover:bg-forest-deep active:scale-[0.98]"
          >
            <Check size={14} strokeWidth={2.5} />
            Acknowledge
          </button>
        )}

        {isAlert && event.acknowledged && (
          <span className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] text-forest-soft">
            <CheckCircle size={14} strokeWidth={2} />
            Acknowledged
          </span>
        )}
      </div>
    </div>
  );
}

export function AlertHistory() {
  const { events, loading, error, refresh, acknowledgeEvent } =
    useHardwareEvents();

  return (
    <div className="pb-10">
      <PageHeader
        title="Alert history"
        onBack
        fallbackTo="/monitoring"
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

      <div className="space-y-4 px-5 pt-2">
        {error && (
          <Card className="flex items-start gap-3 bg-red-50 px-4 py-3">
            <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-[0.8125rem] text-red-700">{error}</p>
              <Button size="md" variant="quiet" onClick={refresh} className="mt-2">
                Try again
              </Button>
            </div>
          </Card>
        )}

        {!loading && events.length === 0 && !error && (
          <EmptyState
            icon={<Activity size={24} strokeWidth={1.5} />}
            title="No events yet"
            body="When the wearable sends an SOS or detects a suspected fall, it will appear here."
          />
        )}

        {events.length > 0 && (
          <Card className="divide-y divide-line-soft overflow-hidden">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onAcknowledge={acknowledgeEvent}
              />
            ))}
          </Card>
        )}

        {loading && events.length === 0 && (
          <div className="flex justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-ink-faint" />
          </div>
        )}
      </div>
    </div>
  );
}
