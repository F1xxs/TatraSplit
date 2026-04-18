/**
 * Ensure an entity has a stable string 'id' field.
 * Handles both MongoDB (_id) and already-normalized (id) shapes.
 * Strips _id from the result so callers can rely on 'id' only.
 */
export function normalizeEntity(doc) {
  if (!doc || typeof doc !== 'object') return doc
  const id = doc._id != null ? String(doc._id) : doc.id
  const { _id, ...rest } = doc
  return { ...rest, id }
}

export function normalizeList(docs) {
  return Array.isArray(docs) ? docs.map(normalizeEntity) : docs
}

/** Groups have nested members[] — normalize both levels. */
export function normalizeGroup(g) {
  if (!g) return g
  const group = normalizeEntity(g)
  if (Array.isArray(group.members)) {
    group.members = group.members.map(normalizeEntity)
  }
  return group
}
