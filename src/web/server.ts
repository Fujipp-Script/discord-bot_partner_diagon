import http from 'http';
import { env } from '@/core/env';

export function startWeb() {
  const srv = http.createServer((_, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  });
  srv.listen(env.PORT, '0.0.0.0');
}
