import { Aura } from './aura';
import { NextFunction, Request, Response } from 'express';
import { AuraConfig } from './aura.config';

export const verifyAuraIsAvailable = async (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  const cosmos = Aura.getInstance(AuraConfig.config.network.name);
  if (!cosmos.ready()) {
    await cosmos.init();
  }
  return next();
};
