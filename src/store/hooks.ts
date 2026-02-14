import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from './index'

/**
 * Typed version of useDispatch for the Lain Redux store.
 * Use this instead of plain `useDispatch` for correct action typing.
 *
 * @example
 *   const dispatch = useAppDispatch()
 *   dispatch(setViewMode('grid'))
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

/**
 * Typed version of useSelector for the Lain Redux store.
 * Use this instead of plain `useSelector` for correct state typing.
 *
 * @example
 *   const viewMode = useAppSelector(state => state.ui.viewMode)
 *   const query = useAppSelector(state => state.search.query)
 */
export const useAppSelector = useSelector.withTypes<RootState>()
