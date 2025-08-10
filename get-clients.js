const https = require('https');
const http = require('http');

// API کلیدها
const API_KEY = 'ee26b0dd4af7e749';
const SECRET_KEY = '66n36ZA1lKq2xYDYx7UK9Ai3lO9A9ASdo8nbTcPsk4iADG';

// ایجاد Basic Auth
function createBasicAuth(apiKey, secretKey) {
    const credentials = `${apiKey}:${secretKey}`;
    return Buffer.from(credentials).toString('base64');
}

// درخواست لیست کلاینت‌ها
function getOnlineClients() {
    console.log('🔍 دریافت لیست کلاینت‌های آنلاین از EMQX...');
    
    const basicAuth = createBasicAuth(API_KEY, SECRET_KEY);
    
    const options = {
        hostname: 'localhost',
        port: 19083,
        path: '/api/v5/clients',
        method: 'GET',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        console.log(`📡 Status Code: ${res.statusCode}`);
        console.log(`📋 Headers:`, res.headers);
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('\n✅ پاسخ دریافت شد:');
                
                if (response.data && Array.isArray(response.data)) {
                    displayClients(response.data);
                    displaySummary(response);
                } else {
                    console.log('📄 پاسخ کامل:', JSON.stringify(response, null, 2));
                }
                
            } catch (error) {
                console.error('❌ خطا در parse کردن JSON:', error);
                console.log('📄 پاسخ خام:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ خطا در درخواست:', error);
    });
    
    req.setTimeout(10000, () => {
        console.error('❌ Timeout در درخواست');
        req.abort();
    });
    
    req.end();
}

function displayClients(clients) {
    console.log(`\n👥 تعداد کلاینت‌های متصل: ${clients.length}`);
    
    if (clients.length === 0) {
        console.log('📭 هیچ کلاینتی متصل نیست');
        return;
    }
    
    console.log('\n┌─────────────────┬──────────────────┬─────────────────┬──────────────┐');
    console.log('│ Client ID       │ Username         │ IP Address      │ Connected At │');
    console.log('├─────────────────┼──────────────────┼─────────────────┼──────────────┤');
    
    clients.forEach(client => {
        const clientId = (client.clientid || 'N/A').substring(0, 15).padEnd(15);
        const username = (client.username || 'N/A').substring(0, 16).padEnd(16);
        const ipAddress = (client.ip_address || 'N/A').padEnd(15);
        const connectedAt = client.connected_at ? 
            new Date(client.connected_at).toLocaleTimeString('fa-IR') : 'N/A';
        
        console.log(`│ ${clientId} │ ${username} │ ${ipAddress} │ ${connectedAt.padEnd(12)} │`);
    });
    
    console.log('└─────────────────┴──────────────────┴─────────────────┴──────────────┘');
}

function displaySummary(response) {
    console.log('\n📊 خلاصه اطلاعات:');
    
    if (response.meta) {
        console.log(`   📄 صفحه: ${response.meta.page || 'N/A'}`);
        console.log(`   📦 حد صفحه: ${response.meta.limit || 'N/A'}`);
        console.log(`   🔢 تعداد کل: ${response.meta.count || 'N/A'}`);
    }
    
    // نمایش جزئیات کلاینت‌های خاص ما
    if (response.data) {
        const ourClients = response.data.filter(client => 
            client.clientid && (
                client.clientid.includes('server_main') ||
                client.clientid.includes('client_')
            )
        );
        
        if (ourClients.length > 0) {
            console.log('\n🎯 کلاینت‌های شبیه‌سازی ما:');
            ourClients.forEach(client => {
                console.log(`   • ${client.clientid}`);
                console.log(`     💻 IP: ${client.ip_address}`);
                console.log(`     ⏰ اتصال: ${new Date(client.connected_at).toLocaleString('fa-IR')}`);
                console.log(`     📊 پیام‌های ارسالی: ${client.send_cnt || 0}`);
                console.log(`     📨 پیام‌های دریافتی: ${client.recv_cnt || 0}`);
                console.log('');
            });
        }
    }
}

// تست با مثال curl
function showCurlExample() {
    const basicAuth = createBasicAuth(API_KEY, SECRET_KEY);
    
    console.log('\n💡 مثال curl معادل:');
    console.log(`curl -X GET "http://localhost:19083/api/v5/clients" \\`);
    console.log(`     -H "Authorization: Basic ${basicAuth}" \\`);
    console.log(`     -H "Content-Type: application/json"`);
    console.log('');
}

// اجرای درخواست
console.log('🚀 شروع درخواست API...');
console.log(`🔑 API Key: ${API_KEY}`);
console.log(`🔐 Secret Key: ${SECRET_KEY.substring(0, 10)}...`);

showCurlExample();
getOnlineClients();
