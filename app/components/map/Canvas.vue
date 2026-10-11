<script setup>
import { Background } from '@vue-flow/background'
import { Handle, Panel, VueFlow, useVueFlow } from '@vue-flow/core'
// Structural styles only: the look comes from our tokens (see "Map con Vue Flow" in CLAUDE.md).
import '@vue-flow/core/dist/style.css'

// Space reserved for a node in the layout; the hexagon is centred inside it.
const NODE_WIDTH = 132
const NODE_HEIGHT = 152
const HEX_SIZE = 120
const FLOW_ID = 'epikey-map'
// Below this zoom Epikey names cannot be read: branches are folded instead of shrinking further.
const READABLE_ZOOM = 0.5
const READABLE_LABEL_PX = 12
const MAX_LABEL_SCALE = 1.25
// Free space around the Map; the strip at the bottom holds the controls.
const MARGIN = { top: 20, right: 20, bottom: 76, left: 20 }

const props = defineProps({
  /** Map to draw: an Epikey with its subtree (schemas/key.js). */
  tree: { type: Object, default: null },
  /** Id of the selected Epikey. */
  selectedId: { type: String, default: null },
  /** Address of the image behind the Map. */
  background: { type: String, default: null },
  /** How much the image is darkened, 0 to 1. */
  dim: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])

const { t } = useI18n()
const { setViewport, zoomIn, zoomOut, viewport } = useVueFlow(FLOW_ID)

// Size of the canvas, kept up to date (window resized, phone rotated).
const container = ref(null)
const size = ref({ width: 0, height: 0 })
let observer
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect
    size.value = { width: Math.round(width), height: Math.round(height) }
  })
  observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

// Branches the user opened or folded by hand. Everything else is decided by planMap.
const opened = ref(new Set())
const closed = ref(new Set())
watch(
  () => props.tree?.Id,
  () => {
    opened.value = new Set()
    closed.value = new Set()
  },
)

// Where the user dragged each Epikey, as a distance from the place the layout gives it.
// The backend stores no positions (yet): they are remembered on this device, per Map.
const offsets = ref({})
const storageKey = computed(() => (props.tree?.Id ? `ec-map-positions:${props.tree.Id}` : null))

function readOffsets() {
  try {
    return JSON.parse(localStorage.getItem(storageKey.value)) ?? {}
  } catch {
    return {}
  }
}

function saveOffsets(next) {
  offsets.value = next
  try {
    if (Object.keys(next).length) localStorage.setItem(storageKey.value, JSON.stringify(next))
    else localStorage.removeItem(storageKey.value)
  } catch {
    // Storage full or blocked: the positions simply last until the page is closed.
  }
}

watch(
  storageKey,
  (key) => {
    offsets.value = key && import.meta.client ? readOffsets() : {}
  },
  { immediate: true },
)

const hasMoved = computed(() => Object.keys(offsets.value).length > 0)

/** An Epikey dropped after a drag: it stays where it was left, but never off screen. */
function onNodeDragStop({ node }) {
  const area = visibleArea(viewport.value, {
    container: size.value,
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
    margin: MARGIN,
  })
  const dropped = clampInto(node.position, area)
  const { home } = node.data
  const offset = { x: Math.round(dropped.x - home.x), y: Math.round(dropped.y - home.y) }

  const next = { ...offsets.value }
  if (offset.x || offset.y) next[node.id] = offset
  else delete next[node.id]
  saveOffsets(next)
}

/** The Map as drawn: it always fits the canvas, folding branches when it would be unreadable. */
const plan = computed(() =>
  planMap(props.tree, {
    container: size.value,
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
    preferHorizontal: Boolean(props.tree?.Horizontal),
    readableZoom: READABLE_ZOOM,
    margin: MARGIN,
    selectedId: props.selectedId,
    opened: opened.value,
    closed: closed.value,
    offsets: offsets.value,
  }),
)

function toggle(node) {
  const open = new Set(opened.value)
  const shut = new Set(closed.value)
  if (node.data.collapsed) {
    open.add(node.id)
    shut.delete(node.id)
  } else {
    shut.add(node.id)
    open.delete(node.id)
    // Folding a branch that holds the selection moves the selection to the folded Epikey.
    if (props.selectedId !== node.id && pathTo(props.tree, props.selectedId).includes(node.id)) {
      emit('select', node.id)
    }
  }
  opened.value = open
  closed.value = shut
}

const reducedMotion = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const paneReady = ref(false)

function fit() {
  if (!paneReady.value || !size.value.width) return
  setViewport(plan.value.viewport, { duration: reducedMotion ? 0 : 200 })
}

function onPaneReady() {
  paneReady.value = true
  fit()
}

// A change to what is drawn or to the space available brings the Map back into view.
// Dragging an Epikey does not: it is dropped inside the canvas, and nothing else moves.
watch(
  () =>
    [
      props.tree?.Id,
      plan.value.horizontal,
      size.value.width,
      size.value.height,
      plan.value.edges.map((edge) => edge.id).join(),
    ].join('|'),
  () => nextTick(fit),
)

function tidy() {
  saveOffsets({})
  nextTick(fit)
}

// Names are drawn larger as the Map shrinks, so they stay readable for longer.
const labelScale = computed(() =>
  Math.min(MAX_LABEL_SCALE, Math.max(1, READABLE_LABEL_PX / (HEX_SIZE * 0.15 * viewport.value.zoom))),
)
</script>

<template>
  <div ref="container" class="map" role="group" :aria-label="t('maps.canvasLabel')">
    <div v-if="background" class="map__bg" :style="{ backgroundImage: `url(&quot;${background}&quot;)` }">
      <div class="map__dim" :style="{ opacity: dim }" />
    </div>
    <VueFlow
      :id="FLOW_ID"
      :nodes="plan.nodes"
      :edges="plan.edges"
      :node-drag-threshold="4"
      :nodes-connectable="false"
      :elements-selectable="false"
      :nodes-focusable="false"
      :edges-focusable="false"
      :min-zoom="0.05"
      :max-zoom="2"
      @pane-ready="onPaneReady"
      @node-drag-stop="onNodeDragStop"
      @pane-click="emit('select', null)"
    >
      <Background v-if="!background" :gap="24" :size="1.5" />

      <template #node-epikey="node">
        <Handle type="target" :position="node.targetPosition" class="map__handle" />
        <button
          type="button"
          class="map__node"
          :title="node.data.key.Text"
          :aria-pressed="node.id === selectedId"
          @click="emit('select', node.id)"
        >
          <EpikeyHex
            :size="HEX_SIZE"
            :color="epikeyColorId(node.data.key.Color)"
            :label="node.data.key.Text ?? ''"
            :label-scale="labelScale"
            :selected="node.id === selectedId"
          />
        </button>
        <button
          v-if="node.data.childCount"
          type="button"
          class="map__toggle nodrag"
          :class="`map__toggle--${node.sourcePosition}`"
          :style="{ '--_scale': labelScale }"
          :aria-expanded="!node.data.collapsed"
          :aria-label="
            node.data.collapsed
              ? t('maps.expand', { n: node.data.hiddenCount, name: node.data.key.Text })
              : t('maps.collapse', { name: node.data.key.Text })
          "
          @click="toggle(node)"
        >
          <template v-if="node.data.collapsed">+{{ node.data.hiddenCount }}</template>
          <UiIcon v-else name="minus" :size="16" />
        </button>
        <Handle type="source" :position="node.sourcePosition" class="map__handle" />
      </template>

      <Panel position="bottom-right" class="map__controls">
        <button type="button" class="map__control" :aria-label="t('maps.zoomIn')" @click="zoomIn()">
          <UiIcon name="plus" />
        </button>
        <button type="button" class="map__control" :aria-label="t('maps.zoomOut')" @click="zoomOut()">
          <UiIcon name="minus" />
        </button>
        <button type="button" class="map__control" :aria-label="t('maps.fit')" @click="fit">
          <UiIcon name="fit" />
        </button>
        <button
          v-if="hasMoved"
          type="button"
          class="map__control"
          :aria-label="t('maps.tidy')"
          :title="t('maps.tidy')"
          @click="tidy"
        >
          <UiIcon name="reset" />
        </button>
      </Panel>

      <Panel v-if="plan.hidden || !plan.readable" position="bottom-left" class="map__note" role="status">
        {{ plan.readable ? t('maps.folded', plan.hidden) : t('maps.tooBig') }}
      </Panel>
    </VueFlow>
  </div>
</template>

<style scoped>
.map {
  position: relative;
  /* Vue Flow needs a container with explicit dimensions. */
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  border-radius: var(--map-radius);
  background: var(--map-bg);
}

/* The image behind the Map, darkened as much as the user asked. */
.map__bg,
.map__dim {
  position: absolute;
  inset: 0;
}

.map__bg {
  background-position: center;
  background-size: cover;
}

.map__dim {
  background: var(--map-dim);
}

.map__node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: v-bind('`${NODE_WIDTH}px`');
  height: v-bind('`${NODE_HEIGHT}px`');
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
  /* An Epikey can be dragged on a touch screen without the page scrolling under it. */
  touch-action: none;
}

.map :deep(.vue-flow__node.dragging) /* The image behind the Map, darkened as much as the user asked. */
.map__bg,
.map__dim {
  position: absolute;
  inset: 0;
}

.map__bg {
  background-position: center;
  background-size: cover;
}

.map__dim {
  background: var(--map-dim);
}

.map__node {
  cursor: grabbing;
}

.map__node:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--map-node-focus-radius);
}

/* Opens or folds the Epikeys under a node; sits where the lines leave it. */
.map__toggle {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--map-toggle-size);
  height: var(--map-toggle-size);
  padding: 0 var(--s-2);
  border: 0;
  border-radius: var(--map-toggle-radius);
  background: var(--map-toggle-bg);
  color: var(--map-toggle-fg);
  font: inherit;
  font-size: var(--fs-small);
  font-weight: var(--fw-bold);
  line-height: 1;
  cursor: pointer;
  pointer-events: all;
}

.map__toggle--bottom {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 35%) scale(var(--_scale));
}

.map__toggle--right {
  top: 50%;
  right: 0;
  transform: translate(35%, -50%) scale(var(--_scale));
}

.map__toggle:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.map__note {
  max-width: calc(100% - 4 * var(--tap) - var(--s-8) - var(--s-4));
  padding: var(--s-2) var(--s-3);
  border-radius: var(--map-control-radius);
  background: var(--map-control-bg);
  color: var(--fg-soft);
  font-size: var(--fs-small);
}

/* Handles only anchor the lines: Epikeys are not connected by hand. */
.map__handle {
  opacity: 0;
}

.map__controls {
  display: flex;
  gap: var(--s-1);
  padding: var(--s-1);
  border-radius: var(--map-control-radius);
  background: var(--map-control-bg);
}

.map__control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--tap);
  height: var(--tap);
  border: 0;
  border-radius: var(--map-control-radius);
  background: transparent;
  color: var(--map-control-fg);
  cursor: pointer;
}

.map__control:hover {
  background: var(--map-control-hover-bg);
}

.map__control:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

/* Vue Flow internals, dressed with our tokens. */
.map :deep(.vue-flow__edge-path) {
  stroke: var(--map-edge);
  stroke-width: var(--map-edge-width);
}

/* Siblings stacked in a column: a lighter, dashed line, unlike the parent-child ones. */
.map :deep(.map-edge--stack .vue-flow__edge-path) {
  stroke-dasharray: 2 6;
  stroke-linecap: round;
}

.map :deep(.vue-flow__background circle) {
  fill: var(--map-dot);
}
</style>
