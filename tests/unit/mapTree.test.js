// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  countLinks,
  findParent,
  moveTargets,
  plainText,
  shiftedSiblings,
  withChildOrder,
  withKeyFields,
} from '../../app/utils/mapTree'

const tree = {
  Id: 'm',
  LinksCount: 1,
  Children: [
    { Id: 'a', LinksCount: 2, Children: [{ Id: 'a1', LinksCount: 3, Children: [{ Id: 'a11' }] }] },
    { Id: 'b', Children: [] },
    { Id: 'c', LinksCount: 4 },
  ],
}

describe('map tree helpers', () => {
  it('counts the Links of an Epikey and of everything under it', () => {
    expect(countLinks(tree)).toBe(10)
    expect(countLinks(tree.Children[0])).toBe(5)
    expect(countLinks(null)).toBe(0)
  })

  it('finds the parent of an Epikey', () => {
    expect(findParent(tree, 'a11').Id).toBe('a1')
    expect(findParent(tree, 'b').Id).toBe('m')
    expect(findParent(tree, 'm')).toBeNull()
    expect(findParent(tree, 'nope')).toBeNull()
  })

  it('offers as move targets everything but the Epikey, what is under it and its parent', () => {
    const targets = moveTargets(tree, 'a1')
    expect(targets.map(({ key, depth }) => [key.Id, depth])).toEqual([
      ['m', 0],
      ['b', 1],
      ['c', 1],
    ])
    expect(moveTargets(tree, 'b').map(({ key }) => key.Id)).toEqual(['a', 'a1', 'a11', 'c'])
  })

  it('shifts an Epikey among its siblings, not past the ends', () => {
    expect(shiftedSiblings(tree, 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(shiftedSiblings(tree, 'b', 1)).toEqual(['a', 'c', 'b'])
    expect(shiftedSiblings(tree, 'a', -1)).toBeNull()
    expect(shiftedSiblings(tree, 'c', 1)).toBeNull()
    expect(shiftedSiblings(tree, 'm', 1)).toBeNull()
  })

  it('reorders and changes Epikeys on a copy, leaving the tree as it was', () => {
    const before = structuredClone(tree)

    const reordered = withChildOrder(tree, 'm', ['c', 'a', 'b'])
    expect(reordered.Children.map((key) => key.Id)).toEqual(['c', 'a', 'b'])
    expect(reordered.Children[1]).toBe(tree.Children[0])

    const renamed = withKeyFields(tree, 'a11', { Text: 'Deep' })
    expect(renamed.Children[0].Children[0].Children[0]).toEqual({ Id: 'a11', Text: 'Deep' })
    expect(renamed.Children[1]).toBe(tree.Children[1])

    expect(tree).toEqual(before)
  })

  it('turns a short HTML description into text', () => {
    expect(plainText('<p><em>Unleash the POWER</em> of&nbsp;Music &amp; more!</p>\n<p>Two</p>')).toBe(
      'Unleash the POWER of Music & more! Two',
    )
    expect(plainText(null)).toBe('')
  })
})
