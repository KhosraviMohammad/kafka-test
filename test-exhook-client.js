const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const config = require('./config');

// آدرس سرور ExHook gRPC - قابل تغییر برای تست از IP های مختلف
const SERVER_ADDRESS = process.argv[2] || config.grpc.address;

const PROTO_PATH = path.join(__dirname, 'exhook.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const exhookProto = grpc.loadPackageDefinition(packageDefinition).emqx.exhook.v2;
const client = new exhookProto.HookProvider(SERVER_ADDRESS, grpc.credentials.createInsecure());

console.log(`🔌 اتصال به سرور ExHook gRPC: ${SERVER_ADDRESS}`);
console.log(`📡 تست اتصال از IP فعلی...\n`);

// تست متد OnProviderLoaded
const providerLoadedRequest = {
    broker: {
        version: "5.5.0",
        sysdescr: "EMQX",
        uptime: 1886232,
        datetime: new Date().toISOString()
    },
    meta: {
        node: "emqx@172.18.0.2",
        version: "5.5.0",
        cluster_name: "emqxcl"
    }
};

console.log('🧪 تست متد OnProviderLoaded...');
client.OnProviderLoaded(providerLoadedRequest, (err, response) => {
    if (err) {
        console.error('❌ خطا در OnProviderLoaded:', err.message);
    } else {
        console.log('✅ OnProviderLoaded موفق!');
        console.log('   📋 Hooks:', response.hooks);
        console.log('   🔧 Hook Filter:', response.hook_filter);
    }
    
            // تست متد OnClientConnect
        testClientConnect();
    });
    
    function testClientConnect() {
        const clientConnectRequest = {
            conninfo: {
                node: "emqx@172.18.0.2",
                clientid: "test_client_123",
                username: "testuser",
                peerhost: "192.168.1.100",
                sockport: 12345,
                proto_name: "MQTT",
                proto_ver: "4",
                keepalive: 60,
                peerport: 12345
            },
            props: [],
            meta: {
                node: "emqx@172.18.0.2",
                version: "5.5.0",
                sysdescr: "EMQX",
                cluster_name: "emqxcl"
            },
            user_props: []
        };
        
        console.log('\n🧪 تست متد OnClientConnect...');
        client.OnClientConnect(clientConnectRequest, (err, response) => {
            if (err) {
                console.error('❌ خطا در OnClientConnect:', err.message);
            } else {
                console.log('✅ OnClientConnect موفق!');
            }
            
            // تست متد OnClientAuthenticate
            testClientAuthenticate();
        });
    }

    function testClientAuthenticate() {
        const clientAuthenticateRequest = {
            clientinfo: {
                node: "emqx@172.18.0.2",
                clientid: "test_client_123",
                username: "admin",
                password: "admin123",
                peerhost: "192.168.1.100",
                sockport: 12345,
                protocol: "MQTT",
                mountpoint: "",
                is_superuser: false,
                anonymous: false,
                cn: "",
                dn: "",
                peerport: 12345
            },
            result: true,
            meta: {
                node: "emqx@172.18.0.2",
                version: "5.5.0",
                sysdescr: "EMQX",
                cluster_name: "emqxcl"
            }
        };
        
        console.log('\n🧪 تست متد OnClientAuthenticate...');
        client.OnClientAuthenticate(clientAuthenticateRequest, (err, response) => {
            if (err) {
                console.error('❌ خطا در OnClientAuthenticate:', err.message);
            } else {
                console.log('✅ OnClientAuthenticate موفق!');
                console.log('   📝 Result:', response);
            }
            
            console.log('\n🎉 تمام تست‌ها تکمیل شد!');
            console.log('💡 سرور ExHook gRPC شما آماده استفاده با EMQX است');
            
            // بستن اتصال
            client.close();
        });
    }
