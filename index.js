cat > index.js << 'EOF'
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const config = require('./config');

// Créer dossiers
if (!fs.existsSync('./database')) fs.mkdirSync('./database');
if (!fs.existsSync('./auth_info')) fs.mkdirSync('./auth_info');
if (!fs.existsSync(config.dbPath)) fs.writeFileSync(config.dbPath, JSON.stringify({ startTime: Date.now() }));

async function startBot() {
    console.log(`\n🔥 ${config.botName} v${config.version}`);
    console.log(`👑 Owner: ${config.ownerNumber}\n`);
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' }),
        browser: ['KILLER God', 'Chrome', '2026']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { qr, connection } = update;
        if (qr) {
            console.log('\n📱 SCANNE CE QR CODE AVEC WHATSAPP :\n');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('✅ BOT CONNECTÉ AVEC SUCCÈS !');
        }
        if (connection === 'close') {
            setTimeout(startBot, 5000);
        }
    });
    
    // Vérifier si owner
    const isOwner = (user) => {
        return user.replace(/[^0-9]/g, '') === config.ownerNumber;
    };
    
    // Gestion des messages
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const sender = msg.key.remoteJid;
        const user = sender.endsWith('@g.us') ? msg.key.participant : sender;
        
        let text = '';
        if (msg.message.conversation) text = msg.message.conversation;
        else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
        else return;
        
        const prefix = config.prefix.find(p => text.startsWith(p));
        if (!prefix) return;
        
        const cmd = text.slice(prefix.length).split(' ')[0].toLowerCase();
        const args = text.slice(prefix.length + cmd.length).trim();
        
        console.log(`📩 Commande: ${cmd} | User: ${user.split('@')[0]}`);
        
        // Commandes de base
        if (cmd === 'ping') {
            await sock.sendMessage(sender, { text: '🏓 Pong!' });
        }
        else if (cmd === 'owner') {
            await sock.sendMessage(sender, { text: `👑 wa.me/${config.ownerNumber}` });
        }
        else if (cmd === 'alive') {
            await sock.sendMessage(sender, { text: `🤖 ${config.botName} v${config.version} en ligne ✅` });
        }
        else if (cmd === 'stats') {
            await sock.sendMessage(sender, { text: `📊 Bot actif depuis le démarrage` });
        }
        else if (cmd === 'public' && isOwner(user)) {
            global.mode = 'public';
            await sock.sendMessage(sender, { text: '🌍 Mode public activé' });
        }
        else if (cmd === 'self' && isOwner(user)) {
            global.mode = 'self';
            await sock.sendMessage(sender, { text: '🔒 Mode self activé' });
        }
    });
}

startBot();
EOF
