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
            type: 'heartbeat',
            message: 'Hello from simple client',
            timestamp: new Date().toISOString()
        });
    }
}, 5000);

// Send log every 10 seconds
setInterval(() => {
    if (isRegistered) {
        client.sendLog({
            level: 'info',
            message: 'Periodic log message',
            timestamp: new Date().toISOString()
        });
    }
}, 5000);

console.log('🚀 Simple MQTT client started');
console.log('📤 Will send notifications and logs every 10 seconds after registration');
