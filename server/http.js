import crypto from 'node:crypto';
import { isAllowedOrigin } from './config.js';

export function requestId(request) {
  return request.headers['x-request-id'] || crypto.randomUUID();
}

export function applyRequestContext(request, response, config) {
  const id = requestId(request);
  response.setHeader('X-Request-Id', id);
  const origin = request.headers.origin;
  if (origin && isAllowedOrigin(origin, config)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    response.writeHead(204);
    response.end();
    return { id, handled: true };
  }
  return { id, handled: false };
}

export function apiJson(response, status, body, requestIdValue) {
  if (requestIdValue) response.setHeader('X-Request-Id', requestIdValue);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(body));
}

export function apiError(response, status, code, message, requestIdValue, details) {
  apiJson(response, status, { error: { code, message, ...(details ? { details } : {}) } }, requestIdValue);
}
