import {
  NextFunction, Request, Response, Router,
} from 'express';
import querystring from 'querystring';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';
import * as fs from 'fs';
import logger from '../../../utils/winston';
import ApiError from '../../../utils/api-error';

const router = Router();
dotenv.config();

let accessToken = ''; // Dummy token for testing

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

function base64SaveImage(base64String: string, filePath: string) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
}

// Generate a code verifier
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

    console.log('Response', response);

    accessToken = response.data.access_token;

    console.log('Access Token', accessToken);
    return res.status(200).json({ status: 200, data: response.data });
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!accessToken) return next(ApiError.unAuthorized());

    console.log('Access Token', accessToken);

    const axioxProfileConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://digilocker.meripehchaan.gov.in/public/oauth2/2/user',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await axios.request(axioxProfileConfig);
    console.log('Response', response);

    if (response.data && response.data.picture) {
      console.log('Saving image');
      base64SaveImage(response.data.picture, `${response.data.digilockerid}.jpeg`);
    }
    return res.status(200).json({ status: 200, data: response.data });
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

router.get('/list-issued-files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!accessToken) return next(ApiError.unAuthorized());

    console.log('Access Token', accessToken);

    const axioxListFilesConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.digitallocker.gov.in/public/oauth2/2/files/issued',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await axios.request(axioxListFilesConfig);
    console.log('Response', response);

    return res.status(200).json({ status: 200, data: response.data });
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

router.get('/download-file/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!accessToken) return next(ApiError.unAuthorized());

    const { fileId } = req.params;
    if (!fileId) return next(ApiError.badRequest());

    console.log('Access Token', accessToken);

    const axioxDownloadFileConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.digitallocker.gov.in/public/oauth2/1/file/${fileId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'arraybuffer' as const,
    };

    const response = await axios.request(axioxDownloadFileConfig);
    console.log('Response', response);

    res.setHeader('Content-Disposition', `attachment; filename=${fileId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    // Save Pdf file locally
    fs.writeFileSync(`${fileId}.pdf`, response.data);

    return res.status(200).send(response.data);
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

router.get('/certificate-xml/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!accessToken) return next(ApiError.unAuthorized());

    const { fileId } = req.params;
    if (!fileId) return next(ApiError.badRequest());

    console.log('Access Token', accessToken);

    const axioxCertificateXmlConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.digitallocker.gov.in/public/oauth2/1/xml/${fileId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await axios.request(axioxCertificateXmlConfig);
    console.log('Response', response);

    return res.status(200).json({ status: 200, data: response.data });
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

router.get('/aadhar-card-xml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!accessToken) return next(ApiError.unAuthorized());

    console.log('Access Token', accessToken);

    const axioxAadharCardConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.digitallocker.gov.in/public/oauth2/1/xml/eaadhaar',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await axios.request(axioxAadharCardConfig);
    console.log('Response', response);

    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

router.get('/aapar-xml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!accessToken) return next(ApiError.unAuthorized());

    console.log('Access Token', accessToken);

    const axioxAaparConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.digitallocker.gov.in/public/oauth2/3/xml/aapar',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await axios.request(axioxAaparConfig);
    console.log('Response', response);

    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (e) {
    logger.error(e);
    return next(e);
  }
});

export default router;
