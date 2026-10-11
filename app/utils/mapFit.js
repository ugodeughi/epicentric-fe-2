import { layoutMap, pathTo } from './mapLayout'

/** Columns tried when stacking a long row of Epikeys, widest first. */
const WRAPS = [12, 10, 8, 6, 5, 4, 3, 2]

/**
 * Decides how a Map is drawn so that it always fits its container and stays readable.
 *
 * In order:
 * 1. the whole tree, shrunk to fit, in the orientation the Map asks for;
 * 2. if that makes it unreadable, the other orientation (a wide tree fits a tall phone
 *    screen much better lying on its side);
 * 3. then long rows of Epikeys without children are stacked in columns, as few rows as it
 *    takes;
 * 4. if it is still unreadable, branches are folded away, deepest and last first, until
 *    what is left is readable. Folded Epikeys show how many they hide and can be opened.
 *
 * The Map itself (the root), branches the user opened and the path to the selected Epikey
 * are never folded. Only when those alone do not fit does the Map shrink below the
 * readable size, so everything shown is always inside the container.
 *
 * @param {import('~/schemas/key').KeyTree | null | undefined} root
 * @param {object} options
 * @param {{ width: number, height: number }} options.container size of the canvas, in px
 * @param {number} options.nodeWidth
 * @param {number} options.nodeHeight
 * @param {boolean} [options.preferHorizontal] orientation saved on the Map
 * @param {number} [options.readableZoom] smallest zoom at which Epikey names can be read
 * @param {number} [options.maxZoom] the Map is never enlarged beyond this
 * @param {number | { top: number, right: number, bottom: number, left: number }} [options.margin]
 *   free space kept around the tree, in px
 * @param {string | null} [options.selectedId] its ancestors stay open
 * @param {Set<string>} [options.opened] Epikeys the user opened
 * @param {Set<string>} [options.closed] Epikeys the user folded
 * @param {Record<string, { x: number, y: number }>} [options.offsets] how far the user dragged
 *   each Epikey from the place the layout gives it. Kept as a distance, so a moved Epikey
 *   follows its neighbours when the layout changes. `data.home` is the place it was given.
 * @returns {{ nodes: object[], edges: object[], horizontal: boolean, viewport: { x: number, y: number, zoom: number }, readable: boolean, hidden: number }}
 */
export function planMap(
  root,
  {
    container,
    nodeWidth,
    nodeHeight,
    preferHorizontal = false,
    readableZoom = 0.5,
    maxZoom = 1,
    margin = 20,
    selectedId = null,
    opened = new Set(),
    closed = new Set(),
    offsets = {},
  },
) {
  const empty = {
    nodes: [],
    edges: [],
    horizontal: preferHorizontal,
    viewport: { x: 0, y: 0, zoom: 1 },
    readable: true,
    hidden: 0,
  }
  if (!root) return empty

  const parents = parentsInBreadthOrder(root)
  const total = 1 + parents.reduce((sum, key) => sum + key.Children.length, 0)

  // Never folded: what the user opened, and the way down to the selection. The selected
  // Epikey itself opens too, unless the user folded it.
  const path = pathTo(root, selectedId)
  const required = new Set([root.Id, ...opened, ...path.slice(0, -1)])
  if (selectedId && path.length && !closed.has(selectedId)) required.add(selectedId)

  const measure = (horizontal, open, wrap = 0) => {
    const collapsed = new Set(parents.filter((key) => !open.has(key.Id)).map((key) => key.Id))
    // Stacked rows are drawn closer together: the point is to save space.
    const gaps = wrap ? { gap: 16, levelGap: 40 } : {}
    const graph = layoutMap(root, { nodeWidth, nodeHeight, horizontal, collapsed, wrap, ...gaps })
    const nodes = graph.nodes.map((node) => moved(node, offsets[node.id]))
    const viewport = fitViewport(nodes, { container, nodeWidth, nodeHeight, margin, maxZoom })
    return { nodes, edges: graph.edges, horizontal, viewport, hidden: total - nodes.length }
  }

  /** The least stacking that makes the drawing readable; failing that, the largest drawing. */
  const stacked = (horizontal, open) => {
    let largest = null
    for (const wrap of WRAPS) {
      const attempt = { ...measure(horizontal, open, wrap), wrap }
      if (attempt.viewport.zoom >= readableZoom) return attempt
      if (!largest || attempt.viewport.zoom > largest.viewport.zoom) largest = attempt
    }
    return largest
  }

  // The user's folds are honoured even when everything would fit.
  const wanted = new Set(
    parents.filter((key) => !closed.has(key.Id) || required.has(key.Id)).map((key) => key.Id),
  )

  const orientations = [preferHorizontal, !preferHorizontal]

  for (const horizontal of orientations) {
    const whole = measure(horizontal, wanted)
    if (whole.viewport.zoom >= readableZoom) return { ...whole, readable: true }
  }

  const wrapped = orientations.map((horizontal) => stacked(horizontal, wanted))
  const readableWrapped = wrapped.find((plan) => plan.viewport.zoom >= readableZoom)
  if (readableWrapped) return { ...readableWrapped, readable: true }

  let best = null
  for (const [i, horizontal] of orientations.entries()) {
    // Fold everything that may be folded, then reopen branches from the top for as long
    // as the result stays readable.
    const { wrap } = wrapped[i]
    const open = new Set(required)
    let plan = measure(horizontal, open, wrap)
    for (const key of parents) {
      if (open.has(key.Id) || !wanted.has(key.Id)) continue
      // A branch can only be opened if it is on screen, that is if its parent is open.
      if (key.parentId && !open.has(key.parentId)) continue

      const attempt = measure(horizontal, new Set(open).add(key.Id), wrap)
      if (attempt.viewport.zoom >= readableZoom) {
        open.add(key.Id)
        plan = attempt
      }
    }

    if (!best || isBetter(plan, best, readableZoom)) best = plan
  }

  return { ...best, readable: best.viewport.zoom >= readableZoom }
}

/** A node at the place the layout gave it (`data.home`) plus the distance the user dragged it. */
function moved(node, offset) {
  const home = node.position
  const position = offset ? { x: home.x + offset.x, y: home.y + offset.y } : home
  return { ...node, position, data: { ...node.data, home } }
}

/**
 * The part of the Map's own coordinates that is on screen, inside the margins, for a node
 * of the given size: a node placed within it is entirely visible.
 * @returns {{ left: number, top: number, right: number, bottom: number }}
 */
export function visibleArea(viewport, { container, nodeWidth, nodeHeight, margin = 20 }) {
  const free =
    typeof margin === 'number' ? { top: margin, right: margin, bottom: margin, left: margin } : margin
  const left = (free.left - viewport.x) / viewport.zoom
  const top = (free.top - viewport.y) / viewport.zoom
  return {
    left,
    top,
    // Never narrower than the node itself, on a canvas too small to hold one.
    right: Math.max(left, (container.width - free.right - viewport.x) / viewport.zoom - nodeWidth),
    bottom: Math.max(top, (container.height - free.bottom - viewport.y) / viewport.zoom - nodeHeight),
  }
}

/** A position pulled back inside an area (see visibleArea). */
export function clampInto(position, area) {
  return {
    x: Math.min(area.right, Math.max(area.left, position.x)),
    y: Math.min(area.bottom, Math.max(area.top, position.y)),
  }
}

/** More Epikeys on screen wins, provided they can be read; then the larger drawing. */
function isBetter(plan, other, readableZoom) {
  const readable = plan.viewport.zoom >= readableZoom
  if (readable !== other.viewport.zoom >= readableZoom) return readable
  if (plan.hidden !== other.hidden) return plan.hidden < other.hidden
  return plan.viewport.zoom > other.viewport.zoom
}

/**
 * Epikeys that have children, top level first and in order within a level, each with the
 * id of its parent.
 */
function parentsInBreadthOrder(root) {
  const found = []
  let level = [{ key: root, parentId: null }]
  while (level.length) {
    const next = []
    for (const { key, parentId } of level) {
      if (!key.Children?.length) continue
      found.push({ Id: key.Id, Children: key.Children, parentId })
      for (const child of key.Children) next.push({ key: child, parentId: key.Id })
    }
    level = next
  }
  return found
}

/**
 * Viewport that centres the nodes in the container, as large as they fit.
 * @returns {{ x: number, y: number, zoom: number }}
 */
export function fitViewport(nodes, { container, nodeWidth, nodeHeight, margin = 20, maxZoom = 1 }) {
  if (!nodes.length || !container?.width || !container?.height) return { x: 0, y: 0, zoom: maxZoom }

  const left = Math.min(...nodes.map((node) => node.position.x))
  const top = Math.min(...nodes.map((node) => node.position.y))
  const width = Math.max(...nodes.map((node) => node.position.x)) + nodeWidth - left
  const height = Math.max(...nodes.map((node) => node.position.y)) + nodeHeight - top

  const free =
    typeof margin === 'number' ? { top: margin, right: margin, bottom: margin, left: margin } : margin
  const room = {
    width: Math.max(1, container.width - free.left - free.right),
    height: Math.max(1, container.height - free.top - free.bottom),
  }
  const zoom = Math.min(maxZoom, room.width / width, room.height / height)

  return {
    x: free.left + (room.width - width * zoom) / 2 - left * zoom,
    y: free.top + (room.height - height * zoom) / 2 - top * zoom,
    zoom,
  }
}
