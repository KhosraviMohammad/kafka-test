import mqtt from 'mqtt';

function createMQTTClient(clientId, registrationHandler, serverNotificationHandler) {
//   const SERVER_URI = 'mqtt://185.231.182.175:11883';
  const SERVER_URI = 'mqtt://127.0.0.1:11883';
  const REGISTRY_TOPIC = `registry/client/${clientId}`;
  const NOTIFICATION_TOPIC = `message/client/${clientId}`;
  const SERVER_NOTIFICATION_TOPIC = `message/server/${clientId}`;
  const LOG_TOPIC = `logs/client/${clientId}`;

  // Connect to MQTT broker
  const client = mqtt.connect(SERVER_URI, {
    protocolVersion: 5,
    clientId: clientId,
    clean: true,
    keepalive: 20,
    properties: {
      userProperties: {
        data: JSON.stringify({
          username: "fari",
          roles: ["admin", "editor"],
          location: {
            Germany: 222,
            s: "ssss",
            n: [213123, "ewqdw"]
          }
        }),
      }
    }
  });
  // Connection event
  client.on('connect', () => {
    // Subscribe to registry topic

    client.subscribe(REGISTRY_TOPIC, (err) => {
      if (err) {
        console.error('❌ Subscribe error:', err);
      }
    });

  });

  // Message event
  client.on('message', (topic, message) => {
    if (topic === REGISTRY_TOPIC) {
      try {
        const data = JSON.parse(message.toString());
        console.log('🔥 Message received:', topic, data);

        if (data.data.isRegistered) {
          client.subscribe(SERVER_NOTIFICATION_TOPIC);
          registrationHandler(data.data.isRegistered);
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    } else if (topic === SERVER_NOTIFICATION_TOPIC) {
      try {
        const data = JSON.parse(message.toString());
        if (serverNotificationHandler) {
          serverNotificationHandler(data);
        }
      } catch (error) {
        console.error('❌ Error parsing server notification:', error);
      }
    }
  });

  // Error event
  client.on('error', (error) => {
    // console.error('❌ MQTT error:', error);
  });

  // Return two functions
  return {
    // Function 1: Send notification
    sendNotification: (message) => {
      client.publish(NOTIFICATION_TOPIC, JSON.stringify(message));
    },

    // Function 2: Send log data
    sendLog: (logData) => {
      client.publish(LOG_TOPIC, JSON.stringify(logData));
    }
  };
}

export { createMQTTClient };
