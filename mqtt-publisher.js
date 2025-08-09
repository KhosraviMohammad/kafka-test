const mqtt = require('mqtt');

// تنظیمات اتصال به EMQX
const options = {
    host: 'localhost',
    port: 11883,
    protocol: 'mqtt',
    clientId: 'publisher_' + Math.random().toString(16).substr(2, 8),
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
};

// اتصال به EMQX broker
const client = mqtt.connect(options);

// رویدادهای اتصال
client.on('connect', () => {
    console.log('🔗 Publisher متصل به EMQX شد');
    console.log(`📱 Client ID: ${options.clientId}`);
    console.log('📤 شروع ارسال پیام‌ها...\n');
    
    // شروع ارسال پیام‌های دوره‌ای
    startPublishing();
});

client.on('error', (error) => {
    console.error('❌ خطا در اتصال:', error);
});

client.on('offline', () => {
    console.log('📵 Publisher از EMQX قطع شد');
});

client.on('reconnect', () => {
    console.log('🔄 در حال تلاش برای اتصال مجدد...');
});

// تابع ارسال پیام‌ها
function startPublishing() {
    let messageCount = 1;
    
    // ارسال پیام هر 3 ثانیه
    const interval = setInterval(() => {
        const topics = [
            'sensors/temperature',
            'sensors/humidity', 
            'alerts/system',
            'data/analytics'
        ];
        
        // انتخاب تصادفی topic
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        // تولید داده تصادفی بر اساس topic
        let message;
        const timestamp = new Date().toISOString();
        
        switch(topic) {
            case 'sensors/temperature':
                message = JSON.stringify({
                    type: 'temperature',
                    value: (Math.random() * 40 + 10).toFixed(2), // 10-50 درجه
                    unit: 'celsius',
                    timestamp: timestamp,
                    sensor_id: 'TEMP_001'
                });
                break;
                
            case 'sensors/humidity':
                message = JSON.stringify({
                    type: 'humidity',
                    value: (Math.random() * 100).toFixed(2), // 0-100 درصد
                    unit: 'percent',
                    timestamp: timestamp,
                    sensor_id: 'HUM_001'
                });
                break;
                
            case 'alerts/system':
                const alerts = ['HIGH_TEMP', 'LOW_BATTERY', 'CONNECTION_LOST', 'NORMAL'];
                message = JSON.stringify({
                    type: 'alert',
                    level: alerts[Math.floor(Math.random() * alerts.length)],
                    description: 'سیستم در حال نظارت است',
                    timestamp: timestamp,
                    system_id: 'SYS_001'
                });
                break;
                
            case 'data/analytics':
                message = JSON.stringify({
                    type: 'analytics',
                    users_online: Math.floor(Math.random() * 1000),
                    cpu_usage: (Math.random() * 100).toFixed(2),
                    memory_usage: (Math.random() * 100).toFixed(2),
                    timestamp: timestamp
                });
                break;
        }
        
        // ارسال پیام
        client.publish(topic, message, { qos: 1 }, (error) => {
            if (error) {
                console.error('❌ خطا در ارسال پیام:', error);
            } else {
                console.log(`📤 پیام ${messageCount} ارسال شد:`);
                console.log(`   📍 Topic: ${topic}`);
                console.log(`   💬 پیام: ${message}`);
                console.log(`   ⏰ زمان: ${new Date().toLocaleString('fa-IR')}\n`);
            }
        });
        
        messageCount++;
        
        // توقف بعد از 20 پیام
        if (messageCount > 20) {
            clearInterval(interval);
            console.log('✅ ارسال 20 پیام کامل شد. Publisher در حال توقف...');
            setTimeout(() => {
                client.end();
                process.exit(0);
            }, 2000);
        }
        
    }, 3000); // هر 3 ثانیه
}

// مدیریت خروج برنامه
process.on('SIGINT', () => {
    console.log('\n⏹️  دریافت سیگنال توقف...');
    client.end();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  دریافت سیگنال پایان...');
    client.end();
    process.exit(0);
});

console.log('🚀 MQTT Publisher آماده است...');
console.log('📡 در حال اتصال به EMQX broker...');
