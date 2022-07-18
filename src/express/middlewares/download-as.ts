import { NextFunction, Request, Response } from "express"

export interface DownloadAsOptions {
  queryParam: string
}

const DefaultOptions: DownloadAsOptions = {
  queryParam: 'n',
}

export default function downloadAs(opts: DownloadAsOptions = DefaultOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.query[opts.queryParam]) {
      res.setHeader('Content-Disposition', `attachment; filename=${req.query[opts.queryParam]}`)
    }
    next();
  }
}