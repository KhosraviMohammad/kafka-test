// تنظیمات سرور
module.exports = {
    // تنظیمات سرور gRPC
    grpc: {
        port: 50052,
        host: '0.0.0.0', // 0.0.0.0 برای دسترسی از هر IP
        address: '0.0.0.0:50052'
    },
    
    // تنظیمات MQTT
    mqtt: {
        host: 'localhost',
        port: 11883,
        username: '',
        password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1IjoxLCJleHAiOjE3NTQ5MDMxODYsImlhdCI6MTc1NDg5OTU4Nn0.tzcCLQMpe3cdhWZtzaxR41gcL4nr8zk-GR425xuhyrc'
    },
    
    // تنظیمات کاربران
    users: {
        'admin': { password: 'admin123', isSuperuser: true },
        'user1': { password: 'password123', isSuperuser: false },
        'test': { password: 'test123', isSuperuser: false }
    }
};
