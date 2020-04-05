import express = require("express");
import { getAuthMiddleware, customKeysAuth } from '../index';
import { rejects } from "assert";

const got = require('got');
const apiKey = 'd88e050c5dd6444f504c698dabf3d44de1b86d71';
const apiUser = 'root';

async function initExpress(port: number, authMiddleware: any) {
  return new Promise((resolse, reject) => {
    const app = express();

    app.use(authMiddleware);
    
    app.get('/', function (req: any, res: any) {
      res.send(req.auth);
    });

    app.use((handler: any, request: any, response: any, next: any) => {
      response.status(200).json(handler);
    });

    app.listen(port, () => { 
      resolse(app); 
    });
  });
}
function customAuth(customKey: string) {
  return customKeysAuth({
    keys: [customKey],
    onGet: async (result: any) => {
      result.authenticated = true;
    },
    onFail: (error: any) => {
      return {
        authenticated: false,
        error,
      }
    }
  });
}

test('singleAuthType', async () => {
  const app: any = await initExpress(3101, customKeysAuth({
    keys: ['api-key'],
    onGet: async (result: any) => {
      result.authenticated = true;
    },
    onFail: (error: any) => {
      return {
        authenticated: false,
        error,
      }
    }
  }));

  let response = await got('http://localhost:3101/', { headers: { 'api-key': apiKey } });
  let result = JSON.parse(response.body);
  expect(result.authenticated).toBe(true);
  expect(result.apiKey).toBe(apiKey);

  response = await got('http://localhost:3101/');
  result = JSON.parse(response.body);
  expect(result.authenticated).toBe(false);
});

test('multipleAuthType', async () => {
  const app: any = await initExpress(3102, getAuthMiddleware({
    authTypes: [
      customKeysAuth({
        keys: ['api-key'],
        onGet: async (result: any) => {
          result.authenticated = true;
        }
      }),
      customKeysAuth({
        keys: ['api-user'],
        onGet: async (result: any) => {
          result.authenticated = true;
        }
      })
    ],
    onFail: (error: any) => {
      return {
        authenticated: false,
        error,
      }
    }
  }));

  let response = await got('http://localhost:3102/', { headers: { 'api-key': apiKey } });
  let result = JSON.parse(response.body);
  expect(result.authenticated).toBe(true);
  expect(result.apiKey).toBe(apiKey);

  response = await got('http://localhost:3102/', { headers: { 'api-user': apiUser } });
  result = JSON.parse(response.body);
  expect(result.authenticated).toBe(true);
  expect(result.apiUser).toBe(apiUser);

  response = await got('http://localhost:3102/');
  result = JSON.parse(response.body);
  expect(result.authenticated).toBe(false);
});