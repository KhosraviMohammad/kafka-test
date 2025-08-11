const mqtt = require('mqtt');

// متغیرهای سراسری
let clientId = '';
let clientName = '';
let client = null;
let isConnected = false;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1IjoxLCJleHAiOjE3NTQ5MDMxODYsImlhdCI6MTc1NDg5OTU4Nn0.tzcCLQMpe3cdhWZtzaxR41gcL4nr8zk-GR425xuhyrc';

// تابع اصلی راه‌اندازی
function init(id, name) {
    clientId = id || 'client_' + Math.random().toString(16).substr(2, 6);
    clientName = name || `کلاینت-${clientId}`;

    connect();
}

function connect() {
    console.log(`🔌 ${clientName} در حال اتصال به MQTT...`);

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
    client.on('error', (error) => console.error(`❌ خطا ${clientName}:`, error));
    client.on('close', onDisconnect);
}

function onConnect() {
    console.log(`✅ ${clientName} متصل شد`);
    console.log(`🆔 Client ID: ${clientId}`);

    isConnected = true;

    // Subscribe به پیام‌های سرور
    client.subscribe(`server/to/${clientId}`); // پیام‌های شخصی
    client.subscribe('server/broadcast');       // پیام‌های عمومی

    // اعلام اتصال به سرور
    announceConnection();

    // شروع فعالیت‌ها
    startClientActivities();

    console.log(`👂 ${clientName} آماده دریافت پیام‌ها\n`);
}

function onMessage(topic, message) {
    try {
        const data = JSON.parse(message.toString());

        if (topic === 'server/broadcast') {
            console.log(`📢 [${clientName}] پیام عمومی از سرور:`);
        } else {
            console.log(`📨 [${clientName}] پیام شخصی از سرور:`);
        }

        console.log(`   💬 "${data.text}"`);
        console.log(`   ⏰ ${new Date(data.timestamp).toLocaleTimeString('fa-IR')}`);

        // پاسخ به پیام‌های شخصی
        if (topic !== 'server/broadcast' && Math.random() > 0.3) {
            setTimeout(() => {
                const responses = [
                    'ممنون!',
                    'باشه حتماً',
                    'فهمیدم',
                    'اوکی',
                    'دستت درد نکنه',
                    'چشم'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                sendMessage(response);
            }, 2000 + Math.random() * 3000);
        }

    } catch (error) {
        console.error(`❌ خطا در پردازش پیام ${clientName}:`, error);
    }
}

function onDisconnect() {
    console.log(`📵 ${clientName} قطع شد`);
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
    console.log(`📢 [${clientName}] اتصال اعلام شد`);
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
    console.log(`📤 [${clientName}] پیام ارسال شد: "${text}"`);
}

function startClientActivities() {
    // پیام اول
    setTimeout(() => {
        sendMessage(`سلام! من ${clientName} هستم`);
    }, 3000);

    // ارسال پیام‌های دوره‌ای
    setInterval(() => {
        if (!isConnected) return;

        const messages = [
            'چه خبر؟',
            'همه چی خوبه',
            'دارم کار می‌کنم',
            'یه سوال داشتم',
            'امروز چطوره؟',
            'وضعیت عالیه',
            'کارها رو انجام دادم',
            'آماده دریافت دستور هستم'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendMessage(randomMessage);

    }, 10000 + Math.random() * 15000); // هر 10-25 ثانیه
}

function disconnect(reason = 'normal_shutdown') {
    console.log(`⏹️  ${clientName} در حال قطع اتصال...`);

    // اعلام قطع اتصال
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
            console.log(`✅ ${clientName} قطع شد`);
        }, 1000);
    });
}

// دریافت پارامترها از command line
const cmdClientId = process.argv[2];
const cmdClientName = process.argv[3];

// مدیریت خروج
process.on('SIGINT', () => {
    disconnect('user_interrupt');
    setTimeout(() => process.exit(0), 2000);
});

// راه‌اندازی کلاینت
console.log('🌟 راه‌اندازی کلاینت ساده...');
init(cmdClientId, cmdClientName);