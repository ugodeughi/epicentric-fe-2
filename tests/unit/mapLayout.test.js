// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { findKey, layoutMap } from '../../app/utils/mapLayout'

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

    expect(root.data).toEqual({ key: { Id: 'root', Text: 'Workout' }, depth: 0, childCount: 3 })
    expect(a.data).toEqual({ key: { Id: 'a', Text: 'Warm up' }, depth: 1, childCount: 1 })
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
