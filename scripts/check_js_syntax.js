const fs = require('fs');
const path = require('path');
function walk(dir){
  let r = [];
  if (!fs.existsSync(dir)) return r;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) r = r.concat(walk(p));
    else if (p.endsWith('.js')) r.push(p);
  });
  return r;
}

const roots = ['src/public', 'src/shared/views'];
let had = false;
roots.forEach(root => {
  const files = walk(root);
  files.forEach(f => {
    try {
      const code = fs.readFileSync(f, 'utf8');
      new Function(code);
    } catch (e) {
      console.error('SYNTAX ERROR in', f + ':', e.message);
      had = true;
    }
  });
});
if (!had) console.log('No syntax errors detected in scanned JS files');
