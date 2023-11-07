export * from '@enspirit/seshat-commons'

import { ObjectMeta } from "@enspirit/seshat-commons";

export interface Object {
  meta: ObjectMeta
  body: Buffer;
}

export type ListOptions = {
  recursive?: boolean
}

