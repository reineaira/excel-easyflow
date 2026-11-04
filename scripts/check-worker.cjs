const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const worker = fs.readFileSync('worker.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const executable = worker.replace('export default {', 'const worker = {') + '\nthis.__testValidWorkspace = validWorkspace;\nthis.__testFallbackPlan = fallbackPlan;';
new vm.Script(executable, { filename: 'worker.js' });
const context = { TextEncoder, JSON };
vm.runInNewContext(executable, context, { timeout: 1000 });
const validWorkspace = context.__testValidWorkspace;
const fallbackPlan = context.__testFallbackPlan('Please find duplicate customer rows.');
assert.match(fallbackPlan.operations[0].label, /flag possible duplicates for human review/i);
assert.match(fallbackPlan.operations[0].reason, /never delete records automatically/i);
assert.match(worker, /never suggest automatically deleting or merging rows/i);
const blank = validWorkspace({});
assert.equal(JSON.stringify(Object.keys(blank)), JSON.stringify(['tasks','clients','products','orders','transactions']));
assert.equal(blank.tasks.length, 0);
assert.throws(() => validWorkspace({ tasks: {} }), /Invalid workspace section/);
assert.throws(() => validWorkspace({ tasks: Array(2001).fill({}) }), /Too many records/);
assert.throws(() => validWorkspace({ tasks: [null] }), /records must be objects/);
const workerChecks = [
  'async function getWorkspace(req,env,origin){const u=await userFor(req,env)',
  'async function putWorkspace(req,env,origin){const u=await userFor(req,env)',
  'WORKSPACE_MAX_BYTES=256*1024',
  'WORKSPACE_KEYS=["tasks","clients","products","orders","transactions"]',
  'expected!==actual',
  'readBody(request,1048576)',
  '"Access-Control-Allow-Methods":"GET, POST, PUT, OPTIONS"',
  '"Access-Control-Allow-Headers":"Content-Type, Authorization"',
  'Number(x.net_amount??x.amount)===Number(order?.amount)',
  'Number(write?.meta?.changes)!==1'
];
for (const item of workerChecks) assert.ok(worker.includes(item), 'Missing Worker invariant: ' + item);
for (const item of ['/api/workspace','efdCloudSave','efdCloudMerge','efdCloudLoad']) assert.ok(html.includes(item), 'Missing frontend sync feature: ' + item);
console.log('EasyFlow Worker and workspace checks passed.');
