import useLocalStorageState from 'use-local-storage-state'

export function useAllergens() {
  return useLocalStorageState('showAllergens', { defaultValue: false })
}