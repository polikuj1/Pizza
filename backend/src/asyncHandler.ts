import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function ah(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}
