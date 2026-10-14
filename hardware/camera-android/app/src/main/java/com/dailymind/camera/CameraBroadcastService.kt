package com.dailymind.camera

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.MutableLiveData
import org.webrtc.*

/**
 * Foreground service that captures camera video and streams it via WebRTC.
 *
 * Runs as a foreground service so Android does not kill the camera capture
 * when the app is minimized. A persistent notification tells the user that
 * broadcasting is active.
 */
class CameraBroadcastService : Service() {

    companion object {
        private const val TAG = "CameraBroadcast"
        private const val CHANNEL_ID = "dailymind_camera_channel"
        private const val NOTIFICATION_ID = 1001

        val statusLiveData = MutableLiveData("Idle")
        val isRunningLiveData = MutableLiveData(false)
    }

    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoCapturer: CameraVideoCapturer? = null
    private var localVideoTrack: VideoTrack? = null
    private var signalingClient: SignalingClient? = null
    private var eglBase: EglBase? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification("Connecting…")
        startForeground(NOTIFICATION_ID, notification)

        isRunningLiveData.postValue(true)
        statusLiveData.postValue("Initializing…")

        initWebRTC()
        connectSignaling()

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        cleanup()
        isRunningLiveData.postValue(false)
        statusLiveData.postValue("Stopped")
        Log.i(TAG, "Broadcasting stopped.")
    }

    // ---- WebRTC setup ----

    private fun initWebRTC() {
        eglBase = EglBase.create()
        val options = PeerConnectionFactory.InitializationOptions
            .builder(applicationContext)
            .setEnableInternalTracer(false)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(
                DefaultVideoEncoderFactory(
                    eglBase!!.eglBaseContext, true, true
                )
            )
            .setVideoDecoderFactory(
                DefaultVideoDecoderFactory(eglBase!!.eglBaseContext)
            )
            .createPeerConnectionFactory()

        // Create video capturer (rear camera)
        videoCapturer = createCameraCapturer()
        if (videoCapturer == null) {
            statusLiveData.postValue("Error: No camera found")
            stopSelf()
            return
        }

        val surfaceTextureHelper = SurfaceTextureHelper.create(
            "CaptureThread", eglBase!!.eglBaseContext
        )
        val videoSource = peerConnectionFactory!!.createVideoSource(false)
        videoCapturer!!.initialize(surfaceTextureHelper, applicationContext, videoSource.capturerObserver)
        videoCapturer!!.startCapture(1280, 720, 30)

        localVideoTrack = peerConnectionFactory!!.createVideoTrack("video0", videoSource)
        localVideoTrack!!.setEnabled(true)

        statusLiveData.postValue("Camera active")
        Log.i(TAG, "WebRTC initialized, camera capturing.")
    }

    private fun createCameraCapturer(): CameraVideoCapturer? {
        val enumerator = Camera2Enumerator(applicationContext)
        // Prefer rear camera
        for (name in enumerator.deviceNames) {
            if (!enumerator.isFrontFacing(name)) {
                val capturer = enumerator.createCapturer(name, null)
                if (capturer != null) return capturer
            }
        }
        // Fall back to front camera
        for (name in enumerator.deviceNames) {
            if (enumerator.isFrontFacing(name)) {
                val capturer = enumerator.createCapturer(name, null)
                if (capturer != null) return capturer
            }
        }
        return null
    }

    // ---- Signaling ----

    private fun connectSignaling() {
        signalingClient = SignalingClient(
            onViewerJoined = { createAndSendOffer() },
            onAnswer = { sdp -> handleAnswer(sdp) },
            onIceCandidate = { candidate -> handleRemoteIceCandidate(candidate) },
            onStatusChange = { status -> statusLiveData.postValue(status) }
        )
        signalingClient!!.connect()
    }

    private fun createAndSendOffer() {
        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer()
        )

        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        }

        peerConnection?.close()
        peerConnection = peerConnectionFactory!!.createPeerConnection(
            rtcConfig,
            object : PeerConnection.Observer {
                override fun onIceCandidate(candidate: IceCandidate?) {
                    candidate?.let { signalingClient?.sendIceCandidate(it) }
                }
                override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
                    Log.d(TAG, "ICE state: $state")
                    when (state) {
                        PeerConnection.IceConnectionState.CONNECTED -> {
                            statusLiveData.postValue("🔴 LIVE — Streaming")
                            updateNotification("Broadcasting live")
                        }
                        PeerConnection.IceConnectionState.DISCONNECTED -> {
                            statusLiveData.postValue("Viewer disconnected")
                            updateNotification("Waiting for viewer…")
                        }
                        PeerConnection.IceConnectionState.FAILED -> {
                            statusLiveData.postValue("Connection failed")
                        }
                        else -> {}
                    }
                }
                override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
                override fun onIceConnectionReceivingChange(receiving: Boolean) {}
                override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
                override fun onAddStream(stream: MediaStream?) {}
                override fun onRemoveStream(stream: MediaStream?) {}
                override fun onDataChannel(dc: DataChannel?) {}
                override fun onRenegotiationNeeded() {}
                override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}
            }
        )

        localVideoTrack?.let { track ->
            peerConnection?.addTrack(track, listOf("stream0"))
        }

        peerConnection?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(sdp: SessionDescription?) {
                sdp?.let {
                    peerConnection?.setLocalDescription(SimpleSdpObserver(), it)
                    signalingClient?.sendOffer(it)
                    statusLiveData.postValue("Offer sent — waiting for viewer…")
                }
            }
            override fun onCreateFailure(error: String?) {
                Log.e(TAG, "Create offer failed: $error")
            }
            override fun onSetSuccess() {}
            override fun onSetFailure(error: String?) {}
        }, MediaConstraints())
    }

    private fun handleAnswer(sdp: SessionDescription) {
        peerConnection?.setRemoteDescription(SimpleSdpObserver(), sdp)
    }

    private fun handleRemoteIceCandidate(candidate: IceCandidate) {
        peerConnection?.addIceCandidate(candidate)
    }

    // ---- Cleanup ----

    private fun cleanup() {
        try { videoCapturer?.stopCapture() } catch (_: Exception) {}
        videoCapturer?.dispose()
        peerConnection?.close()
        peerConnection?.dispose()
        peerConnectionFactory?.dispose()
        signalingClient?.disconnect()
        eglBase?.release()

        videoCapturer = null
        peerConnection = null
        peerConnectionFactory = null
        signalingClient = null
        eglBase = null
    }

    // ---- Notifications ----

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Camera Broadcasting",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when DailyMind Camera is broadcasting"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DailyMind Camera")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    /** Minimal SDP observer that ignores all callbacks. */
    private class SimpleSdpObserver : SdpObserver {
        override fun onCreateSuccess(sdp: SessionDescription?) {}
        override fun onSetSuccess() {}
        override fun onCreateFailure(error: String?) {}
        override fun onSetFailure(error: String?) {}
    }
}
