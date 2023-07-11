import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { QueryFailedError } from 'typeorm';
import { IApiErrors } from '../types/error';
import ApiError from '../utils/api-error';
import logger from '../utils/winston';

function errorHandlingMiddleWare(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Logging Error
  logger.error(err);
  console.log(err);

  // API Error
  if (err instanceof ApiError) {
    return res.status(err.code).json({ status: err.code, message: err.message });
  }

  // JOI Error
  if (err instanceof Joi.ValidationError) {
    type Obj = {
      label:string | number,
      msg:string
    };
    const error:Array<Obj> = [];
    err.details.forEach((e) => {
      const data = {
        label: e.path[0],
        msg: e.message,
      };
      error.push(data);
    });
    return res.status(422).json({ status: 422, message: 'Validation Error', errors: error });
  }

  // ORM errors
  if (err instanceof QueryFailedError) {
    // Check if duplicate error
    if (err.driverError.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 400, message: 'Duplicate Entry' });
    }

    if (err.driverError.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      return res.status(400).json({ status: 400, message: 'Missing Fields in Request' });
    }
  }

  // Send Internal Sever Error
  return res.status(500).json({ status: 500, message: IApiErrors.INTERNAL_SERVER_ERROR });
}

export default errorHandlingMiddleWare;
