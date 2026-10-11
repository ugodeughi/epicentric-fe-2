const PAGE_SIZE = 30

/**
 * The images of the user's Catalog, newest first, loaded a page at a time. Used to pick
 * one, for instance as the background of a Map. State is local to the caller.
 */
export function useCatalogImages() {
  const api = useApi()

  /** @type {import('vue').Ref<import('~/schemas/item').Item[]>} */
  const images = ref([])
  const more = ref(false)
  /** 'idle' | 'loading' | 'ready' | 'error' */
  const status = ref('idle')

  let search = ''
  let page = 0
  // Answers of a search the user has already replaced are dropped.
  let request = 0

  async function load(reset) {
    const current = ++request
    status.value = 'loading'
    try {
      const result = await api.items.load({
        type: 'Video',
        search,
        page: reset ? 0 : page + 1,
        pageSize: PAGE_SIZE,
      })
      if (current !== request) return

      // The Visual section also holds videos and embeds: only images can be shown as one.
      const found = result.items.filter((item) => item.MediaSubType === 0 && item.FileName)
      page = reset ? 0 : page + 1
      images.value = reset ? found : [...images.value, ...found]
      more.value = result.more
      status.value = 'ready'
    } catch {
      if (current === request) status.value = 'error'
    }
  }

  /** Loads the first page, for a search text or for everything. */
  function find(text = '') {
    search = text
    return load(true)
  }

  /** Adds the next page, when there is one and nothing is loading. */
  function loadMore() {
    if (!more.value || status.value === 'loading') return Promise.resolve()
    return load(false)
  }

  return { images, more, status, find, loadMore }
}
