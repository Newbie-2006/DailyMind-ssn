/**
 * Hardware event and monitoring types.
 *
 * These types are separate from the existing DailyMind types (Memory, Routine,
 * etc.) and are consumed only by the monitoring screens and hardware service.
 */

export type HardwareEventType =
  | 'sos_button'
  | 'suspected_fall'
  | 'sensor_fault'
  | 'device_status';

export interface HardwareEventData {
  accelerationMagnitude: number | null;
  angularVelocityMagnitude: number | null;
}

export interface HardwareEvent {
  id: string;
  deviceId: string;
  eventType: HardwareEventType;
  timestamp: string;
  sequence: number;
  data: HardwareEventData;
  receivedAt: string;
  acknowledged: boolean;
}

export interface DeviceStatus {
  deviceId: string;
  online: boolean;
  lastSeen: string | null;
  lastEventType: HardwareEventType | null;
}

export interface CameraSession {
  sessionId: string;
  active: boolean;
  cameraDeviceId: string | null;
  createdAt: string;
}
