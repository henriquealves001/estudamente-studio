import { access, copyFile, mkdir } from 'node:fs/promises';
try { await access('.openai/hosting.json'); }
catch { await mkdir('.openai',{recursive:true}); await copyFile('hosting.example.json','.openai/hosting.json'); }
