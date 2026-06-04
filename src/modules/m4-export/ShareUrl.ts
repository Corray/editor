import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

/**
 * URL 分享编码（ADR-006 / data-model v1.2）。
 *
 * 格式 `#doc=<version>.<payload>`：
 *   version=1，payload = lz-string compressToEncodedURIComponent（URL-safe）。
 * **非加密** —— lz 编码明文可逆，分享 URL 含明文内容（隐私 toast 由 chrome 提示）。
 */
const VERSION = '1';

/** URL 长度上限（保守覆盖主流浏览器/平台下限）；超限拒绝生成，不产坏链接。 */
export const SHARE_URL_MAX = 8000;

/** 源文 → hash payload `1.<lz>`。 */
export function encodeShareText(text: string): string {
  return `${VERSION}.${compressToEncodedURIComponent(text)}`;
}

/** 完整分享 URL；超 {@link SHARE_URL_MAX} → null（调用方 toast 拒绝）。 */
export function buildShareUrl(text: string): string | null {
  if (typeof location === 'undefined') return null;
  const url = `${location.origin}${location.pathname}#doc=${encodeShareText(text)}`;
  return url.length > SHARE_URL_MAX ? null : url;
}

/**
 * 解析 location.hash 分享参数 → 源文；无 / 版本未知 / 解码失败 → null。
 * 启动时调用：null 表示"无有效分享"，走正常 IDB 加载。
 */
export function readSharedDocument(): string | null {
  if (typeof location === 'undefined') return null;
  const m = location.hash.match(/^#doc=(\d+)\.(.*)$/);
  if (!m) return null;
  const [, version, payload] = m;
  if (version !== VERSION) return null; // 不支持的格式版本
  return decompressFromEncodedURIComponent(payload ?? ''); // 解码失败 → null
}
