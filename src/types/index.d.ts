import { SeshatRequest } from '../types';

export {};

declare global {
  namespace Express {
    interface Request {
      isSeshatProtocol: boolean
      seshat: SeshatRequest
    }
  }
}
