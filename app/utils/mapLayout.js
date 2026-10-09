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
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function layoutMap(root, { nodeWidth, nodeHeight, gap = 40, levelGap = 72, horizontal = false }) {
  if (!root) return { nodes: [], edges: [] }

  const breadth = horizontal ? nodeHeight : nodeWidth
  const depth = horizontal ? nodeWidth : nodeHeight
  const laidOut = tree()
    .nodeSize([breadth + gap, depth + levelGap])
    // Cousins sit a little further apart than siblings, as in the legacy map.
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(hierarchy(root, (key) => key.Children ?? []))

  const nodes = []
  const edges = []

  for (const item of laidOut.descendants()) {
    // Only the Epikey's own fields travel with the node: the subtree stays in the tree.
    const { Children, ...key } = item.data

    nodes.push({
      id: key.Id,
      type: 'epikey',
      // d3 centres a node on its breadth coordinate; Vue Flow positions the top-left corner.
      position: horizontal
        ? { x: item.y, y: item.x - nodeHeight / 2 }
        : { x: item.x - nodeWidth / 2, y: item.y },
      sourcePosition: horizontal ? 'right' : 'bottom',
      targetPosition: horizontal ? 'left' : 'top',
      data: { key, depth: item.depth, childCount: Children?.length ?? 0 },
    })

    if (item.parent) {
      edges.push({ id: `${item.parent.data.Id}->${key.Id}`, source: item.parent.data.Id, target: key.Id })
    }
  }

  return { nodes, edges }
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
