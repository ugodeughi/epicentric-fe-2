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

  return { maps, tree, status, open, refresh, createKey }
}
