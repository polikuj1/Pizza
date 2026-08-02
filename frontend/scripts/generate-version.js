import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const versionInfo = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
};

writeFileSync(resolve(publicDir, 'version.json'), JSON.stringify(versionInfo, null, 2));
console.log('✅ version.json 已生成:', versionInfo);
