const { spawn } = require('child_process');

// متغیرهای سراسری
let processes = [];
let clientCount = 5;

function getClientCount() {
    const arg = process.argv.find(arg => arg.startsWith('--clients='));
    return arg ? parseInt(arg.split('=')[1]) : 5;
}

async function start() {
    clientCount = getClientCount();
    
    console.log('🎮 راه‌اندازی شبیه‌سازی ساده سرور-کلاینت');
    console.log(`📊 تعداد کلاینت‌ها: ${clientCount}`);
    console.log('─'.repeat(50));
    
    setupSignalHandlers();
    
    // راه‌اندازی سرور
    await startServer();
    await sleep(3000);
    
    // راه‌اندازی کلاینت‌ها
    await startClients();
    
    console.log('\n✅ همه فرآیندها آماده شدند');
    console.log('💡 برای توقف Ctrl+C بزنید\n');
    
    monitor();
}

async function startServer() {
    console.log('🏗️  راه‌اندازی سرور...');
    
    const serverProcess = spawn('node', ['server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    processes.push({
        process: serverProcess,
        type: 'server',
        name: 'Server'
    });
    
    serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            console.log(`🖥️  [SERVER] ${output}`);
        }
    });
    
    serverProcess.stderr.on('data', (data) => {
        console.error(`🖥️  [SERVER ERROR] ${data.toString().trim()}`);
    });
    
    serverProcess.on('close', (code) => {
        console.log(`🖥️  سرور بسته شد (کد: ${code})`);
        if (code !== 0) {
            stopAll();
        }
    });
}

async function startClients() {
    console.log(`🤖 راه‌اندازی ${clientCount} کلاینت...\n`);
    
    for (let i = 1; i <= clientCount; i++) {
        const clientId = `client_${i.toString().padStart(2, '0')}`;
        const clientName = `کلاینت-${i}`;
        
        await startClient(clientId, clientName, i);
        await sleep(1500);
    }
}

async function startClient(clientId, clientName, number) {
    console.log(`🚀 راه‌اندازی ${clientName}...`);
    
    const clientProcess = spawn('node', ['client.js', clientId, clientName], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    processes.push({
        process: clientProcess,
        type: 'client',
        name: clientName,
        id: clientId
    });
    
    clientProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            console.log(`🤖 [${clientName}] ${output}`);
        }
    });
    
    clientProcess.stderr.on('data', (data) => {
        console.error(`🤖 [${clientName} ERROR] ${data.toString().trim()}`);
    });
    
    clientProcess.on('close', (code) => {
        console.log(`🤖 ${clientName} بسته شد (کد: ${code})`);
        
        // حذف از لیست
        processes = processes.filter(p => p.process !== clientProcess);
    });
}

function monitor() {
    // نمایش وضعیت هر 60 ثانیه
    setInterval(() => {
        showStatus();
    }, 60000);
    
    // نمایش اولیه بعد از 15 ثانیه
    setTimeout(() => {
        showStatus();
    }, 15000);
}

function showStatus() {
    const serverCount = processes.filter(p => p.type === 'server').length;
    const currentClientCount = processes.filter(p => p.type === 'client').length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 وضعیت شبیه‌سازی');
    console.log('='.repeat(50));
    console.log(`🖥️  سرور: ${serverCount > 0 ? '🟢 فعال' : '🔴 غیرفعال'}`);
    console.log(`🤖 کلاینت‌ها: ${currentClientCount}/${clientCount} فعال`);
    console.log(`⏱️  زمان اجرا: ${Math.floor(process.uptime())} ثانیه`);
    console.log(`💾 مصرف حافظه: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
    
    if (currentClientCount > 0) {
        console.log('\n📋 کلاینت‌های فعال:');
        processes
            .filter(p => p.type === 'client')
            .forEach(client => {
                console.log(`   • ${client.name} (${client.id})`);
            });
    }
    
    console.log('='.repeat(50) + '\n');
}

function setupSignalHandlers() {
    process.on('SIGINT', () => {
        console.log('\n⏹️  دریافت سیگنال توقف...');
        stopAll();
    });
    
    process.on('SIGTERM', () => {
        console.log('\n⏹️  دریافت سیگنال پایان...');
        stopAll();
    });
}

function stopAll() {
    console.log('\n🛑 توقف همه فرآیندها...');
    
    processes.forEach(({ process, name, type }) => {
        console.log(`⏹️  توقف ${type}: ${name}`);
        try {
            process.kill('SIGTERM');
            
            // Force kill بعد از 5 ثانیه
            setTimeout(() => {
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
            }, 5000);
            
        } catch (error) {
            console.log(`⚠️  خطا در توقف ${name}: ${error.message}`);
        }
    });
    
    setTimeout(() => {
        console.log('✅ شبیه‌سازی متوقف شد');
        process.exit(0);
    }, 6000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showHelp() {
    console.log('🎮 راهنمای شبیه‌سازی ساده');
    console.log('');
    console.log('استفاده:');
    console.log('  node start.js [--clients=تعداد]');
    console.log('');
    console.log('مثال‌ها:');
    console.log('  node start.js                 # 5 کلاینت (پیش‌فرض)');
    console.log('  node start.js --clients=3     # 3 کلاینت');
    console.log('  node start.js --clients=10    # 10 کلاینت');
    console.log('');
    console.log('💡 نکته: قبل از اجرا EMQX را راه‌اندازی کنید:');
    console.log('   docker-compose -f docker-compose-emqx.yml up -d');
    process.exit(0);
}

// نمایش راهنما
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
}

// شروع شبیه‌سازی
start();