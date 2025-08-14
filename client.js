const mqtt = require('mqtt');

// Global variables
let clientId = '';
let clientName = '';
let client = null;
let isConnected = false;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1IjoxLCJleHAiOjE3NTQ5MDMxODYsImlhdCI6MTc1NDg5OTU4Nn0.tzcCLQMpe3cdhWZtzaxR41gcL4nr8zk-GR425xuhyrc';

// Main initialization function
function init(id, name) {
    clientId = id || 'client_' + Math.random().toString(16).substr(2, 6);
    clientName = name || `Client-${clientId}`;

    connect();
}

function connect() {
    console.log(`🔌 ${clientName} connecting to MQTT...`);

    client = mqtt.connect({
        host: 'localhost',
        port: 11883,
        clientId: clientId,
        // username: token,
        username: '',
        password: token,
        will: {
            topic: `client/${clientId}/disconnect`,
            payload: JSON.stringify({
                clientId: clientId,
                name: clientName,
                reason: 'unexpected_disconnect',
                timestamp: new Date().toISOString()
            }),
            qos: 1
        }
    });

    client.on('connect', onConnect);
    client.on('message', onMessage);
    client.on('error', (error) => console.error(`❌ Error ${clientName}:`, error));
    client.on('close', onDisconnect);
}

function onConnect() {
    console.log(`✅ ${clientName} connected`);
    console.log(`🆔 Client ID: ${clientId}`);

    isConnected = true;

    // Subscribe to server messages
    client.subscribe(`server/to/${clientId}`); // Personal messages
    client.subscribe('server/broadcast');       // Public messages

    // Announce connection to server
    announceConnection();

    // Start activities
    startClientActivities();

    console.log(`👂 ${clientName} ready to receive messages\n`);
}

function onMessage(topic, message) {
    try {
        const data = JSON.parse(message.toString());

        if (topic === 'server/broadcast') {
            console.log(`📢 [${clientName}] Public message from server:`);
        } else {
            console.log(`📨 [${clientName}] Personal message from server:`);
        }

        console.log(`   💬 "${data.text}"`);
        console.log(`   ⏰ ${new Date(data.timestamp).toLocaleTimeString('en-US')}`);

        // Respond to personal messages
        if (topic !== 'server/broadcast' && Math.random() > 0.3) {
            setTimeout(() => {
                const responses = [
                    'Thank you!',
                    'Sure thing',
                    'Got it',
                    'OK',
                    'Thanks',
                    'Eye'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                sendMessage(response);
            }, 2000 + Math.random() * 3000);
        }

    } catch (error) {
        console.error(`❌ Error processing message ${clientName}:`, error);
    }
}

function onDisconnect() {
    console.log(`📵 ${clientName} disconnected`);
    isConnected = false;
}

function announceConnection() {
    const connectData = {
        clientId: clientId,
        name: clientName,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    };

    const topic = `client/${clientId}/connect`;
    client.publish(topic, JSON.stringify(connectData));
    console.log(`📢 [${clientName}] Connection announced`);
}

function sendMessage(text) {
    if (!isConnected) return;

    const message = {
        clientId: clientId,
        name: clientName,
        text: text,
        timestamp: new Date().toISOString()
    };

    const topic = `client/${clientId}/message`;
    client.publish(topic, JSON.stringify(message));
    console.log(`📤 [${clientName}] Message sent: "${text}"`);
}

function startClientActivities() {
    // First message
    setTimeout(() => {
        sendMessage(`Hello! I am ${clientName}`);
    }, 3000);

    // Send periodic messages
    setInterval(() => {
        if (!isConnected) return;

        const messages = [
            'What\'s up?',
            'Everything is good',
            'I\'m working',
            'I have a question',
            'How is today?',
            'Status is excellent',
            'I completed the tasks',
            'Ready to receive orders'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendMessage(randomMessage);

    }, 10000 + Math.random() * 15000); // Every 10-25 seconds
}

function disconnect(reason = 'normal_shutdown') {
    console.log(`⏹️  ${clientName} disconnecting...`);

    // Announce disconnection
    const disconnectData = {
        clientId: clientId,
        name: clientName,
        reason: reason,
        timestamp: new Date().toISOString()
    };

    const topic = `client/${clientId}/disconnect`;
    client.publish(topic, JSON.stringify(disconnectData), () => {
        setTimeout(() => {
            client.end();
            console.log(`✅ ${clientName} disconnected`);
        }, 1000);
    });
}

// Get parameters from command line
const cmdClientId = process.argv[2];
const cmdClientName = process.argv[3];

// Exit management
process.on('SIGINT', () => {
    disconnect('user_interrupt');
    setTimeout(() => process.exit(0), 2000);
});

// Client startup
console.log('🌟 Starting simple client...');
init(cmdClientId, cmdClientName);