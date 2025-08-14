#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <cstring>

// Global variable for registration status
bool isRegistered = false;

// Registration handler - called when server registers the client
void handleRegistration(bool isAccepted) {
    if (isAccepted) {
        isRegistered = isAccepted;
        std::cout << "✅ Client registered successfully: " << isRegistered << std::endl;
    }
}

// Server notification handler - logs when called
void handleServerNotification(const char* data) {
    std::cout << "📨 Server notification received: " << data << std::endl;
}

// Function to send periodic notifications
void sendPeriodicNotifications(void* clientPtr) {
    while (true) {
        if (isRegistered) {
            std::string message = R"({
                "type": "heartbeat",
                "message": "Hello from simple client",
                "timestamp": ")"
                + std::to_string(std::time(nullptr)) + "\"}";
            
            sendNotification(clientPtr, message.c_str());
        }
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }
}

// Function to send periodic logs
void sendPeriodicLogs(void* clientPtr) {
    while (true) {
        if (isRegistered) {
            std::string logData = R"({
                "level": "info",
                "message": "Periodic log message",
                "timestamp": ")"
                + std::to_string(std::time(nullptr)) + "\"}";
            
            sendLog(clientPtr, logData.c_str());
        }
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }
}

int main() {
    std::cout << "🚀 Simple MQTT client started" << std::endl;
    std::cout << "📤 Will send notifications and logs every 5 seconds after registration" << std::endl;
    
    // Create MQTT client
    void* client = createMQTTClient("simple_client_001", handleRegistration, handleServerNotification);
    
    if (!client) {
        std::cerr << "❌ Failed to create MQTT client" << std::endl;
        return 1;
    }
    
    // Start periodic sending in background threads
    std::thread notificationThread(sendPeriodicNotifications, client);
    std::thread logThread(sendPeriodicLogs, client);
    
    // Keep main thread alive
    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    
    // Cleanup (this won't be reached in this simple example)
    cleanupMQTTClient(client);
    return 0;
}
