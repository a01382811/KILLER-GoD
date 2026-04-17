cat > config.js << 'EOF'
require('dotenv').config();

module.exports = {
    ownerName: "DEV KILLER",
    ownerNumber: process.env.OWNER_NUMBER || "22784566540",
    botName: "KILLER God",
    version: "2026-GOD",
    prefix: ['.', '!', '#'],
    dbPath: './database/db.json'
};
EOF
