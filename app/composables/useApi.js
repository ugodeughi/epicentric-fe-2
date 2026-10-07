/** Typed API modules (services/api). Components never call these: composables do. */
export function useApi() {
  return useNuxtApp().$api
}
