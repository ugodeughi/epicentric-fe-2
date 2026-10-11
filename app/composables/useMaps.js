/**
 * Maps and their Epikey trees. A Map is a root Epikey; the open Map is kept with its
 * whole subtree, which is what the canvas draws.
 */
export function useMaps() {
  const api = useApi()

  /** @type {import('vue').Ref<import('~/schemas/key').Key[]>} */
  const maps = useState('maps:list', () => [])
  /** @type {import('vue').Ref<import('~/schemas/key').KeyTree | null>} */
  const tree = useState('maps:tree', () => null)
  /** 'idle' | 'loading' | 'ready' | 'error' */
  const status = useState('maps:status', () => 'idle')

  /**
   * Loads the list of Maps and opens one: the requested one, or the first.
   * @param {string} [mapId]
   */
  async function open(mapId) {
    status.value = 'loading'
    try {
      maps.value = await api.maps.list()
      const id = maps.value.some((map) => map.Id === mapId) ? mapId : maps.value[0]?.Id
      tree.value = id ? await api.maps.tree(id) : null
      status.value = 'ready'
    } catch (error) {
      status.value = 'error'
      throw error
    }
  }

  /** Reloads the open Map from the backend. */
  async function refresh() {
    if (tree.value) tree.value = await api.maps.tree(tree.value.Id)
  }

  /**
   * Creates an Epikey as the last child of a parent in the open Map.
   * @param {{ parentId: string, text: string, color?: string | null }} input `color` as a palette id
   * @returns {Promise<import('~/schemas/key').Key>}
   */
  async function createKey({ parentId, text, color = null }) {
    const parent = findKey(tree.value, parentId)
    const created = await api.maps.createKey({
      parentId,
      text,
      color: epikeyColorHex(color),
      // 1-based: the backend replaces a falsy Order with 1.
      order: (parent?.Children?.length ?? 0) + 1,
    })
    await refresh()
    return created
  }

  /** Applies saved fields to the open Map and to its entry in the list. */
  function patchMap(fields) {
    tree.value = { ...tree.value, ...fields }
    maps.value = maps.value.map((map) => (map.Id === tree.value.Id ? { ...map, ...fields } : map))
  }

  /**
   * Uploads an image to the Catalog and puts it behind the open Map. An image that is
   * already in the Catalog is not uploaded again: the one there is used.
   * @param {File} file
   */
  async function setBackground(file) {
    const map = tree.value
    let item
    try {
      item = await api.items.upload(file)
    } catch (error) {
      if (error?.code !== 'KO_DUPLICATED') throw error
      const { items } = await api.items.load({ type: 'Video', search: file.name })
      item = items.find((candidate) => candidate.ItemName === file.name && candidate.FileName)
      if (!item) throw error
    }

    await putBehind(map, item)
  }

  /**
   * Puts an image that is already in the Catalog behind the open Map.
   * @param {import('~/schemas/item').Item} item
   */
  function setBackgroundFromCatalog(item) {
    return putBehind(tree.value, item)
  }

  async function putBehind(map, item) {
    // The legacy frontend saves the file name, not the content id: both read this field.
    const saved = await api.maps.updateKey(map, {
      BackgroundImage: item.FileName,
      BackgroundImageChanged: true,
    })
    if (tree.value?.Id === map.Id) patchMap({ BackgroundImage: saved.BackgroundImage })
  }

  /** Takes the image away from behind the open Map. The image stays in the Catalog. */
  async function removeBackground() {
    const map = tree.value
    const saved = await api.maps.updateKey(map, { BackgroundImage: null, BackgroundImageChanged: false })
    if (tree.value?.Id === map.Id) patchMap({ BackgroundImage: saved.BackgroundImage ?? null })
  }

  /**
   * How much the background image is darkened.
   * @param {number} opacity 0 (as it is) to 1 (black)
   */
  async function setBackgroundDim(opacity) {
    const map = tree.value
    const value = Math.min(1, Math.max(0, opacity))
    const saved = await api.maps.updateKey(map, { Opacity: value, OpacityChanged: true })
    if (tree.value?.Id === map.Id) patchMap({ Opacity: saved.Opacity ?? value })
  }

  return {
    maps,
    tree,
    status,
    open,
    refresh,
    createKey,
    setBackground,
    setBackgroundFromCatalog,
    removeBackground,
    setBackgroundDim,
  }
}
