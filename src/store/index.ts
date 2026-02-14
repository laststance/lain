import { createStorageMiddleware } from '@laststance/redux-storage-middleware'
import { combineReducers, configureStore } from '@reduxjs/toolkit'

import { api } from './api/emptyApi'
import { dialogSlice } from './slices/dialogSlice'
import { searchSlice } from './slices/searchSlice'
import { settingsSlice } from './slices/settingsSlice'
import { uiSlice } from './slices/uiSlice'

/**
 * Root reducer combining all slices and RTK Query API.
 */
const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  ui: uiSlice.reducer,
  search: searchSlice.reducer,
  dialog: dialogSlice.reducer,
  settings: settingsSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

/**
 * Storage middleware for localStorage persistence.
 * Persists: ui (viewMode, sidebarWidth, collectionViewModes),
 *           search (recentSearches), settings (shortcuts, theme, defaultViewMode).
 * Does NOT persist: RTK Query cache, dialog states, selectedCollectionId.
 */
const {
  middleware: storageMiddleware,
  reducer,
  api: storageApi,
} = createStorageMiddleware<RootState>({
  rootReducer,
  key: 'lain-state',
  slices: ['ui', 'search', 'settings'],
})

/**
 * Redux store configured with RTK Query middleware and storage persistence.
 *
 * @example
 *   // In App.tsx
 *   <Provider store={store}>
 *     <App />
 *   </Provider>
 *
 *   // In components
 *   const dispatch = useAppDispatch()
 *   const viewMode = useAppSelector(state => state.ui.viewMode)
 */
export const store = configureStore({
  reducer,
  middleware: (getDefault) =>
    getDefault().concat(api.middleware, storageMiddleware),
})

export type AppDispatch = typeof store.dispatch
export { storageApi }
