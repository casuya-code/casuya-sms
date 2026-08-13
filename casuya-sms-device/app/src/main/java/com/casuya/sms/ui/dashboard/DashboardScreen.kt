package com.casuya.sms.ui.dashboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CallMade
import androidx.compose.material.icons.automirrored.filled.CallReceived
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import com.casuya.sms.App
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.data.db.SmsMessage
import com.casuya.sms.services.SMSBackgroundService
import com.casuya.sms.utils.DiagnosticsManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(onLogout: () -> Unit) {
    val context = LocalContext.current
    val database = (context.applicationContext as App).database
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var connected by remember { mutableStateOf(SMSBackgroundService.isConnected) }
    var networkAvailable by remember { mutableStateOf(SMSBackgroundService.isNetworkAvailable) }
    var smsCount by remember { mutableIntStateOf(SMSBackgroundService.smsCount) }
    var smsReceivedCount by remember { mutableIntStateOf(SMSBackgroundService.smsReceivedCount) }
    var lastSmsTime by remember { mutableLongStateOf(SMSBackgroundService.lastSmsTime) }

    val smsLogs by database.smsDao().getAllMessages().collectAsState(initial = emptyList())

    // Settings States
    var gatewayEnabled by remember { mutableStateOf(PrefsManager.isGatewayEnabled()) }
    var sendDelay by remember { mutableIntStateOf(PrefsManager.getSendDelay()) }

    // Dialog States
    var showSupportDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    var showDelayDialog by remember { mutableStateOf(false) }
    var showDiagnosticsDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        while (true) {
            connected = SMSBackgroundService.isConnected
            networkAvailable = SMSBackgroundService.isNetworkAvailable
            smsCount = SMSBackgroundService.smsCount
            smsReceivedCount = SMSBackgroundService.smsReceivedCount
            lastSmsTime = SMSBackgroundService.lastSmsTime
            
            delay(2000)
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.width(320.dp),
                drawerContainerColor = MaterialTheme.colorScheme.surface,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .verticalScroll(rememberScrollState())
                ) {
                    // Branded Header
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        MaterialTheme.colorScheme.primary,
                                        MaterialTheme.colorScheme.primaryContainer
                                    )
                                )
                            )
                            .padding(24.dp)
                    ) {
                        Column {
                            Text(
                                text = "Casuya SMS",
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = PrefsManager.getEmail() ?: "Active Session",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                            )
                        }
                    }

                    Column(modifier = Modifier.padding(16.dp)) {
                        DrawerSectionHeader("GATEWAY STATUS")
                        DrawerItem(
                            label = if (connected) "Active & Online" else if (!networkAvailable) "No Internet" else "Gateway Offline",
                            icon = Icons.Default.Info,
                            color = if (connected) Color(0xFF4CAF50) else Color(0xFFF44336)
                        )

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        DrawerSectionHeader("STATISTICS")
                        DrawerItem(label = "Sent Today: $smsCount", icon = Icons.AutoMirrored.Filled.List)
                        DrawerItem(label = "Received Today: $smsReceivedCount", icon = Icons.AutoMirrored.Filled.List)

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        DrawerSectionHeader("PREFERENCES")
                        SettingsToggleItem("Enable Gateway", gatewayEnabled) { 
                            gatewayEnabled = it
                            PrefsManager.setGatewayEnabled(it)
                        }
                        
                        DrawerItem(label = "Sync Device SMS", icon = Icons.Default.CloudSync) {
                            scope.launch {
                                drawerState.close()
                                Toast.makeText(context, "Scanning & Syncing...", Toast.LENGTH_SHORT).show()
                                com.casuya.sms.utils.SmsSyncManager.fullSync(context)
                                Toast.makeText(context, "Sync complete", Toast.LENGTH_SHORT).show()
                            }
                        }
                        
                        DrawerItem(label = "Message Delay: ${sendDelay}s", icon = Icons.Default.Timer) {
                            showDelayDialog = true
                        }
                        
                        DrawerItem(label = "System Logs", icon = Icons.Default.Terminal) {
                            showDiagnosticsDialog = true
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        DrawerSectionHeader("SUPPORT")
                        DrawerItem(label = "Get Help", icon = Icons.Default.SupportAgent) { showSupportDialog = true }
                        DrawerItem(label = "Terms & Privacy", icon = Icons.Default.Description) { showTermsDialog = true }
                        
                        Spacer(Modifier.height(32.dp))
                        
                        Button(
                            onClick = onLogout,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer, 
                                contentColor = MaterialTheme.colorScheme.onErrorContainer
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Sign Out")
                        }
                        Spacer(Modifier.height(24.dp))
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("Casuya Gateway", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                        }
                    },
                    actions = {
                        IconButton(onClick = { SMSBackgroundService.reconnectInstance() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Reconnect")
                        }
                    }
                )
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Main Status Card
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
                    colors = CardDefaults.elevatedCardColors(
                        containerColor = if (connected) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(if (connected) Color(0xFF4CAF50) else Color(0xFFF44336)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (connected) Icons.Default.CheckCircle else Icons.Default.Error,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                        
                        Spacer(Modifier.height(16.dp))
                        
                        Text(
                            text = if (connected) "Gateway Online" else "Gateway Offline",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (connected) Color(0xFF2E7D32) else Color(0xFFC62828)
                        )
                        
                        Text(
                            text = if (!networkAvailable) "No internet connection detected" else if (connected) "Ready to route messages" else "Connecting to server...",
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = Color.Gray
                        )
                    }
                }

                Spacer(Modifier.height(24.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatCard("Sent", smsCount.toString(), Modifier.weight(1f))
                    StatCard("Received", smsReceivedCount.toString(), Modifier.weight(1f))
                }

                Spacer(Modifier.height(16.dp))

                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Device Info", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Row {
                                TextButton(onClick = {
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                    val clip = ClipData.newPlainText("Device ID", PrefsManager.getDeviceId() ?: "")
                                    clipboard.setPrimaryClip(clip)
                                    Toast.makeText(context, "Device ID copied", Toast.LENGTH_SHORT).show()
                                }) {
                                    Text("Copy ID", style = MaterialTheme.typography.labelSmall)
                                }
                                TextButton(onClick = {
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                    val clip = ClipData.newPlainText("API Key", PrefsManager.getPairingKey() ?: "")
                                    clipboard.setPrimaryClip(clip)
                                    Toast.makeText(context, "API Key copied", Toast.LENGTH_SHORT).show()
                                }) {
                                    Text("Copy Key", style = MaterialTheme.typography.labelSmall)
                                }
                            }
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        DetailRow("ID", PrefsManager.getDeviceId() ?: "N/A")
                        DetailRow("API Key", PrefsManager.getPairingKey() ?: "N/A")
                        DetailRow("User", PrefsManager.getEmail() ?: "Unknown")
                    }
                }

                Spacer(Modifier.height(32.dp))

                Button(
                    onClick = { 
                        if (connected) SMSBackgroundService.disconnectInstance() 
                        else SMSBackgroundService.reconnectInstance() 
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if(connected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(if (connected) "Disconnect Gateway" else "Establish Connection")
                }

                if (smsLogs.isNotEmpty()) {
                    Spacer(Modifier.height(32.dp))
                    Text(
                        text = "Persistent Log",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                    )
                    
                    smsLogs.take(10).forEach { log ->
                        SmsLogItem(log)
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        }
    }

    // --- Dialogs ---

    if (showDiagnosticsDialog) {
        AlertDialog(
            onDismissRequest = { showDiagnosticsDialog = false },
            title = { Text("System Logs") },
            text = {
                Box(modifier = Modifier.height(400.dp).fillMaxWidth()) {
                    val logScrollState = rememberScrollState()
                    Column(modifier = Modifier.verticalScroll(logScrollState)) {
                        DiagnosticsManager.logs.forEach { log ->
                            Row(modifier = Modifier.padding(vertical = 4.dp)) {
                                Text(
                                    "[${log.time}] ",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.Gray
                                )
                                Text(
                                    log.message,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (log.level == "ERROR") Color.Red else if (log.level == "WARN") Color(0xFFFFA000) else Color.Unspecified
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDiagnosticsDialog = false }) { Text("Close") }
            }
        )
    }

    if (showSupportDialog) {
        InfoDialog(
            title = "Technical Support",
            content = "Visit our docs at docs.casuya-sms.com or email support@casuya-sms.com for help.",
            onDismiss = { showSupportDialog = false }
        )
    }

    if (showTermsDialog) {
        InfoDialog(
            title = "Terms & Privacy",
            content = "This app acts as a hardware gateway. You are responsible for compliance with carrier rules and local messaging laws.",
            onDismiss = { showTermsDialog = false }
        )
    }

    if (showDelayDialog) {
        SelectionDialog(
            title = "Message Send Delay",
            options = listOf("No Delay", "1 Second", "2 Seconds", "5 Seconds", "10 Seconds"),
            currentValue = "${if(sendDelay == 0) "No" else sendDelay} Delay" + if(sendDelay > 1) "s" else if(sendDelay == 1) " Second" else "",
            onSelect = { option ->
                sendDelay = when(option) {
                    "No Delay" -> 0
                    "1 Second" -> 1
                    "2 Seconds" -> 2
                    "5 Seconds" -> 5
                    else -> 10
                }
                PrefsManager.setSendDelay(sendDelay)
                showDelayDialog = false
            },
            onDismiss = { showDelayDialog = false }
        )
    }
}

@Composable
fun InfoDialog(title: String, content: String, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = { Text(content) },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close") }
        }
    )
}

@Composable
fun SelectionDialog(
    title: String, 
    options: List<String>, 
    currentValue: String, 
    onSelect: (String) -> Unit, 
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = {
            Column {
                options.forEach { option ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = (option == currentValue),
                            onClick = { onSelect(option) }
                        )
                        Text(
                            text = option,
                            modifier = Modifier.padding(start = 16.dp),
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun SmsLogItem(log: SmsMessage) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val database = (context.applicationContext as App).database

    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(if (log.type == 1) Color(0xFFE3F2FD) else Color(0xFFF3E5F5)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (log.type == 1) Icons.AutoMirrored.Filled.CallReceived else Icons.AutoMirrored.Filled.CallMade,
                    contentDescription = null,
                    tint = if (log.type == 1) Color(0xFF1976D2) else Color(0xFF7B1FA2),
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(log.address, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                    Text(formatTime(log.date), style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }
                Text(
                    log.body, 
                    style = MaterialTheme.typography.bodySmall, 
                    maxLines = 1, 
                    overflow = TextOverflow.Ellipsis
                )
            }
            IconButton(onClick = {
                scope.launch {
                    database.smsDao().deleteById(log.id)
                    Toast.makeText(context, "Log deleted from app", Toast.LENGTH_SHORT).show()
                }
            }) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.LightGray, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    ElevatedCard(
        modifier = modifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = Color.Gray)
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
    }
}

@Composable
private fun SettingsToggleItem(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    NavigationDrawerItem(
        label = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(label)
                Switch(checked = checked, onCheckedChange = onCheckedChange)
            }
        },
        selected = false,
        onClick = { },
        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
    )
}

@Composable
private fun DrawerSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(vertical = 8.dp, horizontal = 16.dp)
    )
}

@Composable
private fun DrawerItem(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color = Color.Unspecified,
    onClick: () -> Unit = {}
) {
    NavigationDrawerItem(
        label = { Text(label, color = color) },
        selected = false,
        onClick = onClick,
        icon = { Icon(icon, contentDescription = null, tint = if (color != Color.Unspecified) color else LocalContentColor.current) },
        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
    )
}

private fun formatTime(timestamp: Long): String {
    val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    return sdf.format(Date(timestamp))
}
