export const CATALOG_PAGE_SIZE = 50

/** Orders offered in the Catalog → backend `Order` of `items/load`. */
export const CATALOG_SORTS = Object.freeze({
  recent: 'ImportDate desc',
  oldest: 'ImportDate asc',
  name: 'ItemName asc',
})

/**
 * One section of the Catalog, loaded a page at a time, plus the number of contents of
 * every section. The list is shared, so the Catalog shows it again at once when the user
 * comes back to it.
 */
export function useCatalog() {
  const api = useApi()

  /** @type {import('vue').Ref<import('~/schemas/item').Item[]>} */
  const items = useState('catalog:items', () => [])
  /** What the list shows: `{ section, search, sort }`. */
  const query = useState('catalog:query', () => null)
  const count = useState('catalog:count', () => 0)
  const more = useState('catalog:more', () => false)
  /** 'idle' | 'loading' | 'ready' | 'error' */
  const status = useState('catalog:status', () => 'idle')
  /** Contents per section, e.g. `{ audio: 98, visual: 117 }`. */
  const counts = useState('catalog:counts', () => ({}))

  // Last page loaded, shared like the list it belongs to.
  const page = useState('catalog:page', () => 0)
  // Answers of a list the user has already left are dropped.
  let request = 0

  async function fetchPage(reset) {
    const { section, search, sort } = query.value
    const current = ++request
    status.value = 'loading'
    try {
      const result = await api.items.load({
        type: CATALOG_SECTIONS[section],
        search,
        order: CATALOG_SORTS[sort] ?? CATALOG_SORTS.recent,
        page: reset ? 0 : page.value + 1,
        pageSize: CATALOG_PAGE_SIZE,
      })
      if (current !== request) return
      page.value = reset ? 0 : page.value + 1
      items.value = reset ? result.items : [...items.value, ...result.items]
      count.value = result.count
      more.value = result.more
      status.value = 'ready'
      // Without a search, the total is also the number shown on the section's tab.
      if (!search) counts.value = { ...counts.value, [section]: result.count }
    } catch (error) {
      if (current !== request) return
      status.value = 'error'
      throw error
    }
  }

  /**
   * Shows a section from its first page.
   * @param {{ section: string, search?: string, sort?: string }} next
   */
  function show({ section, search = '', sort = 'recent' }) {
    query.value = { section, search: search.trim(), sort }
    return fetchPage(true)
  }

  /** Adds the next page, when there is one and nothing is loading. */
  function loadMore() {
    if (!query.value || !more.value || status.value === 'loading') return Promise.resolve()
    return fetchPage(false)
  }

  /** Loads the first page again, keeping section, search and order. */
  function reload() {
    return query.value ? fetchPage(true) : Promise.resolve()
  }

  /**
   * Counts the contents of every section that has no number yet. The backend has no
   * count call: a page of one content carries the total.
   */
  async function loadCounts() {
    const missing = Object.keys(CATALOG_SECTIONS).filter((section) => counts.value[section] === undefined)
    const found = await Promise.all(
      missing.map((section) =>
        api.items
          .load({ type: CATALOG_SECTIONS[section], pageSize: 1 })
          .then((result) => [section, result.count])
          // A failed count only leaves the tab without its number.
          .catch(() => null),
      ),
    )
    counts.value = { ...counts.value, ...Object.fromEntries(found.filter(Boolean)) }
  }

  /**
   * Freezes a content (left out of the playlists) or unfreezes it. The card changes at
   * once and goes back if the backend refuses.
   * @param {string} id
   * @param {boolean} frozen
   */
  async function setFrozen(id, frozen) {
    const patch = (value) => {
      items.value = items.value.map((item) => (item.Id === id ? { ...item, IsFreezed: value } : item))
    }
    patch(frozen)
    try {
      await api.items.save(id, { IsFreezed: frozen })
    } catch (error) {
      patch(!frozen)
      throw error
    }
  }

  /**
   * Uploads files one after the other, then shows the list again with them.
   * @param {File[]} files
   * @returns {Promise<{ added: number, failed: { file: File, code: string }[] }>}
   */
  async function upload(files) {
    let added = 0
    const failed = []
    for (const file of files) {
      try {
        await api.items.upload(file)
        added++
      } catch (error) {
        failed.push({ file, code: error?.code ?? 'UNKNOWN' })
        // Out of space: the next files would fail the same way.
        if (error?.code === 'QUOTA_EXCEEDED') break
      }
    }
    if (added) {
      // Every section may have changed: an upload lands where its type says.
      counts.value = {}
      await Promise.all([reload().catch(() => {}), loadCounts()])
    }
    return { added, failed }
  }

  return { items, query, count, more, status, counts, show, loadMore, reload, loadCounts, setFrozen, upload }
}
