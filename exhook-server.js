const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const config = require('./config');

const PORT = config.grpc.port;
const HOST = config.grpc.host;
const PROTO_PATH = path.join(__dirname, 'exhook.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const exhookProto = grpc.loadPackageDefinition(packageDefinition).emqx.exhook.v2;

// Hook Provider Service Implementation
const hookProviderService = {
    // Called when the provider is loaded
    OnProviderLoaded: (call, callback) => {
        console.log('🚀 Provider loaded:', call.request.broker);
        console.log('📊 Meta:', call.request.meta);
        const hooks = [
            {
                "name": "client.connect",
                "topics": []
            },
            {
                "name": "client.authenticate",
                "topics": []
            },
            {
                "name": "client.authorize",
                "topics": [] // # means all topics
            }
        ]
        // Return which hooks we want to handle
        return callback(null, {
            hooks
        });
    },

    // Called when the provider is unloaded
    OnProviderUnloaded: (call, callback) => {
        console.log('⏹️  Provider unloaded:', call.request.meta);
        callback(null, {});
    },

    // Called when a client connects
    OnClientConnect: (call, callback) => {
        const { conninfo } = call.request;
        console.log(`🟢 Client connecting: ${conninfo.clientid}`);
        console.log(`   👤 Username: ${conninfo.username || 'anonymous'}`);
        console.log(`   🌐 IP: ${conninfo.peerhost}:${conninfo.sockport}`);

        // اجازه اتصال
        callback(null, {});
    },

    // Called when a client authenticates
    OnClientAuthenticate: (call, callback) => {
        const { clientinfo } = call.request;
        callback(null, {
            type: 'CONTINUE',
            bool_result: true
          });
        // احراز هویت ساده
        // if (clientinfo.username === 'admin' && clientinfo.password === 'admin123') {
        //     console.log(`✅ احراز هویت موفق: ${clientinfo.clientid}`);
        //     callback(null, {
        //         type: 0, // CONTINUE
        //         bool_result: true
        //     });
        // } else {
        //     console.log(`❌ احراز هویت ناموفق: ${clientinfo.clientid}`);
        //     callback(null, {
        //         type: 0, // CONTINUE
        //         bool_result: false
        //     });
        // }
    },

    // Called when a client tries to publish or subscribe
    OnClientAuthorize: (call, callback) => {
        const { clientinfo, topic, type } = call.request;
        callback(null, {
            type: 'CONTINUE',
            bool_result: true
        });
    },

};

// Create gRPC server
const server = new grpc.Server();
server.addService(exhookProto.HookProvider.service, hookProviderService);

// Start server
server.bindAsync(
    `${HOST}:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('❌ خطا:', err);
            return;
        }

        console.log(`🚀 سرور ExHook gRPC راه‌اندازی شد روی پورت ${PORT}`);
        console.log(`🌐 سرور قابل دسترسی از هر IP: ${HOST}:${PORT}`);
        console.log(`📡 برای اتصال از IP های مختلف، از آدرس سرور فعلی استفاده کنید`);
        console.log(`🔧 این سرور تمام متدهای مورد نیاز EMQX ExHook v2 را پیاده‌سازی می‌کند`);

        server.start();
    }
);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  سرور در حال خاموش شدن...');
    server.tryShutdown(() => {
        console.log('✅ سرور با موفقیت خاموش شد');
        process.exit(0);
    });
});
