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

const worker = fs.readFileSync('worker.js', 'utf8');
const workerForSyntax = worker.replace(/^export\\s+default\\s+/m, 'const easyFlowWorker = ');
new vm.Script(workerForSyntax, { filename: 'worker.js' });
const workerRequired = [
  ['workspace CORS PUT support', /Access-Control-Allow-Methods":"GET, POST, PUT, OPTIONS/],
  ['authenticated workspace GET route', /url\.pathname==="\\/api\\/workspace"&&request\.method==="GET"/],
  ['authenticated workspace PUT route', /url\.pathname==="\\/api\\/workspace"&&request\.method==="PUT"/],
  ['session-derived account identity', /WHERE user_id=\?"\)\.bind\(u\.id\)/],
  ['optimistic workspace version check', /expected!==actual/],
  ['workspace payload size limit', /WORKSPACE_MAX_BYTES=256\*1024/],
  ['workspace record limit', /WORKSPACE_MAX_RECORDS=2000/],
  ['plan-independent workspace access', /async function getWorkspace\(req,env,origin\)\{const u=await userFor/],
];
for (const [name, pattern] of workerRequired) {
  assert.match(worker, pattern, 'Missing Worker requirement: ' + name);
}
const migration = fs.readFileSync('migrations/0001_ef_user_workspace_v1.sql', 'utf8');
assert.match(migration, /CREATE TABLE IF NOT EXISTS ef_user_workspace_v1/);
assert.match(migration, /user_id TEXT PRIMARY KEY NOT NULL/);

console.log('EasyFlow frontend and Worker checks passed.');
