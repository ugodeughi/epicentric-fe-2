/**
 * True once Vue owns the page. Server-rendered forms keep their submit button disabled
 * until then: an earlier click would submit the form natively.
 */
export function useHydrated() {
  const hydrated = ref(false)
  onMounted(() => {
    hydrated.value = true
  })
  return hydrated
}
