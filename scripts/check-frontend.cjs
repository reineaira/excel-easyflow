const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).filter(source => source.trim());
assert.equal(scripts.length, 1, 'Expected one inline application script.');
for (const [index, source] of scripts.entries()) {
  new vm.Script(source, { filename: 'index.html:inline-script-' + (index + 1) });
}

const required = [
  ['duplicate review label', /Possible duplicate — human review required/],
  ['duplicate result count', /Possible duplicates found/],
  ['duplicate review wording', /flag possible duplicates for human review/i],
  ['Freelancer Desk', /id="easyFlowFreelancerDesk"/],
  ['income and expense tracker', /id="efdAddMoney"/],
  ['net balance summary', /id="efdNetTotal"/],
  ['local backup collections', /const keys=\['tasks','clients','products','orders','transactions'\]/],
  ['older backup compatibility', /data\.transactions!==undefined/],
  ['device-local storage notice', /device copy remains available/i],
  ['backup restore control', /id="efdRestoreFile"/],
  ['formula-injection guard', /function spreadsheetSafeValue\(value\)/],
  ['combined CSV export', /function buildCombinedCsv\(resultData\)/],
  ['CSV filename', /EasyFlow_All_Cleaned_Data\.csv/],
  ['authenticated API header', /Authorization:'Bearer '\+efToken/],
  ['registration endpoint', /\/api\/auth\/register/],
  ['checkout endpoint', /\/api\/billing\/checkout/],
  ['PayMongo checkout URL compatibility', /r\.checkoutUrl\s*\|\|\s*r\.url/],
  ['account workspace sync', /\/api\/workspace/],
  ['cloud save control', /id="efdCloudSave"/],
];
for (const [name, pattern] of required) {
  assert.match(html, pattern, 'Missing required feature: ' + name);
}
assert.doesNotMatch(html, /rows\s*=\s*rows\.filter\([^;]*(?:duplicate|Duplicate)/,
  'Duplicate processing must not automatically remove records.');

function extractBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'Unable to locate testable source: ' + startMarker);
  return html.slice(start, end);
}
const safeFn = extractBetween('function spreadsheetSafeValue(value){', '\nfunction processSources(){');
const processFn = extractBetween('function processSources(){', '\nfunction tableHtml');
const csvFn = extractBetween('function buildCombinedCsv(resultData){', '\nfunction downloadXlsx');
const context = {
  sources: [
    { fileName: 'customers.csv', sheetName: 'Clients', headers: ['Name', 'Email'], originalRows: [
      { Name: 'Ana Santos', Email: 'ana@example.com' },
      { Name: 'Ana Santos', Email: 'ana@example.com' },
      { Name: 'Ana Santos', Email: 'ana@example.com' },
    ] },
    { fileName: 'sales.xlsx', sheetName: 'January', headers: ['Item', 'Notes'], originalRows: [
      { Item: 'Widget', Notes: '=2+3' },
      { Item: 'Gadget', Notes: 'A, quoted "note"\r\ncontinued' },
    ] },
  ],
  plan: { operations: [{ key: 'duplicates' }] },
  findColumn: (headers, pattern) => headers.find(header => pattern.test(header)),
  findNameColumns: () => [],
  titleCaseName: value => value,
};
vm.runInNewContext(safeFn + '\n' + processFn + '\n' + csvFn, context, { timeout: 1000 });
const result = vm.runInNewContext('processSources()', context);
assert.equal(result.stats.inputRows, 5);
assert.equal(result.stats.outputRows, 5, 'Possible duplicates must never be deleted.');
assert.equal(result.output[0].duplicates.length, 3, 'All rows in a repeated group must be flagged.');
assert.equal(result.stats.duplicatesFound, 3, 'Overall count must equal the number of flagged duplicate rows.');
assert.equal(result.output[1].duplicates.length, 0);
assert.equal(result.output.reduce((n, sheet) => n + sheet.duplicates.length, 0), result.stats.duplicatesFound,
  'Per-sheet duplicate counts must add up to the overall count.');

const csv = vm.runInNewContext('buildCombinedCsv(result)', context);
assert.ok(csv.startsWith('\ufeff'), 'CSV must include a UTF-8 BOM.');
assert.ok(csv.includes('\r\n'), 'CSV must use CRLF line endings.');
assert.ok(csv.includes('SourceFile,SourceSheet'), 'CSV must identify each source file and sheet.');
assert.ok(csv.includes('customers.csv,Clients') && csv.includes('sales.xlsx,January'),
  'CSV must include every processed source and sheet.');
assert.ok(csv.includes("'=2+3"), 'CSV must neutralize formula-like cell values.');
assert.ok(csv.includes('"A, quoted ""note""\r\ncontinued"'),
  'CSV must correctly quote commas, quotes, and embedded newlines.');

console.log('EasyFlow frontend syntax, duplicate-review behavior, and combined CSV tests passed.');
