const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());

assert.equal(scripts.length, 1, 'Expected one inline application script.');
for (const [index, source] of scripts.entries()) {
  new vm.Script(source, { filename: 'index.html:inline-script-' + (index + 1) });
}

const required = [
  ['safe duplicate review', /Flag possible duplicates for human review/],
  ['no automatic duplicate deletion wording', /do not delete rows automatically/i],
  ['Freelancer Desk', /id="easyFlowFreelancerDesk"/],
  ['business income and expense tracker', /id="efdAddMoney"/],
  ['business net balance summary', /id="efdNetTotal"/],
  ['transactions included in local backup', /const keys=\['tasks','clients','products','orders','transactions'\]/],
  ['older desk backup compatibility', /data\.transactions!==undefined/],
  ['device-local storage notice', /device copy remains available/i],
  ['backup restore control', /id="efdRestoreFile"/],
  ['formula-injection guard', /function spreadsheetSafeValue/],
  ['combined CSV export', /EasyFlow_All_Cleaned_Data\.csv/],
  ['authenticated API header', /Authorization:'Bearer '\+efToken/],
  ['registration endpoint', /\/api\/auth\/register/],
  ['checkout endpoint', /\/api\/billing\/checkout/],
  ['PayMongo checkout URL compatibility', /r\.checkoutUrl\s*\|\|\s*r\.url/],
  ['account workspace sync', /\/api\/workspace/],
  ['device-to-account sync controls', /id="efdCloudSave"/],
];
for (const [name, pattern] of required) {
  assert.match(html, pattern, 'Missing required feature: ' + name);
}
assert.doesNotMatch(html, /rows\s*=\s*rows\.filter\([^;]*(?:duplicate|Duplicate)/,
  'Duplicate processing must not automatically remove records.');


assert.match(html, /const csv='\\ufeff'/, 'CSV export must include a real UTF-8 BOM escape.');
assert.ok(html.includes(String.raw`join('\r\n')`), 'CSV export must use CRLF line endings.');
console.log('EasyFlow frontend checks passed.');
