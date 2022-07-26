import sharp from 'sharp';
import mime from 'mime-types';
import path from 'path';
import { Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerOutput, ObjectTransformerType } from '../types';

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

  type: ObjectTransformerType = 'Ingress';

  constructor(private options: SharpOptions) {
  }

  async transform(stream: Readable, meta: ObjectMeta): Promise<ObjectTransformerOutput> {
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
    stream.pipe(transformer);
    return { meta: newMeta, stream: transformer };
  }

}
