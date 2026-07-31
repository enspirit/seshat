import sharp from 'sharp';
// Under verbatimModuleSyntax the default import is a value binding only, so the
// `sharp.X` type namespace is no longer in scope; the types come in by name.
import type {
  AvifOptions, FormatEnum, GifOptions, HeifOptions, JpegOptions, OutputOptions,
  PngOptions, Region, ResizeOptions, TiffOptions, WebpOptions, WriteableMetadata,
} from 'sharp';
import mime from 'mime-types';
import path from 'path';
import { Readable } from 'stream';
import { type SeshatObjectMeta, type ObjectTransformer, type ObjectTransformerMode, type ObjectTransformerOutput, type ObjectTransformerType } from '../types.js';

export interface SharpOptions {
  output: {
    format: keyof FormatEnum,
    options?: OutputOptions | JpegOptions | PngOptions | WebpOptions | AvifOptions | HeifOptions | GifOptions | TiffOptions | undefined,
  },
  resize?: {
    width?: number,
    height?: number,
    options?: ResizeOptions
  },
  extract?: Region,
  withMetadata?: boolean | WriteableMetadata
}

export class SharpTransformer implements ObjectTransformer {

  constructor(private options: SharpOptions, public type: ObjectTransformerType = 'Ingress') {
  }

  async transform(stream: Readable, meta: SeshatObjectMeta, _mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    const { output, resize, extract, withMetadata } = this.options;
    const fileinfo = path.parse(meta.name);

    const transformer = sharp();
    if (extract) {
      transformer.extract(extract);
    }
    if (resize) {
      transformer.resize(resize.width, resize.height, resize.options);
    }
    if (withMetadata) {
      if (withMetadata === true) {
        // we reuse the existing metadata of the image
        transformer.withMetadata();
      } else {
        // object case, metadata can be passed explicitely
        transformer.withMetadata(withMetadata);
      }
    }
    transformer.toFormat(output.format, output.options);

    const filename = `${fileinfo.name}.${output.format}`;
    const objectName = fileinfo.dir ? path.join(fileinfo.dir, filename) : filename;

    const newMeta = {
      ...meta,
      contentType: mime.lookup(output.format) || 'application/octet-stream',
      name: objectName,
    };
    // It's a streaming transformation, we cannot know the final size
    delete newMeta.contentLength;

    stream.pipe(transformer);

    return { meta: newMeta, stream: transformer };
  }

}
