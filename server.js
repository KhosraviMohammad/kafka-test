const mqtt = require('mqtt');

// متغیرهای سراسری
const serverId = 'server_main';
const clients = new Map(); // Map of clientId -> {status, lastSeen, info}
let client = null;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1IjoxLCJleHAiOjE3NTQ5MDMxODYsImlhdCI6MTc1NDg5OTU4Nn0.tzcCLQMpe3cdhWZtzaxR41gcL4nr8zk-GR425xuhyrc';

// اتصال به MQTT
function connect() {
    console.log('🔌 سرور در حال اتصال به MQTT...');
    
    client = mqtt.connect({
        host: 'localhost',
        port: 11883,
        clientId: serverId,
        username: '',
        password: token
    });
    
    client.on('connect', onConnect);
    client.on('message', onMessage);
    client.on('error', (error) => console.error('❌ خطا:', error));
}

function onConnect() {
    console.log('✅ سرور متصل شد');
    console.log(`🆔 Server ID: ${serverId}\n`);
    
    // Subscribe به topics مختلف
    client.subscribe('client/+/connect');    // اتصال کلاینت
    client.subscribe('client/+/disconnect'); // قطع کلاینت
    client.subscribe('client/+/message');    // پیام از کلاینت
    
    console.log('👂 سرور آماده دریافت پیام‌ها');
    startServerOperations();
}

function onMessage(topic, message) {
    try {
        const data = JSON.parse(message.toString());
        const parts = topic.split('/');
        const clientId = parts[1];
        const action = parts[2];
        
        switch(action) {
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
        console.error('❌ خطا در پردازش پیام:', error);
    }
}

function handleClientConnect(clientId, data) {
    clients.set(clientId, {
        status: 'online',
        lastSeen: new Date(),
        info: data,
        connectedAt: new Date()
    });
    
    console.log(`🟢 کلاینت متصل شد: ${clientId}`);
    console.log(`   📛 نام: ${data.name || 'ناشناس'}`);
    console.log(`   ⏰ زمان: ${new Date().toLocaleTimeString('fa-IR')}`);
    
    // پیام خوش‌آمدگویی
    sendToClient(clientId, `سلام ${data.name || clientId}! به سرور خوش آمدید`);
    
    showConnectedClients();
}

function handleClientDisconnect(clientId, data) {
    if (clients.has(clientId)) {
        const clientInfo = clients.get(clientId);
        clientInfo.status = 'offline';
        clientInfo.disconnectedAt = new Date();
        
        console.log(`🔴 کلاینت قطع شد: ${clientId}`);
        console.log(`   💭 دلیل: ${data.reason || 'نامشخص'}`);
        console.log(`   ⏰ زمان: ${new Date().toLocaleTimeString('fa-IR')}`);
        
        // حذف بعد از 2 دقیقه
        setTimeout(() => {
            clients.delete(clientId);
            console.log(`🗑️  ${clientId} از لیست حذف شد`);
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
    
    console.log(`\n📨 پیام از ${clientId}:`);
    console.log(`   💬 "${data.text}"`);
    console.log(`   ⏰ ${new Date(data.timestamp).toLocaleTimeString('fa-IR')}`);
    
    // پاسخ به کلاینت
    const responses = [
        'پیام شما دریافت شد',
        'ممنون از پیامتان',
        'باشه، فهمیدم',
        'متشکرم',
        'پیام شما ثبت شد'
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    setTimeout(() => {
        sendToClient(clientId, response);
    }, 1000);
}

// ارسال پیام به کلاینت مشخص
function sendToClient(clientId, text) {
    const message = {
        from: 'server',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    const topic = `server/to/${clientId}`;
    client.publish(topic, JSON.stringify(message));
    console.log(`📤 پیام ارسال شد به ${clientId}: "${text}"`);
}

// ارسال پیام عمومی
function sendBroadcast(text) {
    const message = {
        from: 'server',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    client.publish('server/broadcast', JSON.stringify(message));
    console.log(`📢 پیام عمومی ارسال شد: "${text}"`);
}

function startServerOperations() {
    console.log('\n🚀 سرور آماده است...\n');
    
    // نمایش کلاینت‌های متصل هر 30 ثانیه
    setInterval(() => {
        showConnectedClients();
    }, 30000);
    
    // ارسال پیام‌های تستی
    setInterval(() => {
        sendTestMessages();
    }, 15000);
}

function sendTestMessages() {
    const onlineClients = Array.from(clients.entries())
        .filter(([_, clientInfo]) => clientInfo.status === 'online');
        
    if (onlineClients.length === 0) {
        console.log('⏳ هیچ کلاینت آنلاینی نیست');
        return;
    }
    
    // گاهی پیام شخصی، گاهی عمومی
    if (Math.random() > 0.5) {
        // پیام شخصی
        const [randomClientId] = onlineClients[Math.floor(Math.random() * onlineClients.length)];
        const messages = [
            'چطوری؟',
            'وضعیتت چطوره؟',
            'یه کار جدید برات دارم',
            'همه چی خوبه؟',
            'چه خبر؟'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendToClient(randomClientId, randomMessage);
    } else {
        // پیام عمومی
        const messages = [
            'سلام به همه!',
            'وضعیت سیستم خوبه',
            'یادتون باشه گزارش بدین',
            'فعالیت‌هاتون رو ادامه بدین',
            'روز خوبی داشته باشین'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendBroadcast(randomMessage);
    }
}

function showConnectedClients() {
    const onlineCount = Array.from(clients.values()).filter(c => c.status === 'online').length;
    const totalCount = clients.size;
    
    console.log(`\n📊 وضعیت کلاینت‌ها: ${onlineCount}/${totalCount} آنلاین`);
    
    if (clients.size > 0) {
        console.log('┌─────────────┬─────────┬─────────────────────┐');
        console.log('│ Client ID   │ Status  │ Last Seen           │');
        console.log('├─────────────┼─────────┼─────────────────────┤');
        
        clients.forEach((clientInfo, clientId) => {
            const id = clientId.substring(0, 11).padEnd(11);
            const status = clientInfo.status === 'online' ? '🟢 آنلاین' : '🔴 آفلاین';
            const lastSeen = clientInfo.lastSeen.toLocaleTimeString('fa-IR').padEnd(19);
            
            console.log(`│ ${id} │ ${status} │ ${lastSeen} │`);
        });
        
        console.log('└─────────────┴─────────┴─────────────────────┘');
    }
    console.log('');
}

function shutdown() {
    console.log('\n⏹️  سرور در حال خاموش شدن...');
    
    sendBroadcast('سرور خاموش می‌شود. خداحافظ!');
    
    setTimeout(() => {
        client.end();
        process.exit(0);
    }, 2000);
}

// مدیریت خروج
process.on('SIGINT', shutdown);

// راه‌اندازی سرور
console.log('🌟 راه‌اندازی سرور ساده...');
connect();