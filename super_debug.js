const fs = require('fs');
const code = fs.readFileSync('.next/server/app/api/scrape/route.js', 'utf8');
const regex = /super/g;
let match;
let out = '';
while ((match = regex.exec(code)) !== null) {
    out += 'Match at ' + match.index + '\n';
    out += 'Context: ' + code.substring(match.index - 100, match.index + 300) + '\n\n';
}
fs.writeFileSync('super_debug.txt', out);
