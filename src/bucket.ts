import SeshatObject from './object';
export default abstract class AbstractBucket {

  abstract exists(path: string): Promise<boolean>;
  abstract fileExists(path: string): Promise<boolean>;
  abstract dirExists(path: string): Promise<boolean>;

  abstract get(path: string): Promise<SeshatObject>;

  abstract list(prefix?: string): Promise<SeshatObject[]>;
}
