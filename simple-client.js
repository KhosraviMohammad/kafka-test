import { createMQTTClient } from './node-client.js';

// Global variable for registration status
let isRegistered = false;

// Registration handler - called when server registers the client
const handleRegistration = (isAccepted) => {
    if (isAccepted === true) {
        isRegistered = isAccepted;
        console.log('✅ Client registered successfully', isRegistered);
    }
};

// Server notification handler - logs when called
const handleServerNotification = (data) => {
    console.log('📨 Server notification received:', JSON.stringify(data));
};

// Create MQTT client
const client = createMQTTClient('simple_client_001', handleRegistration, handleServerNotification);

// Send notification every 10 seconds
setInterval(() => {
    if (isRegistered) {
        client.sendNotification({
            type: 'NOTIFICATION_REQUEST',
            data: {
                targetedUserSid: 1,
                isValidUntil: 30,
                notifId: Math.floor(10000 + Math.random() * 90000).toString(),

            }
        });
        console.log('🔥 Notification sent');
    }
}, 25000);

// Send log every 10 seconds
setInterval(() => {
    if (isRegistered) {
        client.sendLog({
            level: 'info',
            message: 'Periodic log message',
            test: 1
        });
        console.log('🔥 Log sent');
    }
}, 25000);

console.log('🚀 Simple MQTT client started');
console.log('📤 Will send notifications and logs every 10 seconds after registration');
