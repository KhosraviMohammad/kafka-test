const mqtt = require('mqtt');

// اتصال به EMQX broker
const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'nodejs_client_' + Math.random().toString(16).substring(2, 8),
  clean: true,
  connectTimeout: 4000,
  username: '', // در صورت نیاز
  password: '', // در صورت نیاز
  reconnectPeriod: 1000,
});

// Topics برای تست
const TOPIC_SUBSCRIBE = 'test/nodejs/+';
const TOPIC_PUBLISH = 'test/nodejs/publish';

// Event handlers
client.on('connect', () => {
  console.log('✅ اتصال به EMQX برقرار شد');
  console.log('Client ID:', client.options.clientId);
  
  // Subscribe به topic
  client.subscribe(TOPIC_SUBSCRIBE, (err) => {
    if (!err) {
      console.log(`📥 Subscribe شد به: ${TOPIC_SUBSCRIBE}`);
      
      // ارسال یک پیام تست
      sendTestMessage();
    } else {
      console.error('❌ خطا در subscribe:', err);
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`📨 پیام دریافت شد:`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Message: ${message.toString()}`);
  console.log(`   Time: ${new Date().toLocaleString('fa-IR')}`);
});

client.on('error', (error) => {
  console.error('❌ خطا در اتصال MQTT:', error);
});

client.on('offline', () => {
  console.log('📵 ارتباط قطع شد');
});

client.on('reconnect', () => {
  console.log('🔄 تلاش برای اتصال مجدد...');
});

// تابع برای ارسال پیام تست
function sendTestMessage() {
  const message = {
    text: 'سلام از Node.js!',
    timestamp: new Date().toISOString(),
    sender: 'nodejs-client'
  };
  
  client.publish(TOPIC_PUBLISH, JSON.stringify(message, null, 2), { qos: 1 }, (err) => {
    if (!err) {
      console.log(`📤 پیام ارسال شد به: ${TOPIC_PUBLISH}`);
    } else {
      console.error('❌ خطا در ارسال پیام:', err);
    }
  });
}

// ارسال پیام هر 10 ثانیه
setInterval(() => {
  if (client.connected) {
    sendTestMessage();
  }
}, 10000);

// مدیریت خروج از برنامه
process.on('SIGINT', () => {
  console.log('\n🛑 خروج از برنامه...');
  client.end(() => {
    console.log('✅ اتصال MQTT بسته شد');
    process.exit(0);
  });
});

console.log('🚀 شروع اتصال به EMQX...');
console.log('برای خروج Ctrl+C را فشار دهید');
