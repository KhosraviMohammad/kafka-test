import { createMQTTClient } from './node-client.js';
import readline from 'readline';

// Global variable for registration status
let isRegistered = false;
let currentUserId = 1; // Default user ID

// Registration handler - called when server registers the client
const handleRegistration = (isAccepted) => {
    if (isAccepted === true) {
        isRegistered = isAccepted;
        console.log('✅ Client registered successfully', isRegistered);
        showMenu();
    }
};

// Server notification handler - logs when called
const handleServerNotification = (data) => {
    console.log('📨 Server notification received:', JSON.stringify(data));
};

// Create MQTT client
const client = createMQTTClient('simple_client_001', handleRegistration, handleServerNotification);

// Create readline interface for console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to show the menu
const showMenu = () => {
    console.log('\n📋 Notification Menu:');
    console.log('1. Send NOTIFICATION_REQUEST');
    console.log('2. Send NOTIFICATION_TIMEOUT');
    console.log('3. Set User ID (Current: ' + currentUserId + ')');
    console.log('4. Exit');
    console.log('----------------------------------------');
    
    rl.question('Please select an option (1-4): ', (choice) => {
        handleMenuChoice(choice.trim());
    });
};

// Function to handle menu choices
const handleMenuChoice = (choice) => {
    switch (choice) {
        case '1':
            rl.question('Enter notification code: ', (code) => {
                sendNotificationRequest(code);
            });
            break;
        case '2':
            rl.question('Enter timeout code: ', (code) => {
                sendNotificationTimeout(code);
            });
            break;
        case '3':
            rl.question('Enter new User ID: ', (userId) => {
                setUserId(userId);
            });
            break;
        case '4':
            console.log('👋 Goodbye!');
            rl.close();
            process.exit(0);
            break;
        default:
            console.log('❌ Invalid option. Please select 1, 2, 3, or 4.');
            showMenu();
            break;
    }
};

// Function to send NOTIFICATION_REQUEST
const sendNotificationRequest = (code) => {
    if (!isRegistered) {
        console.log('❌ Client not registered yet. Please wait for registration.');
        showMenu();
        return;
    }
    
    client.sendNotification({
        type: 'NOTIFICATION_REQUEST',
        data: {
            targetedUserSidX: currentUserId,
            isValidUntil: 30,
            notifId: code,
            code: code
        }
    });
    console.log('🔥 NOTIFICATION_REQUEST sent with code:', code);
    showMenu();
};

// Function to send NOTIFICATION_TIMEOUT
const sendNotificationTimeout = (code) => {
    if (!isRegistered) {
        console.log('❌ Client not registered yet. Please wait for registration.');
        showMenu();
        return;
    }
    
    client.sendNotification({
        type: 'NOTIFICATION_TIMEOUT',
        data: {
            targetedUserSidX: currentUserId,
            notifId: code,
            code: code
        }
    });
    console.log('🔥 NOTIFICATION_TIMEOUT sent with code:', code);
    showMenu();
};

// Function to set user ID
const setUserId = (userId) => {
    const newUserId = parseInt(userId);
    if (isNaN(newUserId) || newUserId <= 0) {
        console.log('❌ Invalid User ID. Please enter a positive number.');
        showMenu();
        return;
    }
    
    currentUserId = newUserId;
    console.log('✅ User ID updated to:', currentUserId);
    showMenu();
};

// Send log every 25 seconds (keeping the original log functionality)
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
console.log('📤 Waiting for registration to show notification menu...');
