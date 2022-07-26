import sharp from 'sharp';
import mime from 'mime-types';
import path from 'path';
import { Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerMode, ObjectTransformerOutput, ObjectTransformerType } from '../types';

export interface SharpOptions {
  output: {
    format: keyof sharp.FormatEnum,
    options?: sharp.OutputOptions | sharp.JpegOptions | sharp.PngOptions | sharp.WebpOptions | sharp.AvifOptions | sharp.HeifOptions | sharp.GifOptions | sharp.TiffOptions | undefined,
  },
  resize?: {
    width?: number,
    height?: number,
    options?: sharp.ResizeOptions
  },
}

export class SharpTransformer implements ObjectTransformer {

  constructor(private options: SharpOptions, public type: ObjectTransformerType = 'Ingress') {
  }

  async transform(stream: Readable, meta: ObjectMeta, _mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    const { output, resize } = this.options;
    const fileinfo = path.parse(meta.name);

    const transformer = sharp();
    if (resize) {
      transformer.resize(resize.width, resize.height, resize.options);
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
