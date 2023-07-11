import {
  NextFunction, Request, Response, Router,
} from 'express';
import querystring from 'querystring';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';
import logger from '../../../utils/winston';
import ApiError from '../../../utils/api-error';

const router = Router();
dotenv.config();

function base64UrlEncodeWithoutPadding(arg: Buffer): string {
  let encoded = Buffer.from(arg).toString('base64');
  encoded = encoded.replace(/=/g, '');
  encoded = encoded.replace(/\+/g, '-');
  encoded = encoded.replace(/\//g, '_');
  return encoded;
}

function generateCodeChallenge(codeVerifier: string): string {
  const hash = createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64UrlEncodeWithoutPadding(hash);
  return codeChallenge;
}

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let randomString = '';
  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}

const codeVerifier = generateRandomString(43);

router.get('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = 'randommessagetopass';
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const redirectUri = 'http://localhost:3000/v1/digilocker/auth/callback';
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const query = querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    res.redirect(`https://api.digitallocker.gov.in/public/oauth2/1/authorize?${query}`);
  } catch (e) {
    logger.error(e);
    next(e);
  }
});

router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string || null;
    const state = req.query.state as string || null;
    if (code === null || state === null) return next(ApiError.unAuthorized());

    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;

    const axioxTokenConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.digitallocker.gov.in/public/oauth2/1/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'http://localhost:3000/v1/digilocker/auth/callback',
        code_verifier: codeVerifier,
      },
    };

    const response = await axios.request(axioxTokenConfig);
    return res.status(200).json({ status: 200, data: response.data });
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

export default router;
