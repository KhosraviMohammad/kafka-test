import { createMQTTClient } from './node-client.js';

// Global variable for registration status
let isRegistered = false;

// Registration handler - called when server registers the client
const handleRegistration = (isAccepted) => {
    if (isAccepted === true) {
        isRegistered = isAccepted;
        console.log('✅ Client registered successfully', isRegistered);
    }
};

// Server notification handler - logs when called
const handleServerNotification = (data) => {
    console.log('📨 Server notification received:', JSON.stringify(data));
};

// Create MQTT client
const client = createMQTTClient('simple_client_003', handleRegistration, handleServerNotification);

// Send notification every 10 seconds
setInterval(() => {
    if (isRegistered) {
        client.sendNotification({
            "data": {
              "AuthenticationModule": "kerberos",
              "DestinationDeviceAddress": "172.16.100.20",
              "DestinationDeviceName": "SR2019",
              "DomainControllerAddress": "172.16.100.10",
              "DomainControllerName": "DC-2",
              "EncryptionType": "0x12 (AES-256-CTS-HMAC-SHA1-96)",
              "NotifiedAgentName": "dc-2.fuck.local",
              "NotifiedAgentType": "active directory,radius",
              "RequestedService": "TERMSRV",
              "SourceDeviceAddress": "172.16.100.1",
              "SourceDeviceName": "MDFEETR",
              "domain": "fuck",
              "notifId": Math.floor(10000 + Math.random() * 90000).toString(),
              "targetedUser": "s",
              "targetedUserSid": "S-1-5-21-141073069-1336069126-459662567-501",
              "targetedUserSidX": 4,
              "timestamp": "2025-10-01T18:05:25+03:30",
              "LogonLevel": "Interactive"
            },
            "type": "NOTIFICATION_REQUEST"
          });
        console.log('🔥 Notification sent');
    }
}, 250000);

// Send notification every 10 seconds
// setInterval(() => {
//     if (isRegistered) {
//         client.sendNotification({
//             "data": {
//               "AuthenticationModule": "kerberos",
//               "DestinationDeviceAddress": "172.16.100.20",
//               "DestinationDeviceName": "DC-2$",
//               "DomainControllerAddress": "172.16.100.10",
//               "DomainControllerName": "DC-2",
//               "EncryptionType": "0x12 (AES-256-CTS-HMAC-SHA1-96)",
//               "NotifiedAgentName": "dc-2.fuck.local",
//               "NotifiedAgentType": "active directory,radius",
//               "RequestedService": "TERMSRV",
//               "SourceDeviceAddress": "172.16.100.1",
//               "SourceDeviceName": "MDFEETR1",
//               "domain": "fuck",
//               "status": "allowed",
//               "notifId": Math.floor(10000 + Math.random() * 90000).toString(),
//               "targetedUser": "s1",
//               "targetedUserSid": "S-1-5-21-141073069-1336069126-459662567-501",
//               "targetedUserSidX": 4,
//               "timestamp": "2025-10-01T18:05:25+03:30",
//               "LogonLevel": "Interactive"
//             },
//             "type": "NOTIFICATION_POLICY"
//           });
//         console.log('🔥 Notification Policy sent');
//     }
// }, 5000);


// // Send log every 10 seconds
// setInterval(() => {
//     if (isRegistered) {
//         client.sendLog({
//             level: 'info',
//             message: 'Periodic log message',
//             test: 1
//         });
//         console.log('🔥 Log sent');
//     }
// }, 25000);

console.log('🚀 Simple MQTT client started');
console.log('📤 Will send notifications and logs every 10 seconds after registration');
