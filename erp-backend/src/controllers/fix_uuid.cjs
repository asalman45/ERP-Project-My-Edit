const fs = require('fs');
const path = require('path');
const targetPath = path.join(__dirname, 'dispatch.controller.js');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace all $X::uuid
content = content.replace(/\$1::uuid/g, '$1');
content = content.replace(/\$2::uuid/g, '$2');
content = content.replace(/\$3::uuid/g, '$3');

// Replace CAST($X AS uuid)
content = content.replace(/CAST\(\$1 AS uuid\)/g, '$1');
content = content.replace(/CAST\(\$2 AS uuid\)/g, '$2');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Replaced all UUID casts in dispatch.controller.js');
