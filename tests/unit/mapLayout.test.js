// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { countDescendants, findKey, layoutMap, pathTo } from '../../app/utils/mapLayout'

const size = { nodeWidth: 100, nodeHeight: 60 }

const map = {
  Id: 'root',
  Text: 'Workout',
  Children: [
    { Id: 'a', Text: 'Warm up', Children: [{ Id: 'a1', Text: 'Stretch', Children: [] }] },
    { Id: 'b', Text: 'Run', Children: null },
    { Id: 'c', Text: 'Cool down' },
  ],
}

const byId = (nodes) => Object.fromEntries(nodes.map((node) => [node.id, node]))

describe('layoutMap', () => {
  it('returns nothing for a missing Map', () => {
    expect(layoutMap(null, size)).toEqual({ nodes: [], edges: [] })
  })

  it('makes one Epikey node per Epikey and one edge per parent-child pair', () => {
    const { nodes, edges } = layoutMap(map, size)

    expect(nodes.map((node) => node.id).sort()).toEqual(['a', 'a1', 'b', 'c', 'root'])
    expect(nodes.every((node) => node.type === 'epikey')).toBe(true)
    expect(edges).toEqual([
      { id: 'root->a', source: 'root', target: 'a' },
      { id: 'root->b', source: 'root', target: 'b' },
      { id: 'root->c', source: 'root', target: 'c' },
      { id: 'a->a1', source: 'a', target: 'a1' },
    ])
  })

  it('carries the Epikey without its subtree, with depth and number of children', () => {
    const { root, a, c } = byId(layoutMap(map, size).nodes)

    expect(root.data).toMatchObject({
      key: { Id: 'root', Text: 'Workout' },
      depth: 0,
      childCount: 3,
      collapsed: false,
    })
    expect(a.data).toMatchObject({
      key: { Id: 'a', Text: 'Warm up' },
      depth: 1,
      childCount: 1,
      hiddenCount: 0,
    })
    expect(root.data.key).not.toHaveProperty('Children')
    expect(c.data.childCount).toBe(0)
  })

  it('grows top down: each level lower, siblings side by side in order, parent centred', () => {
    const { root, a, b, c, a1 } = byId(layoutMap(map, { ...size, gap: 20, levelGap: 40 }).nodes)

    expect(root.position.y).toBe(0)
    expect(a.position.y).toBe(100)
    expect(a1.position.y).toBe(200)
    expect([a.position.y, b.position.y, c.position.y]).toEqual([100, 100, 100])

    // Siblings do not overlap and keep the backend order.
    expect(b.position.x - a.position.x).toBeGreaterThanOrEqual(120)
    expect(c.position.x - b.position.x).toBeGreaterThanOrEqual(120)
    // The parent sits above the middle of its children.
    expect(root.position.x).toBeCloseTo((a.position.x + c.position.x) / 2)
    expect(a1.position.x).toBeCloseTo(a.position.x)

    expect(root.sourcePosition).toBe('bottom')
    expect(a.targetPosition).toBe('top')
  })

  it('grows left to right for a horizontal Map', () => {
    const { root, a, b, a1 } = byId(
      layoutMap(map, { ...size, gap: 20, levelGap: 40, horizontal: true }).nodes,
    )

    expect(root.position.x).toBe(0)
    expect(a.position.x).toBe(140)
    expect(a1.position.x).toBe(280)
    expect(b.position.y - a.position.y).toBeGreaterThanOrEqual(80)
    expect(root.sourcePosition).toBe('right')
    expect(a.targetPosition).toBe('left')
  })
})

describe('folded branches', () => {
  it('leaves out the Epikeys under a folded one and says how many there are', () => {
    const { nodes, edges } = layoutMap(map, { ...size, collapsed: new Set(['root']) })
    expect(nodes).toHaveLength(1)
    expect(edges).toEqual([])
    expect(nodes[0].data).toMatchObject({ collapsed: true, hiddenCount: 4, childCount: 3 })
  })

  it('does not mark an Epikey without children as folded', () => {
    const { b } = byId(layoutMap(map, { ...size, collapsed: new Set(['b', 'a']) }).nodes)
    expect(b.data).toMatchObject({ collapsed: false, hiddenCount: 0 })
  })

  it('counts the Epikeys under one, at any depth', () => {
    expect(countDescendants(map)).toBe(4)
    expect(countDescendants(map.Children[1])).toBe(0)
    expect(countDescendants(null)).toBe(0)
  })
})

describe('stacked siblings', () => {
  const flat = { Id: 'r', Children: ['a', 'b', 'c', 'd', 'e'].map((Id) => ({ Id, Children: [] })) }

  it('stacks a long row of childless Epikeys in columns, in reading order', () => {
    const { nodes, edges } = layoutMap(flat, { ...size, gap: 20, levelGap: 40, wrap: 2 })
    const { a, b, c, d, e } = byId(nodes)

    // Two columns: a c e / b d
    expect([a.position.y, b.position.y]).toEqual([100, 100])
    expect([c.position.y, d.position.y]).toEqual([200, 200])
    expect(e.position.y).toBe(300)
    expect(c.position.x).toBeCloseTo(a.position.x)
    expect(e.position.x).toBeCloseTo(a.position.x)
    expect(d.position.x).toBeCloseTo(b.position.x)

    expect(edges).toEqual([
      { id: 'r->a', source: 'r', target: 'a' },
      { id: 'r->b', source: 'r', target: 'b' },
      { id: 'a..c', source: 'a', target: 'c', type: 'straight', class: 'map-edge--stack' },
      { id: 'b..d', source: 'b', target: 'd', type: 'straight', class: 'map-edge--stack' },
      { id: 'c..e', source: 'c', target: 'e', type: 'straight', class: 'map-edge--stack' },
    ])
    // Stacked Epikeys are still children of the Map, one level down.
    expect(nodes.every((node) => node.id === 'r' || node.data.depth === 1)).toBe(true)
  })

  it('does not stack Epikeys that are only folded', () => {
    const tree = {
      Id: 'r',
      Children: ['a', 'b', 'c'].map((Id) => ({ Id, Children: [{ Id: `${Id}1`, Children: [] }] })),
    }
    const { edges } = layoutMap(tree, { ...size, wrap: 2, collapsed: new Set(['a', 'b', 'c']) })
    expect(edges.map((edge) => edge.id)).toEqual(['r->a', 'r->b', 'r->c'])
  })

  it('leaves a row alone when it is short enough or when a child has children', () => {
    expect(layoutMap(flat, { ...size, wrap: 5 }).edges.every((edge) => edge.source === 'r')).toBe(true)
    expect(layoutMap(map, { ...size, wrap: 2 }).edges.every((edge) => !edge.class)).toBe(true)
  })
})

describe('pathTo', () => {
  it('lists the ids from the root down to an Epikey', () => {
    expect(pathTo(map, 'a1')).toEqual(['root', 'a', 'a1'])
    expect(pathTo(map, 'root')).toEqual(['root'])
  })

  it('is empty for an unknown Epikey or no selection', () => {
    expect(pathTo(map, 'zzz')).toEqual([])
    expect(pathTo(map, null)).toEqual([])
  })
})

describe('findKey', () => {
  it('finds an Epikey anywhere in the tree', () => {
    expect(findKey(map, 'root')).toBe(map)
    expect(findKey(map, 'a1')?.Text).toBe('Stretch')
  })

  it('returns null when there is no such Epikey or no tree', () => {
    expect(findKey(map, 'zzz')).toBeNull()
    expect(findKey(null, 'a')).toBeNull()
  })
})
