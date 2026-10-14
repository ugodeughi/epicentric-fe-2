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

  /**
   * Renames an Epikey of the open Map (or the Map itself).
   * @param {string} keyId
   * @param {string} text
   */
  async function renameKey(keyId, text) {
    const key = findKey(tree.value, keyId)
    const saved = await api.maps.updateKey(key, { Text: text.trim() })
    applyFields(keyId, { Text: saved.Text ?? text.trim() })
  }

  /**
   * Changes the colour of an Epikey. The backend passes it on to the Epikeys under it that
   * have no colour of their own, so the Map is reloaded.
   * @param {string} keyId
   * @param {string} color palette id
   */
  async function setKeyColor(keyId, color) {
    const key = findKey(tree.value, keyId)
    await api.maps.updateKey(key, { Color: epikeyColorHex(color), ColorChanged: true })
    await refresh()
  }

  /**
   * Moves an Epikey, with everything under it, to the end of another parent's children.
   * @param {string} keyId
   * @param {string} parentId
   */
  async function moveKey(keyId, parentId) {
    const parent = findKey(tree.value, parentId)
    await api.maps.moveKey(keyId, parentId)
    const siblings = (parent?.Children ?? []).map((key) => key.Id).filter((id) => id !== keyId)
    await api.maps.setOrder([...siblings, keyId])
    await refresh()
  }

  /**
   * Moves an Epikey one place earlier (-1) or later (+1) among its siblings. The Map
   * changes at once and goes back if the backend refuses.
   * @param {string} keyId
   * @param {number} step
   * @returns {Promise<boolean>} false when it is already first or last
   */
  async function shiftKey(keyId, step) {
    const ids = shiftedSiblings(tree.value, keyId, step)
    if (!ids) return false
    const parentId = findParent(tree.value, keyId).Id
    const before = tree.value
    tree.value = withChildOrder(tree.value, parentId, ids)
    try {
      await api.maps.setOrder(ids)
    } catch (error) {
      // Undo only the reordering: other changes may have arrived meanwhile.
      if (tree.value?.Id === before.Id)
        tree.value = withChildOrder(tree.value, parentId, siblingIds(before, parentId))
      throw error
    }
    return true
  }

  /**
   * Deletes an Epikey of the open Map with everything under it, or the Map itself.
   * A deleted Map stays drawn until another one is opened with `open`.
   * @param {string} keyId
   */
  async function deleteKey(keyId) {
    await api.maps.deleteKey(keyId)
    if (keyId === tree.value?.Id) {
      maps.value = maps.value.filter((map) => map.Id !== keyId)
    } else {
      await refresh()
    }
  }

  /**
   * Creates an empty Map, last in the list.
   * @param {string} text
   * @returns {Promise<import('~/schemas/key').Key>}
   */
  async function createMap(text) {
    const created = await api.maps.createMap({ text, order: maps.value.length + 1 })
    maps.value = [...maps.value, created]
    return created
  }

  /** Ready-made Maps, loaded once. */
  const templates = useState('maps:templates', () => null)

  async function loadTemplates() {
    if (!templates.value) templates.value = await api.maps.templates()
    return templates.value
  }

  /**
   * Creates a new Map as a copy of a template Map.
   * @param {string} templateMapId
   * @returns {Promise<import('~/schemas/key').Key>}
   */
  async function importTemplate(templateMapId) {
    const created = await api.maps.importTemplate(templateMapId)
    maps.value = [...maps.value, created]
    return created
  }

  /**
   * Fills the open Map with the Epikeys of a template Map, in their order.
   * @param {import('~/schemas/key').KeyTree} templateMap
   */
  async function fillFromTemplate(templateMap) {
    const parentId = tree.value.Id
    try {
      for (const child of templateMap.Children ?? []) {
        await api.maps.addTemplateKey({ parentId, templateKeyId: child.Id })
      }
    } finally {
      // Whatever was added before a failure is shown.
      await refresh()
    }
  }

  /** Puts saved fields on an Epikey of the open Map, and on the list entry when it is a Map. */
  function applyFields(keyId, fields) {
    if (!tree.value) return
    tree.value = withKeyFields(tree.value, keyId, fields)
    maps.value = maps.value.map((map) => (map.Id === keyId ? { ...map, ...fields } : map))
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
    templates,
    open,
    refresh,
    createKey,
    renameKey,
    setKeyColor,
    moveKey,
    shiftKey,
    deleteKey,
    createMap,
    loadTemplates,
    importTemplate,
    fillFromTemplate,
    setBackground,
    setBackgroundFromCatalog,
    removeBackground,
    setBackgroundDim,
  }
}

function siblingIds(root, parentId) {
  return (findKey(root, parentId)?.Children ?? []).map((key) => key.Id)
}
