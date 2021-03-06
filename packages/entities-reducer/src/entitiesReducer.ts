import { ActionType, createAction, getType } from 'typesafe-actions';

import {
    EntitiesIdsPayload,
    EntitiesMeta,
    EntitiesRootState,
    EntitiesState,
    EntitiesStatusPayload,
    EntityKeyPayload,
    EntityStatus,
    SetEntitiesPayload
} from './types';


const defaultActionMeta: EntitiesMeta = {
    preserveExisting: true,
    mergeEntities: false,
    preserveOrder: false,
    updateOrder: false,
    clearArchived: true,
};

export const entitiesActions = {
    setEntities: createAction('@@tg-spa-entities/SET_ENTITIES', (resolve) => (
        (payload: SetEntitiesPayload, meta: EntitiesMeta = {}) => {
            return resolve(payload, { ...defaultActionMeta, ...meta });
        }
    )),

    setEntitiesStatus: createAction('@@tg-spa-entities/SET_ENTITIES_STATUS', (resolve) => (
        (payload: EntitiesStatusPayload) => resolve(payload)
    )),

    markArchived: createAction('@@tg-spa-entities/MARK_ARCHIVED', (resolve) => (
        (payload: EntitiesIdsPayload) => resolve(payload)
    )),

    markActive: createAction('@@tg-spa-entities/MARK_ACTIVE', (resolve) => (
        (payload: EntitiesIdsPayload) => resolve(payload)
    )),

    purgeOrder: createAction('@@tg-spa-entities/PURGE_ORDER', (resolve) => (
        (payload: EntityKeyPayload) => resolve(payload)
    )),

    purgeEntities: createAction('@@tg-spa-entities/PURGE_ENTITIES', (resolve) => (
        (payload: EntitiesIdsPayload) => resolve(payload)
    )),

    clearEntities: createAction('@@tg-spa-entities/CLEAR_ENTITIES'),
};

export type EntitiesAction = ActionType<typeof entitiesActions>;


const selectEntities = (state: EntitiesState) => state.data;
const selectEntityType = (state: EntitiesState, key: string) => selectEntities(state)[key] || {};

const selectOrder = (state: EntitiesState) => state.order;
const selectEntityOrder = (state: EntitiesState, key: string): Array<string | number> => selectOrder(state)[key] || [];

const selectArchived = (state: EntitiesState) => state.archived;
const selectArchivedEntities = (state: EntitiesState, key: string): Array<string | number> => selectArchived(state)[key] || [];

const selectStatuses = (state: EntitiesState) => state.status;
const selectEntitiesStatus = (state: EntitiesState, key: string) => selectStatuses(state)[key] || EntityStatus.NotLoaded;


const initialState: EntitiesState = {
    data: {},
    order: {},
    archived: {},
    status: {},
};


export const entitiesReducer = (state: EntitiesState = initialState, action: EntitiesAction) => {
    switch (action.type) {
        case getType(entitiesActions.setEntities): {
            const { meta, payload } = action;

            const nextState = {
                ...state,
            };

            let nextOrder: Array<string | number>;
            if (meta && meta.preserveOrder) {
                nextOrder = selectEntityOrder(state, payload.key);
            } else if (meta && meta.updateOrder) {
                nextOrder = [...selectEntityOrder(state, payload.key)];

                if (Array.isArray(payload.order)) {
                    payload.order.forEach((id) => {
                        if (!nextOrder.includes(id)) {
                            nextOrder.push(id);
                        }
                    });
                } else {
                    if (!nextOrder.includes(payload.order)) {
                        nextOrder.push(payload.order);
                    }
                }
            } else if (Array.isArray(payload.order)) {
                nextOrder = payload.order;
            } else {
                nextOrder = [payload.order];
            }

            // Update order
            nextState.order = {
                ...nextState.order,

                [payload.key]: nextOrder,
            };

            // Create new object - will see later what would be the performance impact
            nextState.data = { ...nextState.data };

            Object.entries(payload.entities).forEach(([key, entities]) => {
                if (meta && !meta.preserveExisting) {
                    nextState.data[key] = entities;
                    return;
                }

                nextState.data[key] = Object.entries(entities).reduce((last, [entityId, entity]) => {
                    let newEntity = entity;

                    if (meta && meta.mergeEntities) {
                        const oldEntity = last[entityId] || {};
                        newEntity = { ...oldEntity, ...newEntity };
                    }

                    return {
                        ...last,
                        [entityId]: newEntity,
                    };
                }, nextState.data[key] || {});
            });

            if (meta && meta.clearArchived) {
                nextState.archived = {
                    ...nextState.archived,

                    [payload.key]: [],
                };
            }

            return nextState;
        }

        case getType(entitiesActions.setEntitiesStatus):
            return Object.assign({}, state, {
                status: Object.assign({}, state.status, { [action.payload.key]: action.payload.status }),
            });

        case getType(entitiesActions.markArchived):
            return Object.assign({}, state, {
                archived: Object.assign({}, state.archived, {
                    [action.payload.key]: action.payload.ids,
                })
            });

        case getType(entitiesActions.markActive):
            return Object.assign({}, state, {
                archived: Object.assign({}, state.archived, {
                    [action.payload.key]: (
                        selectArchivedEntities(state, action.payload.key).filter((id) => !action.payload.ids.includes(id))
                    ),
                })
            });

        case getType(entitiesActions.purgeEntities): {
            const nextData = { ...selectEntityType(state, action.payload.key) };

            action.payload.ids.forEach((id) => {
                if (nextData[id]) {
                    delete nextData[id];
                }
            });

            return Object.assign({}, state, {
                order: Object.assign({}, state.order, {
                    [action.payload.key]: (
                        selectEntityOrder(state, action.payload.key).filter((id) => !action.payload.ids.includes(id))
                    ),
                }),

                data: Object.assign({}, state.data, { [action.payload.key]: nextData }),
            });
        }

        case getType(entitiesActions.purgeOrder):
            return Object.assign({}, state, {
                order: Object.assign({}, state.order, { [action.payload.key]: [] }),
            });

        case getType(entitiesActions.clearEntities):
            return initialState;

        default:
            return state;
    }
};


/**
 * Select entities root state.
 */
const selectEntitiesRoot = <S extends EntitiesRootState>(state: S) => state.entities;


export const entitiesSelectors = {
    selectEntitiesRoot,

    /**
     * Select entities data.
     * @param state
     */
    selectEntities: <S extends EntitiesRootState>(state: S) => selectEntities(selectEntitiesRoot(state)),

    /**
     * Select specific entity type.
     * @param state
     * @param key
     */
    selectEntityType: <S extends EntitiesRootState>(state: S, key: string) => selectEntityType(selectEntitiesRoot(state), key),

    /**
     * Select entities order.
     * @param state
     */
    selectOrder: <S extends EntitiesRootState>(state: S) => selectOrder(selectEntitiesRoot(state)),

    /**
     * Select specific entity order.
     * @param state
     * @param key
     */
    selectEntityOrder: <S extends EntitiesRootState>(state: S, key: string) => selectEntityOrder(selectEntitiesRoot(state), key),

    /**
     * Select entities archive.
     * @param state
     */
    selectArchived: <S extends EntitiesRootState>(state: S) => selectArchived(selectEntitiesRoot(state)),

    /**
     * Select specific archived entity order.
     * @param state
     * @param key
     */
    selectArchivedEntities: <S extends EntitiesRootState>(state: S, key: string) => selectArchivedEntities(selectEntitiesRoot(state), key),

    /**
     * Select entities statuses.
     * @param state
     */
    selectStatuses: <S extends EntitiesRootState>(state: S) => selectStatuses(selectEntitiesRoot(state)),

    /**
     * Select specific entity status.
     * @param state
     * @param key
     */
    selectEntitiesStatus: <S extends EntitiesRootState>(state: S, key: string) => selectEntitiesStatus(selectEntitiesRoot(state), key),
};
