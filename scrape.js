const fs = require('fs');

const html = fs.readFileSync('C:/Users/HP/.gemini/antigravity/brain/d20fd14d-5ca2-49be-ab89-40a4e72ecd5e/.system_generated/steps/716/content.md', 'utf8');
const regex = /<a[^>]*>(.*?)<\/a>/gi;
const schools = new Set();
let m;

while ((m = regex.exec(html)) !== null) {
    let text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text.toLowerCase().includes("cycle d'ingénieur") || text.match(/^(ENSA|FST|ENSAM|EMI|INPT|EHTP|ENSIAS|INSEA|AIAC|ESI|EAMAC|ENIM|ENSEM|ESITH|IGA|EMINES|INAU|IAV|ENAM|ENA)/i)) {
        if (text.length > 3) schools.add(text);
    }
}

console.log(Array.from(schools).join('\n'));
