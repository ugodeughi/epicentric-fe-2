// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { formatDuration, isImage, itemKind, itemTitle } from '../../app/utils/media'

describe('media helpers', () => {
  it('tells what a content is, also for older images without a subtype', () => {
    expect(itemKind({ MediaType: 0 })).toBe('audio')
    expect(itemKind({ MediaType: 1, MediaSubType: 0 })).toBe('image')
    expect(itemKind({ MediaType: 1, MediaSubType: 1 })).toBe('video')
    expect(itemKind({ MediaType: 1, MediaSubType: 2 })).toBe('embed')
    expect(itemKind({ MediaType: 1, FileExtension: 'JPG' })).toBe('image')
    expect(itemKind({ MediaType: 1, FileExtension: 'mp4' })).toBe('video')
    expect(itemKind({ MediaType: 2 })).toBe('file')
    expect(itemKind({ MediaType: 3 })).toBe('bookmark')
  })

  it('takes as image only what has a file to show', () => {
    expect(isImage({ MediaType: 1, FileExtension: 'png', FileName: 'a.png' })).toBe(true)
    expect(isImage({ MediaType: 1, MediaSubType: 0 })).toBe(false)
    expect(isImage({ MediaType: 1, MediaSubType: 1, FileName: 'v.mp4' })).toBe(false)
  })

  it('writes lengths as minutes and seconds, with hours when needed', () => {
    expect(formatDuration(6.2)).toBe('0:06')
    expect(formatDuration(245)).toBe('4:05')
    expect(formatDuration(3723)).toBe('1:02:03')
    expect(formatDuration(0)).toBe('')
    expect(formatDuration(null)).toBe('')
  })

  it('names a content by its Catalog name without extension, else by its title', () => {
    expect(itemTitle({ Title: 'BodyPart_c5b0', ItemName: 'Triangles in B' })).toBe('Triangles in B')
    expect(itemTitle({ ItemName: 'Alba sul lago.jpg' })).toBe('Alba sul lago')
    expect(itemTitle({ Title: 'Rush', ItemName: '' })).toBe('Rush')
    expect(itemTitle({ ItemName: 'notes v1.2' })).toBe('notes v1.2')
    expect(itemTitle({})).toBe('')
  })
})
