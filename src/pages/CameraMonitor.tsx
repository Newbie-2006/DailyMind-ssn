import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Loader,
  Phone,
  PhoneOff,
  Shield,
  Video,
  VideoOff,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';


type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'waiting_for_camera'
  | 'connected'
  | 'disconnected'
  | 'error';

const statusLabels: Record<ConnectionStatus, string> = {
  idle: 'Not connected',
  connecting: 'Connecting to signaling server…',
  waiting_for_camera: 'Waiting for camera device…',
  connected: 'Live — receiving video',
  disconnected: 'Camera disconnected',
  error: 'Connection failed',
};

const statusColors: Record<ConnectionStatus, string> = {
  idle: 'text-ink-faint',
  connecting: 'text-amber-600',
  waiting_for_camera: 'text-amber-600',
  connected: 'text-green-700',
  disconnected: 'text-red-600',
  error: 'text-red-600',
};

/**
 * Camera monitor screen.
 *
 * In the current prototype, WebRTC signaling is done through a WebSocket on the
 * DailyMind backend.  The camera device (a separate Android phone running the
 * camera app in hardware/camera-android/) broadcasts its feed, and this screen
 * receives it as a WebRTC peer.
 *
 * If the signaling server or camera is not available, the screen shows a clear
 * error state rather than a blank page.
 */
export function CameraMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const signalingUrl = (import.meta.env.VITE_GARY_API_URL ?? '')
    .replace(/^http/, 'ws')
    .replace(/\/$/, '') + '/ws/signaling';

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();
    setStatus('connecting');
    setErrorMsg(null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(signalingUrl);
    } catch {
      setStatus('error');
      setErrorMsg('Could not create WebSocket connection. Check the server URL.');
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      // Register as a viewer
      ws.send(JSON.stringify({ type: 'join', role: 'viewer' }));
      setStatus('waiting_for_camera');
    };

    ws.onerror = () => {
      setStatus('error');
      setErrorMsg(
        'WebSocket connection failed. The signaling server may be offline.',
      );
    };

    ws.onclose = () => {
      if (status === 'connected') {
        setStatus('disconnected');
      }
    };

    ws.onmessage = async (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      // Handle signaling messages
      if (msg.type === 'offer') {
        // Camera sent an SDP offer — create the peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        pc.ontrack = (trackEvent) => {
          if (videoRef.current && trackEvent.streams[0]) {
            videoRef.current.srcObject = trackEvent.streams[0];
            setStatus('connected');
          }
        };

        pc.onicecandidate = (iceEvent) => {
          if (iceEvent.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'ice-candidate',
                candidate: iceEvent.candidate,
              }),
            );
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setStatus('disconnected');
          }
        };

        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit),
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
        } catch (err) {
          setStatus('error');
          setErrorMsg(`WebRTC negotiation failed: ${(err as Error).message}`);
        }
      }

      if (msg.type === 'ice-candidate' && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(msg.candidate as RTCIceCandidateInit),
          );
        } catch {
          // Non-fatal: some candidates may be invalid
        }
      }

      if (msg.type === 'camera-offline') {
        setStatus('disconnected');
        setErrorMsg('The camera device stopped broadcasting.');
      }
    };
  }, [signalingUrl, cleanup, status]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus('idle');
    setErrorMsg(null);
  }, [cleanup]);

  // Clean up on unmount
  useEffect(() => cleanup, [cleanup]);

  return (
    <div className="pb-10">
      <PageHeader title="Room camera" onBack fallbackTo="/monitoring" />

      <div className="space-y-5 px-5 pt-2">
        {/* --- Video area --- */}
        <div className="relative overflow-hidden rounded-card bg-black shadow-soft">
          <div className="aspect-video">
            {status === 'connected' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-contain"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 text-white/60">
                {status === 'connecting' || status === 'waiting_for_camera' ? (
                  <>
                    <Loader size={28} className="animate-spin" />
                    <p className="text-[0.875rem]">{statusLabels[status]}</p>
                  </>
                ) : status === 'disconnected' || status === 'error' ? (
                  <>
                    <CameraOff size={28} />
                    <p className="text-[0.875rem]">{statusLabels[status]}</p>
                  </>
                ) : (
                  <>
                    <Camera size={28} />
                    <p className="text-[0.875rem]">Tap "Start viewing" to connect</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Live indicator */}
          {status === 'connected' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
              <span className="size-2 animate-pulse rounded-full bg-white" />
              <span className="text-[0.6875rem] font-bold tracking-wide text-white">
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* --- Connection status --- */}
        <Card className="flex items-center gap-3 px-4 py-3.5">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
              status === 'connected'
                ? 'bg-green-50 text-green-700'
                : status === 'error' || status === 'disconnected'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-sage-wash text-ink-faint'
            }`}
          >
            {status === 'connected' ? (
              <Video size={17} strokeWidth={1.7} />
            ) : status === 'error' || status === 'disconnected' ? (
              <VideoOff size={17} strokeWidth={1.7} />
            ) : (
              <Camera size={17} strokeWidth={1.7} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[0.9375rem] font-medium ${statusColors[status]}`}>
              {statusLabels[status]}
            </p>
            {errorMsg && (
              <p className="mt-0.5 text-[0.8125rem] text-red-600">{errorMsg}</p>
            )}
          </div>
        </Card>

        {/* --- Controls --- */}
        <div className="flex gap-3">
          {status === 'idle' || status === 'disconnected' || status === 'error' ? (
            <Button size="lg" onClick={connect}>
              <Phone size={17} strokeWidth={2} />
              Start viewing
            </Button>
          ) : status === 'connected' ? (
            <Button size="lg" variant="secondary" onClick={disconnect}>
              <PhoneOff size={17} strokeWidth={2} />
              Disconnect
            </Button>
          ) : (
            <Button size="lg" variant="quiet" onClick={disconnect}>
              Cancel
            </Button>
          )}
        </div>

        {/* --- Privacy note --- */}
        <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
          <Shield size={18} strokeWidth={1.6} aria-hidden="true" className="mt-0.5 shrink-0 text-forest-soft" />
          <div className="text-[0.8125rem] leading-relaxed text-ink-soft">
            <p>
              The camera only streams while you are connected. No video is recorded or
              saved. The camera phone must be actively broadcasting for you to see a feed.
            </p>
            <p className="mt-2">
              <strong>Android background restrictions:</strong> The camera app must remain
              in the foreground or run as a foreground service to keep streaming. Android
              may pause the camera if the app is minimized without the foreground service
              active.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
