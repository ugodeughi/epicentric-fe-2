// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { clampInto, fitViewport, placeBeside, planMap, visibleArea } from '../../app/utils/mapFit'

const node = { nodeWidth: 100, nodeHeight: 100 }

/** A tree with `width` children per Epikey, `depth` levels under the root. */
function grow(id, width, depth) {
  return {
    Id: id,
    Text: id,
    Children: depth ? Array.from({ length: width }, (_, i) => grow(`${id}.${i}`, width, depth - 1)) : [],
  }
}

/** Every node drawn lies inside the container once the viewport is applied. */
function expectInside(plan, container) {
  const { x, y, zoom } = plan.viewport
  for (const { position } of plan.nodes) {
    expect(position.x * zoom + x).toBeGreaterThanOrEqual(-0.5)
    expect(position.y * zoom + y).toBeGreaterThanOrEqual(-0.5)
    expect((position.x + node.nodeWidth) * zoom + x).toBeLessThanOrEqual(container.width + 0.5)
    expect((position.y + node.nodeHeight) * zoom + y).toBeLessThanOrEqual(container.height + 0.5)
  }
}

const ids = (plan) => plan.nodes.map((n) => n.id).sort()

describe('fitViewport', () => {
  it('centres a single node at full size', () => {
    const nodes = [{ position: { x: -50, y: 0 } }]
    expect(fitViewport(nodes, { ...node, container: { width: 500, height: 300 } })).toEqual({
      x: 250,
      y: 100,
      zoom: 1,
    })
  })

  it('shrinks to the tighter of the two directions, keeping the margin', () => {
    const nodes = [{ position: { x: 0, y: 0 } }, { position: { x: 900, y: 0 } }]
    const viewport = fitViewport(nodes, { ...node, container: { width: 540, height: 400 }, margin: 20 })
    expect(viewport.zoom).toBeCloseTo(0.5)
    expect(viewport.x).toBeCloseTo(20)
  })

  it('keeps a different margin on each side free, for what is drawn over the canvas', () => {
    const nodes = [{ position: { x: 0, y: 0 } }]
    const margin = { top: 10, right: 10, bottom: 110, left: 10 }
    const viewport = fitViewport(nodes, { ...node, container: { width: 300, height: 200 }, margin })
    // 80 px of height are left: the node shrinks and sits in the middle of that room.
    expect(viewport).toEqual({ x: 110, y: 10, zoom: 0.8 })
  })

  it('does nothing until the container has a size', () => {
    expect(
      fitViewport([{ position: { x: 0, y: 0 } }], { ...node, container: { width: 0, height: 0 } }).zoom,
    ).toBe(1)
  })
})

describe('planMap', () => {
  it('draws a small Map whole, at full size, in the orientation it asks for', () => {
    const container = { width: 1000, height: 700 }
    const plan = planMap(grow('r', 2, 1), { ...node, container })

    expect(plan.nodes).toHaveLength(3)
    expect(plan).toMatchObject({ horizontal: false, readable: true, hidden: 0 })
    expect(plan.viewport.zoom).toBe(1)
    expectInside(plan, container)
  })

  it('shrinks a larger Map to fit while it stays readable', () => {
    const container = { width: 700, height: 600 }
    const plan = planMap(grow('r', 6, 1), { ...node, container })

    expect(plan.nodes).toHaveLength(7)
    expect(plan.hidden).toBe(0)
    expect(plan.viewport.zoom).toBeLessThan(1)
    expect(plan.viewport.zoom).toBeGreaterThanOrEqual(0.5)
    expectInside(plan, container)
  })

  it('lays a wide Map on its side when that keeps it readable, as on a phone', () => {
    const container = { width: 360, height: 1400 }
    const plan = planMap(grow('r', 9, 1), { ...node, container })

    expect(plan).toMatchObject({ horizontal: true, readable: true, hidden: 0 })
    expect(plan.nodes).toHaveLength(10)
    expectInside(plan, container)
  })

  it('keeps the orientation the Map asks for whenever it is readable', () => {
    const plan = planMap(grow('r', 2, 1), {
      ...node,
      container: { width: 1000, height: 700 },
      preferHorizontal: true,
    })
    expect(plan.horizontal).toBe(true)
  })

  it('folds the deepest branches when the whole Map would be unreadable', () => {
    const container = { width: 900, height: 600 }
    const plan = planMap(grow('r', 4, 3), { ...node, container })

    expect(plan.readable).toBe(true)
    expect(plan.viewport.zoom).toBeGreaterThanOrEqual(0.5)
    expect(plan.hidden).toBeGreaterThan(0)
    expect(plan.hidden + plan.nodes.length).toBe(85)
    // The top of the Map is what stays.
    expect(ids(plan)).toEqual(expect.arrayContaining(['r', 'r.0', 'r.1', 'r.2', 'r.3']))
    // Folded Epikeys say how many they hide.
    const folded = plan.nodes.filter((n) => n.data.collapsed)
    expect(folded.length).toBeGreaterThan(0)
    expect(folded.reduce((sum, n) => sum + n.data.hiddenCount, 0)).toBe(plan.hidden)
    expectInside(plan, container)
  })

  it('never folds the way down to the selected Epikey, and opens it', () => {
    const container = { width: 900, height: 600 }
    const plan = planMap(grow('r', 4, 3), { ...node, container, selectedId: 'r.2.1' })

    expect(ids(plan)).toEqual(expect.arrayContaining(['r.2', 'r.2.1', 'r.2.1.0', 'r.2.1.3']))
    expect(plan.readable).toBe(true)
    expectInside(plan, container)
  })

  it('opens what the user opened, folding other branches to make room', () => {
    const container = { width: 900, height: 600 }
    const before = planMap(grow('r', 4, 3), { ...node, container })
    const target =
      before.nodes.find((n) => n.data.collapsed && n.data.depth === 2) ??
      before.nodes.find((n) => n.data.collapsed)

    const after = planMap(grow('r', 4, 3), { ...node, container, opened: new Set([target.id]) })

    expect(after.nodes.find((n) => n.id === target.id).data.collapsed).toBe(false)
    expect(after.readable).toBe(true)
    expectInside(after, container)
  })

  it('folds what the user folded even when everything would fit', () => {
    const tree = {
      Id: 'r',
      Children: [
        { Id: 'a', Children: [{ Id: 'a1', Children: [] }] },
        { Id: 'b', Children: [] },
      ],
    }
    const plan = planMap(tree, { ...node, container: { width: 1000, height: 800 }, closed: new Set(['a']) })

    expect(ids(plan)).toEqual(['a', 'b', 'r'])
    expect(plan.nodes.find((n) => n.id === 'a').data).toMatchObject({ collapsed: true, hiddenCount: 1 })
    expect(plan.hidden).toBe(1)
  })

  it('lets the user fold the selected Epikey', () => {
    const tree = { Id: 'r', Children: [{ Id: 'a', Children: [{ Id: 'a1', Children: [] }] }] }
    const plan = planMap(tree, {
      ...node,
      container: { width: 1000, height: 800 },
      selectedId: 'a',
      closed: new Set(['a']),
    })
    expect(ids(plan)).toEqual(['a', 'r'])
  })

  it('stacks a long row of Epikeys in columns rather than shrinking it to nothing', () => {
    const container = { width: 1100, height: 700 }
    const plan = planMap(grow('r', 30, 1), { ...node, container })

    expect(plan.nodes).toHaveLength(31)
    expect(plan).toMatchObject({ readable: true, hidden: 0 })
    // Stacked siblings hang from the sibling above them, with their own kind of line.
    const stack = plan.edges.filter((edge) => edge.class === 'map-edge--stack')
    expect(stack.length).toBeGreaterThan(0)
    expect(plan.edges.filter((edge) => edge.source === 'r')).toHaveLength(30 - stack.length)
    expectInside(plan, container)
  })

  it('never folds the Map itself', () => {
    const plan = planMap(grow('r', 40, 1), { ...node, container: { width: 320, height: 480 } })
    expect(plan.nodes).toHaveLength(41)
  })

  it('still shows everything inside the container when it cannot be made readable', () => {
    const container = { width: 320, height: 300 }
    const plan = planMap(grow('r', 60, 1), { ...node, container })

    expect(plan.nodes).toHaveLength(61)
    expect(plan.readable).toBe(false)
    expectInside(plan, container)
  })

  it('returns an empty plan without a Map or before the canvas has a size', () => {
    expect(planMap(null, { ...node, container: { width: 800, height: 600 } }).nodes).toEqual([])
    const unsized = planMap(grow('r', 2, 1), { ...node, container: { width: 0, height: 0 } })
    expect(unsized.nodes).toHaveLength(3)
    expect(unsized.viewport.zoom).toBe(1)
  })
})

describe('Epikeys moved by hand', () => {
  const tree = {
    Id: 'r',
    Children: [
      { Id: 'a', Children: [] },
      { Id: 'b', Children: [] },
    ],
  }
  const container = { width: 1000, height: 800 }
  const at = (plan, id) => plan.nodes.find((n) => n.id === id)

  it('draws a moved Epikey at its place plus the distance it was dragged, and remembers the place', () => {
    const base = planMap(tree, { ...node, container })
    const plan = planMap(tree, { ...node, container, offsets: { a: { x: -60, y: 90 } } })

    expect(at(plan, 'a').data.home).toEqual(at(base, 'a').position)
    expect(at(plan, 'a').position).toEqual({
      x: at(base, 'a').position.x - 60,
      y: at(base, 'a').position.y + 90,
    })
    expect(at(plan, 'b').position).toEqual(at(base, 'b').position)
    expect(at(plan, 'b').data.home).toEqual(at(base, 'b').position)
  })

  it('keeps a moved Epikey inside the container', () => {
    const plan = planMap(tree, { ...node, container, offsets: { b: { x: 2000, y: 0 } } })
    expect(plan.viewport.zoom).toBeLessThan(1)
    expectInside(plan, container)
  })

  it('ignores the position of an Epikey that is no longer there', () => {
    const plan = planMap(tree, { ...node, container, offsets: { gone: { x: 5, y: 5 } } })
    expect(plan.nodes).toHaveLength(3)
  })
})

describe('visibleArea and clampInto', () => {
  const options = {
    ...node,
    container: { width: 800, height: 600 },
    margin: { top: 20, right: 20, bottom: 80, left: 20 },
  }

  it('gives the positions at which a node is entirely on screen, inside the margins', () => {
    expect(visibleArea({ x: 0, y: 0, zoom: 1 }, options)).toEqual({
      left: 20,
      top: 20,
      right: 680,
      bottom: 420,
    })
    // Zoomed out by half and shifted: twice as much of the Map is on screen.
    expect(visibleArea({ x: 100, y: 50, zoom: 0.5 }, options)).toEqual({
      left: -160,
      top: -60,
      right: 1260,
      bottom: 840,
    })
  })

  it('pulls a position dropped outside back to the nearest edge', () => {
    const area = { left: 0, top: 0, right: 500, bottom: 300 }
    expect(clampInto({ x: 250, y: 100 }, area)).toEqual({ x: 250, y: 100 })
    expect(clampInto({ x: -40, y: 900 }, area)).toEqual({ x: 0, y: 300 })
    expect(clampInto({ x: 640, y: -5 }, area)).toEqual({ x: 500, y: 0 })
  })
})

describe('placeBeside', () => {
  const options = { ...node, container: { width: 800, height: 600 }, panel: { width: 200, height: 100 } }
  const still = { x: 0, y: 0, zoom: 1 }

  it('puts the panel to the right of the node, level with its middle', () => {
    expect(placeBeside({ x: 100, y: 200 }, still, options)).toEqual({ left: 208, top: 200 })
  })

  it('follows the pan and zoom of the Map', () => {
    // The node is drawn at (150, 250), 50 px wide and tall.
    expect(placeBeside({ x: 100, y: 200 }, { x: 100, y: 150, zoom: 0.5 }, options)).toEqual({
      left: 208,
      top: 225,
    })
  })

  it('goes to the left when there is no room on the right', () => {
    expect(placeBeside({ x: 650, y: 200 }, still, options)).toEqual({ left: 442, top: 200 })
  })

  it('goes below the node for a Map lying on its side, or above when there is no room', () => {
    expect(placeBeside({ x: 300, y: 100 }, still, { ...options, below: true })).toEqual({
      left: 250,
      top: 208,
    })
    expect(placeBeside({ x: 300, y: 450 }, still, { ...options, below: true })).toEqual({
      left: 250,
      top: 342,
    })
  })

  it('never leaves the container', () => {
    expect(placeBeside({ x: -400, y: -400 }, still, options)).toEqual({ left: 8, top: 8 })
    expect(placeBeside({ x: 2000, y: 2000 }, still, options)).toEqual({ left: 592, top: 492 })
  })
})
