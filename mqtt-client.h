#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#ifdef __cplusplus
extern "C" {
#endif

// Create MQTT client
void* createMQTTClient(const char* clientId, 
                      void (*registrationHandler)(bool),
                      void (*serverNotificationHandler)(const char*));

// Send notification
void sendNotification(void* client, const char* message);

// Send log data
void sendLog(void* client, const char* logData);

// Cleanup MQTT client
void cleanupMQTTClient(void* client);

#ifdef __cplusplus
}
#endif

#endif // MQTT_CLIENT_H
