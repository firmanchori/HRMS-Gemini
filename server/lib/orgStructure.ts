export interface ClosureRow {
  ancestorEntityId: string;
  descendantEntityId: string;
  depth: number;
}

/**
 * Closure-table maintenance for a newly-created entity. `parentAncestorRows`
 * must be every row where descendantEntityId = the new entity's parent
 * (i.e. the parent's own full ancestor chain, including itself at depth 0).
 * Pass [] for a root entity (no parent). Visibility is strictly vertical —
 * an entity's closure rows only ever point to its own ancestors/self, never
 * to a sibling (user correction 2026-11-01: "mewarisi yang diatasnya secara
 * vertical bukan horizontal").
 */
export function computeNewEntityClosureRows(newEntityId: string, parentAncestorRows: ClosureRow[]): ClosureRow[] {
  const rows: ClosureRow[] = [{ ancestorEntityId: newEntityId, descendantEntityId: newEntityId, depth: 0 }];
  for (const row of parentAncestorRows) {
    rows.push({ ancestorEntityId: row.ancestorEntityId, descendantEntityId: newEntityId, depth: row.depth + 1 });
  }
  return rows;
}

export interface EntityNode {
  id: string;
  parentEntityId: string | null;
  [key: string]: unknown;
}

export interface EntityTreeNode<T extends EntityNode> {
  entity: T;
  children: EntityTreeNode<T>[];
}

/** Turns a flat entity list into a nested tree for the "lihat bertingkat" hierarchical view. Entities whose parent isn't in the list (shouldn't happen, but defensive) are treated as roots too. */
export function buildEntityTree<T extends EntityNode>(entities: T[]): EntityTreeNode<T>[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const childrenOf = new Map<string, T[]>();
  const roots: T[] = [];

  for (const entity of entities) {
    if (entity.parentEntityId && byId.has(entity.parentEntityId)) {
      const siblings = childrenOf.get(entity.parentEntityId) ?? [];
      siblings.push(entity);
      childrenOf.set(entity.parentEntityId, siblings);
    } else {
      roots.push(entity);
    }
  }

  function toNode(entity: T): EntityTreeNode<T> {
    return { entity, children: (childrenOf.get(entity.id) ?? []).map(toNode) };
  }

  return roots.map(toNode);
}

/**
 * NIK format inheritance needs an explicit, persistent choice (user
 * correction 2026-11-01) — not just "was it omitted at creation" like the
 * other copied entity fields. followParent=true always copies the parent's
 * CURRENT pattern (a dead copy, re-triggered every time this is set to
 * true again) and records that choice; false means someone deliberately
 * typed a custom pattern. A root entity (hasParent=false) can never follow
 * a parent, regardless of what's requested.
 */
export function resolveNikPattern(
  hasParent: boolean,
  followParent: boolean,
  parentNikPattern: string | null,
  requestedNikPattern: string | null
): { nikPattern: string | null; nikPatternFollowsParent: boolean } {
  if (!hasParent) return { nikPattern: requestedNikPattern, nikPatternFollowsParent: false };
  if (followParent) return { nikPattern: parentNikPattern, nikPatternFollowsParent: true };
  return { nikPattern: requestedNikPattern, nikPatternFollowsParent: false };
}

export interface OrgChanges {
  divisions?: { create?: Record<string, unknown>[]; update?: { id: string; data: Record<string, unknown> }[]; delete?: string[] };
  departments?: { create?: Record<string, unknown>[]; update?: { id: string; data: Record<string, unknown> }[]; delete?: string[] };
  positions?: { create?: Record<string, unknown>[]; update?: { id: string; data: Record<string, unknown> }[]; delete?: string[] };
  orgNodes?: { create?: Record<string, unknown>[]; update?: { id: string; data: Record<string, unknown> }[]; delete?: string[] };
}

/**
 * Pure diff-application used by an approved org_change_proposal: given the
 * entity's current rows for one kind (divisions, departments, ...) and the
 * create/update/delete instructions for that kind, returns the resulting
 * array. The route handler calls this once per kind and persists the result
 * (insert the created ones, update the changed ones, delete the removed
 * ones) inside one DB transaction — kept here as pure logic so the apply
 * behavior itself is unit-testable without a database.
 */
export function applyChangeSet<T extends { id: string }>(
  current: T[],
  changeSet: { create?: Record<string, unknown>[]; update?: { id: string; data: Record<string, unknown> }[]; delete?: string[] } | undefined
): T[] {
  if (!changeSet) return current;
  const deleteIds = new Set(changeSet.delete ?? []);
  const updates = new Map((changeSet.update ?? []).map((u) => [u.id, u.data]));

  const kept = current
    .filter((row) => !deleteIds.has(row.id))
    .map((row) => (updates.has(row.id) ? ({ ...row, ...updates.get(row.id) } as T) : row));

  const created = (changeSet.create ?? []) as T[];
  return [...kept, ...created];
}
