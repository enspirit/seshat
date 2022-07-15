import SeshatObject from './object';
import { Readable } from 'stream';
export default abstract class AbstractBucket {
  abstract exists(path: string): Promise<boolean>;
  abstract fileExists(path: string): Promise<boolean>;
  abstract dirExists(path: string): Promise<boolean>;

  abstract get(path: string): Promise<SeshatObject>;
  abstract put(path: string, stream: Readable): Promise<SeshatObject>;
  abstract delete(path: string): Promise<void>;
  abstract list(prefix?: string): Promise<SeshatObject[]>;
}
