const mqtt = require('mqtt');

// Global variables
const serverId = 'server_main';
const clients = new Map(); // Map of clientId -> {status, lastSeen, info}
let client = null;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1IjoxLCJleHAiOjE3NTQ5MDMxODYsImlhdCI6MTc1NDg5OTU4Nn0.tzcCLQMpe3cdhWZtzaxR41gcL4nr8zk-GR425xuhyrc';

// Connect to MQTT
function connect() {
    console.log('🔌 Server connecting to MQTT...');

    client = mqtt.connect({
        host: 'localhost',
        port: 11883,
        clientId: serverId,
        username: '',
        password: token,
        properties: {
            userProperties: {
                r: 'admin',
                org_id: 'org_123',
                debug: 'true'
            }
        }
    });

    client.on('connect', onConnect);
    client.on('message', onMessage);
    client.on('error', (error) => console.error('❌ Error:', error));
}

function onConnect() {
    console.log('✅ Server connected');
    console.log(`🆔 Server ID: ${serverId}\n`);

    // Subscribe to different topics
    client.subscribe('client/+/connect');    // Client connection
    client.subscribe('client/+/disconnect'); // Client disconnection
    client.subscribe('client/+/message');    // Message from client

    console.log('👂 Server ready to receive messages');
    startServerOperations();
}

function onMessage(topic, message) {
    try {
        const data = JSON.parse(message.toString());
        const parts = topic.split('/');
        const clientId = parts[1];
        const action = parts[2];

        switch (action) {
            case 'connect':
                handleClientConnect(clientId, data);
                break;
            case 'disconnect':
                handleClientDisconnect(clientId, data);
                break;
            case 'message':
                handleClientMessage(clientId, data);
                break;
        }
    } catch (error) {
        console.error('❌ Error processing message:', error);
    }
}

function handleClientConnect(clientId, data) {
    clients.set(clientId, {
        status: 'online',
        lastSeen: new Date(),
        info: data,
        connectedAt: new Date()
    });

    console.log(`🟢 Client connected: ${clientId}`);
    console.log(`   📛 Name: ${data.name || 'Unknown'}`);
    console.log(`   ⏰ Time: ${new Date().toLocaleTimeString('en-US')}`);

    // Welcome message
    sendToClient(clientId, `Hello ${data.name || clientId}! Welcome to the server`);

    showConnectedClients();
}

function handleClientDisconnect(clientId, data) {
    if (clients.has(clientId)) {
        const clientInfo = clients.get(clientId);
        clientInfo.status = 'offline';
        clientInfo.disconnectedAt = new Date();

        console.log(`🔴 Client disconnected: ${clientId}`);
        console.log(`   💭 Reason: ${data.reason || 'Unknown'}`);
        console.log(`   ⏰ Time: ${new Date().toLocaleTimeString('en-US')}`);

        // Remove after 2 minutes
        setTimeout(() => {
            clients.delete(clientId);
            console.log(`🗑️  ${clientId} removed from list`);
        }, 120000);
    }

    showConnectedClients();
}

function handleClientMessage(clientId, data) {
    if (clients.has(clientId)) {
        const clientInfo = clients.get(clientId);
        clientInfo.lastSeen = new Date();
        clientInfo.status = 'online';
    }

    console.log(`\n📨 Message from ${clientId}:`);
    console.log(`   💬 "${data.text}"`);
    console.log(`   ⏰ ${new Date(data.timestamp).toLocaleTimeString('en-US')}`);

    // Response to client
    const responses = [
        'Message received',
        'Thank you for your message',
        'Got it',
        'Thanks',
        'Message recorded'
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(() => {
        sendToClient(clientId, response);
    }, 1000);
}

// Send message to specific client
function sendToClient(clientId, text) {
    const message = {
        from: 'server',
        text: text,
        timestamp: new Date().toISOString()
    };

    const topic = `server/to/${clientId}`;
    client.publish(topic, JSON.stringify(message));
    console.log(`📤 Message sent to ${clientId}: "${text}"`);
}

// Send public message
function sendBroadcast(text) {
    const message = {
        from: 'server',
        text: text,
        timestamp: new Date().toISOString()
    };

    client.publish('server/broadcast', JSON.stringify(message));
    console.log(`📢 Public message sent: "${text}"`);
}

function startServerOperations() {
    console.log('\n🚀 Server is ready...\n');

    // Show connected clients every 30 seconds
    setInterval(() => {
        showConnectedClients();
    }, 30000);

    // Send test messages
    setInterval(() => {
        sendTestMessages();
    }, 15000);
}

function sendTestMessages() {
    const onlineClients = Array.from(clients.entries())
        .filter(([_, clientInfo]) => clientInfo.status === 'online');

    if (onlineClients.length === 0) {
        console.log('⏳ No online clients');
        return;
    }

    // Sometimes personal message, sometimes public
    if (Math.random() > 0.5) {
        // Personal message
        const [randomClientId] = onlineClients[Math.floor(Math.random() * onlineClients.length)];
        const messages = [
            'How are you?',
            'How is everything?',
            'I have a new task for you',
            'Is everything okay?',
            'What\'s up?'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendToClient(randomClientId, randomMessage);
    } else {
        // Public message
        const messages = [
            'Hello everyone!',
            'System status is good',
            'Remember to submit reports',
            'Keep up your activities',
            'Have a great day'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendBroadcast(randomMessage);
    }
}

function showConnectedClients() {
    const onlineCount = Array.from(clients.values()).filter(c => c.status === 'online').length;
    const totalCount = clients.size;

    console.log(`\n📊 Client Status: ${onlineCount}/${totalCount} online`);

    if (clients.size > 0) {
        console.log('┌─────────────┬─────────┬─────────────────────┐');
        console.log('│ Client ID   │ Status  │ Last Seen           │');
        console.log('├─────────────┼─────────┼─────────────────────┤');

        clients.forEach((clientInfo, clientId) => {
            const id = clientId.substring(0, 11).padEnd(11);
            const status = clientInfo.status === 'online' ? '🟢 Online' : '🔴 Offline';
            const lastSeen = clientInfo.lastSeen.toLocaleTimeString('en-US').padEnd(19);

            console.log(`│ ${id} │ ${status} │ ${lastSeen} │`);
        });

        console.log('└─────────────┴─────────┴─────────────────────┘');
    }
    console.log('');
}

function shutdown() {
    console.log('\n⏹️  Server shutting down...');

    sendBroadcast('Server is shutting down. Goodbye!');

    setTimeout(() => {
        client.end();
        process.exit(0);
    }, 2000);
}

// Exit management
process.on('SIGINT', shutdown);

// Server startup
console.log('🌟 Starting simple server...');
connect();