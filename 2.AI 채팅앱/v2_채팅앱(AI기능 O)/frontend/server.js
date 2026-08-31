/**
 * [PC 1 - Frontend Tier Express Static Server] server.js
 * 
 * 빌드(npm run build)된 static 파일(dist/)을 8080 포트로 서빙하는 프로덕션용 서버입니다.
 * 개발 시에는 `npm run dev`를 사용하여 Vite Dev Server(8080)를 실행하는 것을 권장합니다.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Vue Router의 HTML5 History 모드를 지원하기 위한 Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`💻  [Frontend Tier Server (Vue 3)] 실행 완료! (Port: ${PORT})`);
  console.log(`🌐  웹 접속 주소: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
