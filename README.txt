EXCEL EASYFLOW — COMPLETE UPDATE PACKAGE

Files:
- index.html: frontend website
- worker.js: Cloudflare Worker API
- DEPLOYMENT_CHECKLIST.txt: deployment and test checklist

IMPORTANT:
This is a proposed update package, not proof that the live site has been updated or fully production-tested. Back up the existing files before replacing anything. Never paste secret values into GitHub or chat.

GitHub Pages:
1. Back up the current index.html.
2. Replace index.html in https://github.com/reineaira/excel-easyflow
3. Commit and wait for GitHub Pages to publish.
4. The frontend calls https://easyflow-ai-brain.grettabaliw.workers.dev/api/brain

Cloudflare:
1. Back up the current Worker code.
2. Review worker.js, then deploy to the existing easyflow-ai-brain Worker.
3. Keep OPENAI_API_KEY as a Cloudflare secret. Never share its value.
4. Keep any working OPENAI_MODEL variable unchanged.
5. Do not delete D1 bindings or other secrets without confirming they are unused. This Worker code does not use D1 or PayMongo.
6. Test https://easyflow-ai-brain.grettabaliw.workers.dev/api/health

Privacy and security:
AI planning sends task text, file/sheet names, headers, row counts, and up to three sample rows per sheet to the Worker. Use only data you are authorized to process. CORS is not authentication; configure Cloudflare rate limiting/WAF before public promotion.
