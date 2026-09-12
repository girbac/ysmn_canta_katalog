import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getAdminConfig, verifySession } from "./admin-auth";

/**
 * Sunucu tarafı oturum kontrolü.
 *
 * Proxy'deki kontrolden bağımsız olarak her korunan sayfa ve her yazma
 * ucu bunu ayrıca çağırıyor. Tek katmana güvenmemenin sebebi basit:
 * proxy yapılandırması değişirse veya bir uç matcher'ın dışında kalırsa
 * panel açıkta kalmasın.
 */
export async function isAdmin(): Promise<boolean> {
  const config = getAdminConfig();
  if (!config) return false;
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value, config);
}

/** Panel hiç yapılandırılmamış mı? (ADMIN_PASSWORD yok) */
export function isAdminConfigured(): boolean {
  return getAdminConfig() !== null;
}
