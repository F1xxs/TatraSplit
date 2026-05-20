interface Entity {
  _id?: string;
  id?: string;
  [key: string]: unknown;
}

interface Group extends Entity {
  members?: Entity[];
}

/**
 * Ensure an entity has a stable string 'id' field.
 * Handles both MongoDB (_id) and already-normalized (id) shapes.
 * Strips _id from the result so callers can rely on 'id' only.
 */
export function normalizeEntity<T extends Entity>(
  doc: T | null | undefined,
): T & { id: string } {
  if (!doc || typeof doc !== "object") {
    throw new Error("Cannot normalize null/undefined or non-object entity");
  }
  const id = doc._id != null ? String(doc._id) : doc.id || "";
  const { _id, ...rest } = doc;
  return { ...rest, id } as T & { id: string };
}

export function normalizeList<T extends Entity>(
  docs: T[] | undefined,
): (T & { id: string })[] {
  return Array.isArray(docs) ? docs.map(normalizeEntity) : [];
}

/** Groups have nested members[] — normalize both levels. */
export function normalizeGroup(
  g: Group | null | undefined,
):
  | (Group & { id: string; members?: (Entity & { id: string })[] })
  | null
  | undefined {
  if (!g) return g;
  const group = normalizeEntity(g);
  if (Array.isArray((group as any)?.members)) {
    (group as any).members = (group as any).members.map(normalizeEntity);
  }
  return group as Group & { id: string; members?: (Entity & { id: string })[] };
}
