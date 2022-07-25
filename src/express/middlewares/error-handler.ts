import { Request, Response, NextFunction } from 'express';
import { BucketPolicyError, ObjectNotFoundError } from '../../errors';

export default (err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ObjectNotFoundError) {
    return res
      .status(404)
      .send({ error: `File not found: ${req.path}` });
  }

  if (err instanceof BucketPolicyError) {
    return res
      .status(400)
      .send({ error: err.message });
  }

  return res.status(500).send(err.message);
};
