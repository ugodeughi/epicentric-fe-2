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

const props = defineProps({
  /** Map to draw: an Epikey with its subtree (schemas/key.js). */
  tree: { type: Object, default: null },
  /** Id of the selected Epikey. */
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select'])

const { t } = useI18n()
const { fitView, zoomIn, zoomOut } = useVueFlow(FLOW_ID)

const graph = computed(() =>
  layoutMap(props.tree, {
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
    horizontal: Boolean(props.tree?.Horizontal),
  }),
)

const reducedMotion = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function fit() {
  fitView({ padding: 0.2, maxZoom: 1, duration: reducedMotion ? 0 : 200 })
}

// A different Map, or an Epikey added or removed: bring the whole tree back into view.
watch(
  () => [props.tree?.Id, graph.value.nodes.length],
  () => nextTick(fit),
)

// Same when the canvas changes size (window resized, phone rotated).
const container = ref(null)
let resizeTimer
let observer
onMounted(() => {
  observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(fit, 150)
  })
  observer.observe(container.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(resizeTimer)
})
</script>

<template>
  <div ref="container" class="map" role="group" :aria-label="t('maps.canvasLabel')">
    <VueFlow
      :id="FLOW_ID"
      :nodes="graph.nodes"
      :edges="graph.edges"
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
      :nodes-focusable="false"
      :edges-focusable="false"
      :min-zoom="0.2"
      :max-zoom="2"
      fit-view-on-init
      @pane-ready="fit"
      @pane-click="emit('select', null)"
    >
      <Background :gap="24" :size="1.5" />

      <template #node-epikey="node">
        <Handle type="target" :position="node.targetPosition" class="map__handle" />
        <button
          type="button"
          class="map__node"
          :aria-pressed="node.id === selectedId"
          @click="emit('select', node.id)"
        >
          <EpikeyHex
            :size="HEX_SIZE"
            :color="epikeyColorId(node.data.key.Color)"
            :label="node.data.key.Text ?? ''"
            :selected="node.id === selectedId"
          />
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
      </Panel>
    </VueFlow>
  </div>
</template>

<style scoped>
.map {
  /* Vue Flow needs a container with explicit dimensions. */
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  border-radius: var(--map-radius);
  background: var(--map-bg);
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
  cursor: pointer;
  /* Vue Flow turns pointer events off on nodes that are neither draggable nor selectable. */
  pointer-events: all;
}

.map__node:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--map-node-focus-radius);
}

/* Handles only anchor the lines: Epikeys are not connected by hand. */
.map__handle {
  opacity: 0;
}

.map__controls {
  display: flex;
  flex-direction: column;
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

.map :deep(.vue-flow__background circle) {
  fill: var(--map-dot);
}
</style>
