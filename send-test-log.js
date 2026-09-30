import mqtt from 'mqtt';

const SERVER_URI = process.env.MQTT_URI || 'mqtt://127.0.0.1:11883';
const clientId = process.env.CLIENT_ID || 'test_agent_001';
const LOG_TOPIC = `logs/client/${clientId}`;

console.log(`Connecting to ${SERVER_URI} as ${clientId}...`);
const client = mqtt.connect(SERVER_URI, {
  protocolVersion: 5,
  clientId: clientId,
  clean: true
});

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  const sampleTexts = [
    {
      type: 'authfw-dll',
      text: 'User authentication requested for user: admin from IP 192.168.1.100'
    },
    {
      type: 'windows-logon',
      text: 'Interactive logon session established for domain CONTOSO'
    },
    {
      type: 'radius-auth',
      text: 'RADIUS Access-Request received and validated'
    },
    {
      type: 'authfw-dll',
      text: 'MFA prompt issued and approved'
    }
  ];

  sampleTexts.forEach((item, index) => {
    setTimeout(() => {
      const date = new Date().toISOString();
      const logItem = {
        type: item.type,
        payload: `${date}-${clientId}: ${item.text}`
      };

      client.publish(LOG_TOPIC, JSON.stringify(logItem), { qos: 2 }, (err) => {
        if (err) {
          console.error(`❌ Failed to send log:`, err);
        } else {
          console.log(`🔥 Sent test log:`, JSON.stringify(logItem));
        }

        if (index === sampleTexts.length - 1) {
          setTimeout(() => {
            console.log('🏁 All test logs sent successfully.');
            client.end();
            process.exit(0);
          }, 1000);
        }
      });
    }, index * 800);
  });
});

client.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err);
});
