/**
 * Read-only helpers on an Epikey tree (`KeyTree`), for the editing actions of the Map.
 * Layout helpers (`findKey`, `pathTo`, `countDescendants`) are in mapLayout.js.
 */

/**
 * Links held by an Epikey and by everything under it.
 * @param {import('~/schemas/key').KeyTree | null | undefined} key
 */
export function countLinks(key) {
  if (!key) return 0
  return (key.LinksCount ?? 0) + (key.Children ?? []).reduce((sum, child) => sum + countLinks(child), 0)
}

/**
 * The parent of an Epikey in the tree; null for the root or an unknown id.
 * @param {import('~/schemas/key').KeyTree | null | undefined} root
 * @param {string} id
 * @returns {import('~/schemas/key').KeyTree | null}
 */
export function findParent(root, id) {
  for (const child of root?.Children ?? []) {
    if (child.Id === id) return root
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

/**
 * Where an Epikey can be moved: every Epikey of the tree, in reading order with its depth,
 * except the Epikey itself, what is under it (it would be cut off from the Map) and its
 * current parent (nothing would change).
 * @param {import('~/schemas/key').KeyTree} root
 * @param {string} id
 * @returns {{ key: import('~/schemas/key').KeyTree, depth: number }[]}
 */
export function moveTargets(root, id) {
  const parentId = findParent(root, id)?.Id
  const targets = []

  function walk(key, depth) {
    if (key.Id === id) return
    if (key.Id !== parentId) targets.push({ key, depth })
    for (const child of key.Children ?? []) walk(child, depth + 1)
  }

  walk(root, 0)
  return targets
}

/**
 * Sibling ids after moving one Epikey by `step` places (-1 earlier, +1 later);
 * null when it cannot move that way.
 * @param {import('~/schemas/key').KeyTree} root
 * @param {string} id
 * @param {number} step
 * @returns {string[] | null}
 */
export function shiftedSiblings(root, id, step) {
  const ids = (findParent(root, id)?.Children ?? []).map((key) => key.Id)
  const from = ids.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= ids.length) return null
  ids.splice(from, 1)
  ids.splice(to, 0, id)
  return ids
}

/**
 * A copy of the tree with one parent's children in the given order.
 * @param {import('~/schemas/key').KeyTree} root
 * @param {string} parentId
 * @param {string[]} ids
 * @returns {import('~/schemas/key').KeyTree}
 */
export function withChildOrder(root, parentId, ids) {
  if (root.Id === parentId) {
    const byId = new Map((root.Children ?? []).map((key) => [key.Id, key]))
    return { ...root, Children: ids.map((id) => byId.get(id)).filter(Boolean) }
  }
  if (!root.Children?.length) return root
  return { ...root, Children: root.Children.map((child) => withChildOrder(child, parentId, ids)) }
}

/**
 * A copy of the tree with some fields of one Epikey changed.
 * @param {import('~/schemas/key').KeyTree} root
 * @param {string} id
 * @param {Partial<import('~/schemas/key').Key>} fields
 * @returns {import('~/schemas/key').KeyTree}
 */
export function withKeyFields(root, id, fields) {
  if (root.Id === id) return { ...root, ...fields }
  if (!root.Children?.length) return root
  return { ...root, Children: root.Children.map((child) => withKeyFields(child, id, fields)) }
}

/**
 * Text of a short HTML fragment, such as a template description, for showing as text.
 * @param {string | null | undefined} html
 */
export function plainText(html) {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
