import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { requireServerEnv } from "@/lib/config/env";

function sign(value: string) { return createHmac("sha256", requireServerEnv("DELIVERY_TOKEN_PEPPER")).update(value).digest("base64url"); }
export function createDeliveryToken(deliveryId: string, expiresAt: string) { const body = Buffer.from(JSON.stringify({ deliveryId, expiresAt })).toString("base64url"); return `${body}.${sign(body)}`; }
export function parseDeliveryToken(token: string) { const [body, signature] = token.split("."); if (!body || !signature) return null; const expected = sign(body); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; try { const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { deliveryId: string; expiresAt: string }; return new Date(value.expiresAt) > new Date() ? value : null; } catch { return null; } }
export function hashDeliveryToken(token: string) { return sign(`link:${token}`); }
export function hashOtp(deliveryId: string, code: string) { return sign(`otp:${deliveryId}:${code}`); }
export function createDeliverySession(deliveryId: string, expiresAt: string) { const value = `${deliveryId}.${expiresAt}`; return `${value}.${sign(`session:${value}`)}`; }
export function verifyDeliverySession(value: string | undefined, deliveryId: string) { if (!value) return false; const [id, expiresAt, signature] = value.split("."); if (!id || !expiresAt || !signature || id !== deliveryId || Number(expiresAt) < Date.now()) return false; const expected = sign(`session:${id}.${expiresAt}`); return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected)); }
