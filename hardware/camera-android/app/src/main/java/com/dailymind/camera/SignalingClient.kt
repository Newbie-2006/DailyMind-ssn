package com.dailymind.camera

import android.util.Log
import okhttp3.*
import org.json.JSONObject
import org.webrtc.IceCandidate
import org.webrtc.SessionDescription
import java.util.concurrent.TimeUnit

/**
 * WebSocket client for the DailyMind WebRTC signaling protocol.
 *
 * Connects to the backend's /ws/signaling endpoint and handles:
 * - Registering as a "camera" device
 * - Sending SDP offers
 * - Receiving SDP answers
 * - Exchanging ICE candidates
 * - Auto-reconnecting on disconnection
 */
class SignalingClient(
    private val onViewerJoined: () -> Unit,
    private val onAnswer: (SessionDescription) -> Unit,
    private val onIceCandidate: (IceCandidate) -> Unit,
    private val onStatusChange: (String) -> Unit,
) {
    companion object {
        private const val TAG = "Signaling"

        // ⚠️ Update this to your actual DailyMind backend URL
        private const val SIGNALING_URL = "wss://dailymind-ssn.onrender.com/ws/signaling"

        private const val MAX_RECONNECT_DELAY_MS = 30_000L
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS) // Keep WebSocket alive
        .build()

    private var webSocket: WebSocket? = null
    private var reconnectAttempt = 0
    private var shouldReconnect = true

    fun connect() {
        shouldReconnect = true
        onStatusChange("Connecting to signaling server…")

        val request = Request.Builder()
            .url(SIGNALING_URL)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                Log.i(TAG, "Connected to signaling server.")
                reconnectAttempt = 0
                onStatusChange("Connected — registering as camera…")

                // Register as camera device
                val join = JSONObject().apply {
                    put("type", "join")
                    put("role", "camera")
                }
                ws.send(join.toString())
                onStatusChange("Waiting for viewer…")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val msg = JSONObject(text)
                    when (msg.getString("type")) {
                        "viewer-joined" -> {
                            Log.i(TAG, "Viewer joined — creating offer.")
                            onStatusChange("Viewer connected — negotiating…")
                            onViewerJoined()
                        }
                        "answer" -> {
                            val sdpJson = msg.getJSONObject("sdp")
                            val sdp = SessionDescription(
                                SessionDescription.Type.ANSWER,
                                sdpJson.getString("sdp")
                            )
                            Log.i(TAG, "Received answer SDP.")
                            onAnswer(sdp)
                        }
                        "ice-candidate" -> {
                            val candidateJson = msg.getJSONObject("candidate")
                            val candidate = IceCandidate(
                                candidateJson.getString("sdpMid"),
                                candidateJson.getInt("sdpMLineIndex"),
                                candidateJson.getString("candidate")
                            )
                            onIceCandidate(candidate)
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to parse signaling message: ${e.message}")
                }
            }

            override fun onClosing(ws: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "Signaling closing: $code $reason")
                ws.close(1000, null)
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "Signaling closed: $code $reason")
                onStatusChange("Signaling disconnected")
                scheduleReconnect()
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Signaling failure: ${t.message}")
                onStatusChange("Connection failed — retrying…")
                scheduleReconnect()
            }
        })
    }

    fun sendOffer(sdp: SessionDescription) {
        val msg = JSONObject().apply {
            put("type", "offer")
            put("sdp", JSONObject().apply {
                put("type", sdp.type.canonicalForm())
                put("sdp", sdp.description)
            })
        }
        webSocket?.send(msg.toString())
    }

    fun sendIceCandidate(candidate: IceCandidate) {
        val msg = JSONObject().apply {
            put("type", "ice-candidate")
            put("candidate", JSONObject().apply {
                put("sdpMid", candidate.sdpMid)
                put("sdpMLineIndex", candidate.sdpMLineIndex)
                put("candidate", candidate.sdp)
            })
        }
        webSocket?.send(msg.toString())
    }

    fun disconnect() {
        shouldReconnect = false
        webSocket?.close(1000, "User stopped broadcasting")
        webSocket = null
    }

    private fun scheduleReconnect() {
        if (!shouldReconnect) return

        reconnectAttempt++
        val delay = minOf(
            1000L * (1L shl minOf(reconnectAttempt, 5)),
            MAX_RECONNECT_DELAY_MS
        )
        Log.i(TAG, "Reconnecting in ${delay}ms (attempt $reconnectAttempt)…")

        Thread {
            try {
                Thread.sleep(delay)
                if (shouldReconnect) connect()
            } catch (_: InterruptedException) {}
        }.start()
    }
}
