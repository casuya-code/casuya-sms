package com.casuya.sms.ui.dashboard

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.Logout
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.services.SMSBackgroundService
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(onLogout: () -> Unit) {
    val context = LocalContext.current
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var connected by remember { mutableStateOf(SMSBackgroundService.isConnected) }
    var smsCount by remember { mutableIntStateOf(SMSBackgroundService.smsCount) }
    var smsReceivedCount by remember { mutableIntStateOf(SMSBackgroundService.smsReceivedCount) }
    var lastSmsTime by remember { mutableLongStateOf(SMSBackgroundService.lastSmsTime) }

    // Settings States
    var gatewayEnabled by remember { mutableStateOf(PrefsManager.isGatewayEnabled()) }
    var stickyNotifEnabled by remember { mutableStateOf(PrefsManager.isStickyNotifEnabled()) }
    var sendDelay by remember { mutableIntStateOf(PrefsManager.getSendDelay()) }
    var simSlot by remember { mutableIntStateOf(PrefsManager.getSimSlot()) }

    // Dialog States
    var showAboutDialog by remember { mutableStateOf(false) }
    var showSupportDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showDelayDialog by remember { mutableStateOf(false) }
    var showSimDialog by remember { mutableStateOf(false) }
    var showFiltersDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        while (true) {
            connected = SMSBackgroundService.isConnected
            smsCount = SMSBackgroundService.smsCount
            smsReceivedCount = SMSBackgroundService.smsReceivedCount
            lastSmsTime = SMSBackgroundService.lastSmsTime
            delay(1000)
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
                            Text(
                                text = "ID: ${PrefsManager.getDeviceId()?.take(8)}...",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.6f)
                            )
                        }
                    }

                    Column(modifier = Modifier.padding(16.dp)) {
                        DrawerSectionHeader("GATEWAY STATUS")
                        DrawerItem(
                            label = if (connected) "Active & Online" else "Gateway Offline",
                            icon = Icons.Default.Info,
                            color = if (connected) Color(0xFF4CAF50) else Color(0xFFF44336)
                        )

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        DrawerSectionHeader("STATISTICS")
                        DrawerItem(label = "Sent: $smsCount", icon = Icons.AutoMirrored.Filled.List)
                        DrawerItem(label = "Received: $smsReceivedCount", icon = Icons.AutoMirrored.Filled.List)
                        DrawerItem(label = "Last: ${if (lastSmsTime > 0) formatTime(lastSmsTime) else "None"}", icon = Icons.Default.History)

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        DrawerSectionHeader("PREFERENCES")
                        SettingsToggleItem("Enable Gateway", gatewayEnabled) { 
                            gatewayEnabled = it
                            PrefsManager.setGatewayEnabled(it)
                            Toast.makeText(context, if(it) "Gateway Enabled" else "Gateway Disabled", Toast.LENGTH_SHORT).show()
                        }
                        
                        SettingsToggleItem("Sticky Notification", stickyNotifEnabled) { 
                            stickyNotifEnabled = it
                            PrefsManager.setStickyNotifEnabled(it)
                        }
                        
                        DrawerItem(label = "Default SIM: ${if(simSlot == 0) "Auto" else "SIM $simSlot"}", icon = Icons.Default.SimCard) {
                            showSimDialog = true
                        }
                        
                        DrawerItem(label = "Send Delay: ${sendDelay}s", icon = Icons.Default.Timer) {
                            showDelayDialog = true
                        }

                        DrawerItem(label = "Configure Filters", icon = Icons.Default.FilterList) {
                            showFiltersDialog = true
                        }
                        
                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        DrawerSectionHeader("HELP & LEGAL")
                        DrawerItem(label = "About Casuya SMS", icon = Icons.Default.Business) { showAboutDialog = true }
                        DrawerItem(label = "Get Support", icon = Icons.Default.SupportAgent) { showSupportDialog = true }
                        DrawerItem(label = "Share App", icon = Icons.Default.Share) {
                            Toast.makeText(context, "Share link copied", Toast.LENGTH_SHORT).show()
                        }
                        DrawerItem(label = "Terms of Service", icon = Icons.Default.Description) { showTermsDialog = true }
                        DrawerItem(label = "Privacy Policy", icon = Icons.Default.PrivacyTip) { showPrivacyDialog = true }
                        
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
                    title = { Text("Dashboard", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
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
                            text = if (connected) "Gateway Connected" else "Gateway Offline",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (connected) Color(0xFF2E7D32) else Color(0xFFC62828)
                        )
                        
                        Text(
                            text = if (connected) "Ready to route messages" else "Reconnect to start sending",
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
                        Text("Session Info", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                        DetailRow("Device ID", PrefsManager.getDeviceId() ?: "N/A")
                        DetailRow("Email", PrefsManager.getEmail() ?: "Unknown")
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
            }
        }
    }

    // --- Dialogs ---

    if (showAboutDialog) {
        InfoDialog(
            title = "About Casuya SMS",
            content = "Casuya SMS is a high-performance Android SMS Gateway. It turns your physical Android device into a powerful messaging server, allowing you to send and receive SMS via our cloud dashboard and API.",
            onDismiss = { showAboutDialog = false }
        )
    }

    if (showSupportDialog) {
        InfoDialog(
            title = "Get Support",
            content = "Need help? Visit our documentation at docs.casuya-sms.com or email our support team at support@casuya-sms.com. We are available 24/7 for technical assistance.",
            onDismiss = { showSupportDialog = false }
        )
    }

    if (showTermsDialog) {
        InfoDialog(
            title = "Terms of Service",
            content = "By using Casuya SMS, you agree to comply with local telecommunication laws. You are responsible for all messages sent via your device. Spamming is strictly prohibited and will result in immediate account termination.",
            onDismiss = { showTermsDialog = false }
        )
    }

    if (showPrivacyDialog) {
        InfoDialog(
            title = "Privacy Policy",
            content = "We value your privacy. Casuya SMS only accesses your SMS data to provide gateway services. We do not store the content of your personal messages on our servers beyond what is required for routing logs.",
            onDismiss = { showPrivacyDialog = false }
        )
    }

    if (showDelayDialog) {
        SelectionDialog(
            title = "Send Delay",
            options = listOf("No Delay", "1 Second", "2 Seconds", "5 Seconds", "10 Seconds"),
            currentValue = "${if(sendDelay == 0) "No" else sendDelay} Delay" + if(sendDelay > 0) "s" else "",
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

    if (showSimDialog) {
        SelectionDialog(
            title = "Default SIM",
            options = listOf("Auto (System Default)", "SIM Slot 1", "SIM Slot 2"),
            currentValue = if(simSlot == 0) "Auto (System Default)" else "SIM Slot $simSlot",
            onSelect = { option ->
                simSlot = when(option) {
                    "SIM Slot 1" -> 1
                    "SIM Slot 2" -> 2
                    else -> 0
                }
                PrefsManager.setSimSlot(simSlot)
                showSimDialog = false
            },
            onDismiss = { showSimDialog = false }
        )
    }

    if (showFiltersDialog) {
        InfoDialog(
            title = "Configure Filters",
            content = "Filters allow you to block or allow messages based on keywords or phone numbers. This feature is coming soon in the next update!",
            onDismiss = { showFiltersDialog = false }
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
