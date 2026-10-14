package com.dailymind.camera

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * Main screen of the DailyMind Camera app.
 *
 * Shows a start/stop button, connection status, and a privacy notice.
 * The actual camera capture and WebRTC streaming run in [CameraBroadcastService]
 * (a foreground service so Android doesn't kill it when minimized).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var btnToggle: Button
    private lateinit var tvStatus: TextView
    private lateinit var tvPrivacy: TextView

    private var isBroadcasting = false

    private val requiredPermissions = buildList {
        add(Manifest.permission.CAMERA)
        add(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }.toTypedArray()

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
            if (grants.all { it.value }) {
                startBroadcasting()
            } else {
                Toast.makeText(this, "Camera and microphone permissions are required.", Toast.LENGTH_LONG).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnToggle = findViewById(R.id.btn_toggle)
        tvStatus = findViewById(R.id.tv_status)
        tvPrivacy = findViewById(R.id.tv_privacy)

        tvPrivacy.text = "The camera only activates when you tap Start.\n" +
                "No video is recorded or saved.\n" +
                "Broadcasting stops when you tap Stop."

        btnToggle.setOnClickListener {
            if (isBroadcasting) {
                stopBroadcasting()
            } else {
                if (hasPermissions()) {
                    startBroadcasting()
                } else {
                    permissionLauncher.launch(requiredPermissions)
                }
            }
        }

        // Listen for status updates from the service
        CameraBroadcastService.statusLiveData.observe(this) { status ->
            tvStatus.text = status
        }

        CameraBroadcastService.isRunningLiveData.observe(this) { running ->
            isBroadcasting = running
            btnToggle.text = if (running) "⏹  Stop Broadcasting" else "▶  Start Broadcasting"
            btnToggle.setBackgroundColor(
                ContextCompat.getColor(
                    this,
                    if (running) android.R.color.holo_red_dark else android.R.color.holo_green_dark
                )
            )
        }
    }

    private fun hasPermissions(): Boolean =
        requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

    private fun startBroadcasting() {
        val intent = Intent(this, CameraBroadcastService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopBroadcasting() {
        val intent = Intent(this, CameraBroadcastService::class.java)
        stopService(intent)
    }
}
