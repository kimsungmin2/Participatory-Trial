import { Request } from 'express';

export interface IGuestRequest extends Request {
  id: number;
}
