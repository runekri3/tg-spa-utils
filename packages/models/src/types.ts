import { Resource } from '@tg-resources/core';
import { Kwargs } from '@thorgate/create-resource-saga';
import { createDetailSchemaSelector, createSchemaSelector, NormalizedFetchOptions } from '@thorgate/spa-entities';
import { CreateFormSaveSagaOptions } from '@thorgate/spa-forms';
import { Omit } from '@thorgate/spa-is';
import { schema } from 'normalizr';


export interface Selectors {
    list: ReturnType<typeof createSchemaSelector>;
    detail: ReturnType<typeof createDetailSchemaSelector>;
}


export interface ModelOptions<
    K extends string,
    TL extends string,
    TD extends string,
    Data,
    Klass extends Resource,
    KW extends Kwargs<KW> = {},
    Params extends Kwargs<Params> = {},
> {
    key: K;

    listAction: TL;
    detailAction: TD;

    schema: schema.Entity;

    resource: Klass;
    detailResource: Klass;

    fetchOptions?: Omit<NormalizedFetchOptions<K, TL, Klass, KW>, 'listSchema' | 'key' | 'resource'>;
    saveOptions: Omit<CreateFormSaveSagaOptions<TD, Data, Klass, KW>, 'resource'>;
}
