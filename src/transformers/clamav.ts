import temp from 'temp';
import NodeClam, { Options as ClamScanInitOptions } from 'clamscan';
import { PassThrough, Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerMode, ObjectTransformerOutput, ObjectTransformerType } from '../types';
import { unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { VirusDetectedError } from '../errors';

export class ClamavScanner implements ObjectTransformer {

  type: ObjectTransformerType = 'Duplex';

  clam: NodeClam;

  constructor(options?: ClamScanInitOptions) {
    this.clam = new NodeClam();

    this.clam.init({
      clamdscan: {
        host: 'clamav',
        port: 3310,
        ...options?.clamdscan,
      },
      ...options,
    });
  }

  async transform(stream: Readable, meta: ObjectMeta, _mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    const futureStream = new PassThrough();

    const tmpFileWriteStream = temp.createWriteStream();
    const av = this.clam.passthrough();
    stream.pipe(av).pipe(tmpFileWriteStream);

    const deleteTmp = async () => {
      await unlink(tmpFileWriteStream.path);
    };

    av.on('scan-complete', async (result) => {
      if (result.isInfected) {
        await deleteTmp();
        return futureStream.emit('error', new VirusDetectedError(`Virus detected: ${result.viruses.join(', ')}`));
      }

      const tmpFileReadStream = createReadStream(tmpFileWriteStream.path);
      tmpFileReadStream.pipe(futureStream);
      futureStream.on('finish', deleteTmp);
    });

    return { meta, stream: futureStream };
  }

}
