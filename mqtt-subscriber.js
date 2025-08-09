const mqtt = require('mqtt');

// تنظیمات اتصال به EMQX
const options = {
    host: 'localhost',
    port: 11883,
    protocol: 'mqtt',
    clientId: 'subscriber_' + Math.random().toString(16).substr(2, 8),
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
};

// اتصال به EMQX broker
const client = mqtt.connect(options);

// لیست topic های مورد نظر برای subscribe
const topics = [
    'sensors/temperature',
    'sensors/humidity', 
    'alerts/system',
    'data/analytics'
];

// شمارنده پیام‌های دریافتی
let messageCount = 0;
const receivedMessages = {
    'sensors/temperature': 0,
    'sensors/humidity': 0,
    'alerts/system': 0,
    'data/analytics': 0
};

// رویدادهای اتصال
client.on('connect', () => {
    console.log('🔗 Subscriber متصل به EMQX شد');
    console.log(`📱 Client ID: ${options.clientId}`);
    console.log('📥 در حال subscribe به topic ها...\n');
    
    // Subscribe به همه topic ها
    topics.forEach(topic => {
        client.subscribe(topic, { qos: 1 }, (error) => {
            if (error) {
                console.error(`❌ خطا در subscribe به ${topic}:`, error);
            } else {
                console.log(`✅ Subscribe به ${topic} موفق بود`);
            }
        });
    });
    
    console.log('\n🎧 آماده دریافت پیام‌ها...\n');
});

client.on('error', (error) => {
    console.error('❌ خطا در اتصال:', error);
});

client.on('offline', () => {
    console.log('📵 Subscriber از EMQX قطع شد');
});

client.on('reconnect', () => {
    console.log('🔄 در حال تلاش برای اتصال مجدد...');
});

// دریافت پیام‌ها
client.on('message', (topic, message, packet) => {
    messageCount++;
    receivedMessages[topic]++;
    
    try {
        const data = JSON.parse(message.toString());
        const now = new Date().toLocaleString('fa-IR');
        
        console.log(`📨 پیام ${messageCount} دریافت شد:`);
        console.log(`   📍 Topic: ${topic}`);
        console.log(`   🏷️  QoS: ${packet.qos}`);
        console.log(`   ⏰ زمان دریافت: ${now}`);
        
        // نمایش محتوای پیام بر اساس نوع
        switch(data.type) {
            case 'temperature':
                console.log(`   🌡️  دما: ${data.value}°${data.unit}`);
                console.log(`   🔌 سنسور: ${data.sensor_id}`);
                if (parseFloat(data.value) > 35) {
                    console.log('   ⚠️  هشدار: دمای بالا!');
                }
                break;
                
            case 'humidity':
                console.log(`   💧 رطوبت: ${data.value}%`);
                console.log(`   🔌 سنسور: ${data.sensor_id}`);
                if (parseFloat(data.value) > 80) {
                    console.log('   ⚠️  هشدار: رطوبت بالا!');
                }
                break;
                
            case 'alert':
                const alertEmoji = data.level === 'NORMAL' ? '✅' : '🚨';
                console.log(`   ${alertEmoji} سطح هشدار: ${data.level}`);
                console.log(`   📝 توضیحات: ${data.description}`);
                console.log(`   🖥️  سیستم: ${data.system_id}`);
                break;
                
            case 'analytics':
                console.log(`   👥 کاربران آنلاین: ${data.users_online}`);
                console.log(`   💻 استفاده CPU: ${data.cpu_usage}%`);
                console.log(`   🧠 استفاده Memory: ${data.memory_usage}%`);
                break;
                
            default:
                console.log(`   📄 محتوا: ${message.toString()}`);
        }
        
        console.log(`   📊 ارسال شده در: ${data.timestamp}`);
        console.log('   ' + '─'.repeat(50));
        
        // نمایش آمار هر 5 پیام
        if (messageCount % 5 === 0) {
            console.log('\n📈 آمار دریافت پیام‌ها:');
            Object.entries(receivedMessages).forEach(([topic, count]) => {
                console.log(`   ${topic}: ${count} پیام`);
            });
            console.log(`   🔢 مجموع: ${messageCount} پیام\n`);
        }
        
    } catch (error) {
        console.error('❌ خطا در parse کردن پیام:', error);
        console.log(`📄 محتوای خام: ${message.toString()}`);
        console.log('─'.repeat(50));
    }
});

// Subscribe به تغییرات connection
client.on('subscribe', (topic, granted) => {
    console.log(`🎯 Subscribe تایید شد برای topic: ${topic}`);
});

client.on('unsubscribe', (topic) => {
    console.log(`🚫 Unsubscribe شد از topic: ${topic}`);
});

// مدیریت خروج برنامه
process.on('SIGINT', () => {
    console.log('\n⏹️  دریافت سیگنال توقف...');
    console.log('\n📊 آمار نهایی:');
    Object.entries(receivedMessages).forEach(([topic, count]) => {
        console.log(`   ${topic}: ${count} پیام`);
    });
    console.log(`   🔢 مجموع: ${messageCount} پیام دریافت شد`);
    
    // Unsubscribe از همه topic ها
    topics.forEach(topic => {
        client.unsubscribe(topic);
    });
    
    client.end();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  دریافت سیگنال پایان...');
    client.end();
    process.exit(0);
});

console.log('🚀 MQTT Subscriber آماده است...');
console.log('📡 در حال اتصال به EMQX broker...');
