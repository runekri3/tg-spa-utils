import { Resource } from '@tg-resources/core';
import { ActionPayload, Kwargs } from '@thorgate/create-resource-saga';
import {
    createDetailSchemaSelector, createFetchAction, createFetchSaga, createSchemaSelector, FetchAction, FetchSaga
} from '@thorgate/spa-entities';
import { createFormSaveSaga, createSaveAction, SaveAction, SaveMeta, SaveSaga } from '@thorgate/spa-forms';
import { schema } from 'normalizr';
import { match } from 'react-router';
import { Store } from 'redux';
// import { SagaMiddleware } from 'redux-saga';
import { call, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { ModelOptions, Selectors } from './types';


export class Model<
    K extends string,
    TL extends string,
    TD extends string,
    Data,
    Klass extends Resource,
    KW extends Kwargs<KW> = {},
    Params extends Kwargs<Params> = {},
> {
    public static registerStore(store: Store) {
    // public static registerStore(store: Store, sagaMiddleware: SagaMiddleware) {
        Model.store = store;
        // Model.sagaMiddleware = sagaMiddleware;
    }

    public readonly schema: schema.Entity;
    public readonly key: K;
    public readonly selectors: Selectors;
    public readonly fetchListAction: FetchAction<TL, KW, Data>;
    public readonly fetchListSaga: FetchSaga<TL, KW, Params, Data>;
    public readonly saveAction: SaveAction<TD, Data, KW>;
    public readonly saveSaga: SaveSaga<TD, Data, KW, Params>;

    public constructor(options: ModelOptions<K, TL, TD, Data, Klass, KW, Params>) {
        const {
            fetchOptions = {},
            saveOptions,
        } = options;

        this.key = options.key;
        this.schema = options.schema;

        this.fetchListAction = createFetchAction(options.listAction);
        this.fetchListSaga = createFetchSaga({
            ...fetchOptions,

            key: this.schema.key,
            resource: options.resource,
            listSchema: [this.schema],
        });

        this.selectors = {
            list: createSchemaSelector(this.schema),
            detail: createDetailSchemaSelector(this.schema),
        };

        this.saveAction = createSaveAction(options.detailAction);
        this.saveSaga = createFormSaveSaga({
            ...saveOptions,

            resource: options.detailResource || options.resource,
        });

        this.fetchList = this.fetchList.bind(this);
        this.asFetchListWatcher = this.asFetchListWatcher.bind(this);
        this.asFetchDetailsWatcher = this.asFetchDetailsWatcher.bind(this);
        this.asSaveWatcher = this.asSaveWatcher.bind(this);
    }

    private static store: Store;
    // private static sagaMiddleware: SagaMiddleware;

    public * fetchList(matchObj: match<Params> | null = null) {
        yield call(this.fetchListSaga, matchObj, this.fetchListAction({}));
    }

    public * asFetchListWatcher() {
        yield takeLatest(getType(this.fetchListAction), this.fetchListSaga, null);
    }

    public * asFetchDetailsWatcher() {
        yield takeLatest(getType(this.fetchListAction), this.fetchListSaga, null);
    }

    public * asSaveWatcher() {
        yield takeLatest(getType(this.saveAction), this.saveSaga, null);
    }

    public list = (ids: Array<string | number> = []) => this.selectors.list(Model.store.getState(), ids);
    public get = (id: string | number) => this.selectors.detail(Model.store.getState(), id);

    public update = (payload: ActionPayload<KW, Data>, meta: SaveMeta<Data>) => {
        Model.store.dispatch(this.saveAction(payload, meta));
    };
}
