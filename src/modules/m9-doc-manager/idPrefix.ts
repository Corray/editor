/**
 * 应用层 ID 前缀集中常量（arch-constraints §6）。
 * 顶级对象 document → `D_<uuid>`（省父级段）。
 */
export const EntityIdPrefixes = {
  DOC: 'D_',
  SNAPSHOT: 'SN_', // v2.6：版本快照（ADR-022 / 顶级附属对象，省父级段）
} as const;

/** 生成文档 ID：`D_<uuid>`。crypto.randomUUID（HTTPS/现代浏览器 + Node 18+）。 */
export function newDocId(): string {
  return EntityIdPrefixes.DOC + crypto.randomUUID();
}

/** 生成快照 ID：`SN_<uuid>`（v2.6 / ADR-022）。 */
export function newSnapshotId(): string {
  return EntityIdPrefixes.SNAPSHOT + crypto.randomUUID();
}
