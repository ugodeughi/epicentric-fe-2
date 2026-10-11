import { hierarchy, tree } from 'd3-hierarchy'

/**
 * Turns a Map (an Epikey with its subtree) into Vue Flow nodes and edges.
 *
 * The backend stores no coordinates: a Map is a tree (`ParentId`, `Order`), so positions
 * are computed here with the same tidy-tree layout the legacy frontend uses.
 *
 * @param {import('~/schemas/key').KeyTree | null | undefined} root
 * @param {object} options
 * @param {number} options.nodeWidth width of a node, in px
 * @param {number} options.nodeHeight height of a node, in px
 * @param {number} [options.gap] space between sibling nodes
 * @param {number} [options.levelGap] space between a node and its children
 * @param {boolean} [options.horizontal] grow left to right instead of top down
 * @param {Set<string>} [options.collapsed] ids of the Epikeys whose subtree is folded away
 * @param {number} [options.wrap] when an Epikey has more children than this, and none of
 *   them has children of its own, they are stacked in this many columns instead of one
 *   long row. 0 turns it off.
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function layoutMap(
  root,
  { nodeWidth, nodeHeight, gap = 40, levelGap = 72, horizontal = false, collapsed = new Set(), wrap = 0 },
) {
  if (!root) return { nodes: [], edges: [] }

  const breadth = horizontal ? nodeHeight : nodeWidth
  const depth = horizontal ? nodeWidth : nodeHeight
  const laidOut = tree()
    .nodeSize([breadth + gap, depth + levelGap])
    // Cousins sit a little further apart than siblings, as in the legacy map.
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(
    hierarchy(arrange(root, { collapsed, wrap }), (item) => item.below),
  )

  const nodes = []
  const edges = []

  for (const { x, y, data: item } of laidOut.descendants()) {
    // Only the Epikey's own fields travel with the node: the subtree stays in the tree.
    const { Children, ...key } = item.key
    const childCount = Children?.length ?? 0
    const isCollapsed = childCount > 0 && collapsed.has(key.Id)

    nodes.push({
      id: key.Id,
      type: 'epikey',
      // d3 centres a node on its breadth coordinate; Vue Flow positions the top-left corner.
      position: horizontal ? { x: y, y: x - nodeHeight / 2 } : { x: x - nodeWidth / 2, y },
      sourcePosition: horizontal ? 'right' : 'bottom',
      targetPosition: horizontal ? 'left' : 'top',
      data: {
        key,
        depth: item.depth,
        childCount,
        collapsed: isCollapsed,
        /** Epikeys folded away under this one. */
        hiddenCount: isCollapsed ? countDescendants(item.key) : 0,
      },
    })

    if (item.stackedOn) {
      // A sibling continuing a stack: joined to the one before it, not to the parent.
      edges.push({
        id: `${item.stackedOn}..${key.Id}`,
        source: item.stackedOn,
        target: key.Id,
        type: 'straight',
        class: 'map-edge--stack',
      })
    } else if (item.parentId) {
      edges.push({ id: `${item.parentId}->${key.Id}`, source: item.parentId, target: key.Id })
    }
  }

  return { nodes, edges }
}

/**
 * The tree as it is laid out. `below` holds what is drawn under an Epikey: normally its
 * children; in a stacked group, the next sibling of its column.
 */
function arrange(key, { collapsed, wrap }, parentId = null, depth = 0) {
  const children = collapsed.has(key.Id) ? [] : (key.Children ?? [])
  let below = children.map((child) => arrange(child, { collapsed, wrap }, key.Id, depth + 1))

  // Only Epikeys with no children at all are stacked: one that is merely folded keeps its
  // place in the row, so a stack is never mistaken for a branch.
  if (wrap > 0 && below.length > wrap && children.every((child) => !child.Children?.length)) {
    for (let i = below.length - 1; i >= wrap; i--) {
      below[i].stackedOn = below[i - wrap].key.Id
      below[i - wrap].below = [below[i]]
    }
    below = below.slice(0, wrap)
  }

  return { key, parentId, depth, below, stackedOn: null }
}

/**
 * Number of Epikeys under one, at any depth.
 * @param {import('~/schemas/key').KeyTree | null | undefined} key
 */
export function countDescendants(key) {
  return (key?.Children ?? []).reduce((total, child) => total + 1 + countDescendants(child), 0)
}

/**
 * Finds an Epikey in a tree by id.
 * @param {import('~/schemas/key').KeyTree | null | undefined} root
 * @param {string} id
 * @returns {import('~/schemas/key').KeyTree | null}
 */
export function findKey(root, id) {
  if (!root) return null
  if (root.Id === id) return root
  for (const child of root.Children ?? []) {
    const found = findKey(child, id)
    if (found) return found
  }
  return null
}

/**
 * Ids from the root down to an Epikey, both included; empty when it is not in the tree.
 * @param {import('~/schemas/key').KeyTree | null | undefined} root
 * @param {string | null | undefined} id
 * @returns {string[]}
 */
export function pathTo(root, id) {
  if (!root || !id) return []
  if (root.Id === id) return [root.Id]
  for (const child of root.Children ?? []) {
    const path = pathTo(child, id)
    if (path.length) return [root.Id, ...path]
  }
  return []
}
