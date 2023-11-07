export interface ObjectMeta {
  name: string
  contentType: string

  ctime?: Date
  mtime?: Date
  contentLength?: number
  etag?: string

  [key: string]: any
}

