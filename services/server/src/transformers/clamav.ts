import temp from 'temp';
import NodeClam, { Options as ClamScanInitOptions } from 'clamscan';
import { PassThrough, Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerMode, ObjectTransformerOutput, ObjectTransformerType } from '../types';
import { unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { VirusDetectedError } from '@enspirit/seshat-commons';

export class ClamavScanner implements ObjectTransformer {

  type: ObjectTransformerType = 'Duplex';
  clam: NodeClam;
  initialized: boolean = false;

  constructor(protected options?: ClamScanInitOptions) {
    this.clam = new NodeClam();
  }

  async ensureInitialized() {
    if (this.initialized) {
      return;
    }
    await this.clam.init({
      clamdscan: {
        host: 'clamav',
        port: 3310,
        ...this.options?.clamdscan,
      },
      ...this.options,
    });
  }

  async transform(stream: Readable, meta: ObjectMeta, _mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    await this.ensureInitialized();

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
        futureStream.emit('error', new VirusDetectedError(`Virus detected: ${result.viruses.join(', ')}`));
        return;
      }

      const tmpFileReadStream = createReadStream(tmpFileWriteStream.path);
      tmpFileReadStream.pipe(futureStream);
      futureStream.on('finish', deleteTmp);
    });

    return { meta, stream: futureStream };
  }

}
