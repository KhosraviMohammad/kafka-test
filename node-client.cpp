#include <iostream>
#include <string>
#include <functional>
#include <mosquitto.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class MQTTClient {
private:
    struct mosquitto* mosq;
    std::string clientId;
    std::string registryTopic;
    std::string notificationTopic;
    std::string serverNotificationTopic;
    std::string logTopic;
    std::function<void(bool)> registrationHandler;
    std::function<void(const json&)> serverNotificationHandler;
    bool connected;

public:
    MQTTClient(const std::string& id, std::function<void(bool)> regHandler, 
               std::function<void(const json&)> notifHandler) 
        : clientId(id), registrationHandler(regHandler), 
          serverNotificationHandler(notifHandler), connected(false) {
        
        registryTopic = "registry/client/" + clientId;
        notificationTopic = "notif/client/" + clientId;
        serverNotificationTopic = "notif/server/" + clientId;
        logTopic = "logs/client/" + clientId;
        
        mosquitto_lib_init();
        mosq = mosquitto_new(clientId.c_str(), true, this);
        
        if (mosq) {
            mosquitto_connect_callback_set(mosq, onConnect);
            mosquitto_message_callback_set(mosq, onMessage);
        }
    }
    
    ~MQTTClient() {
        if (mosq) {
            mosquitto_destroy(mosq);
        }
        mosquitto_lib_cleanup();
    }
    
    bool connect() {
        if (!mosq) return false;
        
        int rc = mosquitto_connect(mosq, "localhost", 11883, 60);
        if (rc != MOSQ_ERR_SUCCESS) {
            return false;
        }
        
        mosquitto_loop_start(mosq);
        return true;
    }
    
    void sendNotification(const json& message) {
        if (!connected || !mosq) return;
        
        std::string payload = message.dump();
        mosquitto_publish(mosq, nullptr, notificationTopic.c_str(), 
                         payload.length(), payload.c_str(), 0, false);
    }
    
    void sendLog(const json& logData) {
        if (!connected || !mosq) return;
        
        std::string payload = logData.dump();
        mosquitto_publish(mosq, nullptr, logTopic.c_str(), 
                         payload.length(), payload.c_str(), 0, false);
    }

private:
    static void onConnect(struct mosquitto* mosq, void* userdata, int result) {
        MQTTClient* client = static_cast<MQTTClient*>(userdata);
        
        if (result == 0) {
            client->connected = true;
            mosquitto_subscribe(mosq, nullptr, client->registryTopic.c_str(), 0);
        }
    }
    
    static void onMessage(struct mosquitto* mosq, void* userdata, 
                         const struct mosquitto_message* message) {
        MQTTClient* client = static_cast<MQTTClient*>(userdata);
        std::string topic = static_cast<const char*>(message->topic);
        std::string payload(static_cast<const char*>(message->payload), message->payloadlen);
        
        if (topic == client->registryTopic) {
            try {
                json data = json::parse(payload);
                if (data.contains("isRegistered") && data["isRegistered"] == true) {
                    if (client->registrationHandler) {
                        client->registrationHandler(true);
                    }
                    mosquitto_subscribe(mosq, nullptr, client->serverNotificationTopic.c_str(), 0);
                }
            } catch (const json::exception& e) {
                // Ignore parsing errors
            }
        } else if (topic == client->serverNotificationTopic) {
            try {
                json data = json::parse(payload);
                if (client->serverNotificationHandler) {
                    client->serverNotificationHandler(data);
                }
            } catch (const json::exception& e) {
                // Ignore parsing errors
            }
        }
    }
};

extern "C" {
    MQTTClient* createMQTTClient(const char* clientId, 
                                void (*registrationHandler)(bool),
                                void (*serverNotificationHandler)(const char*)) {
        
        auto regHandler = [registrationHandler](bool accepted) {
            if (registrationHandler) registrationHandler(accepted);
        };
        
        auto notifHandler = [serverNotificationHandler](const json& data) {
            if (serverNotificationHandler) {
                std::string payload = data.dump();
                serverNotificationHandler(payload.c_str());
            }
        };
        
        MQTTClient* client = new MQTTClient(clientId, regHandler, notifHandler);
        if (client->connect()) {
            return client;
        } else {
            delete client;
            return nullptr;
        }
    }
    
    void sendNotification(MQTTClient* client, const char* message) {
        if (client) {
            try {
                json data = json::parse(message);
                client->sendNotification(data);
            } catch (...) {
                // Ignore parsing errors
            }
        }
    }
    
    void sendLog(MQTTClient* client, const char* logData) {
        if (client) {
            try {
                json data = json::parse(logData);
                client->sendLog(data);
            } catch (...) {
                // Ignore parsing errors
            }
        }
    }
    
    void cleanupMQTTClient(MQTTClient* client) {
        if (client) {
            delete client;
        }
    }
}
