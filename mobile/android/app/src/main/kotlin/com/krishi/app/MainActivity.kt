package com.krishi.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // The channel push notifications arrive on (Android 8+). Its name is
        // what people see in the app's notification settings.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "krishi_updates",
                "Krishi updates",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply { description = "Batches, payments, approvals and payouts" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}
