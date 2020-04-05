# get-auth-middleware

This package allows you to easily implement authentication in your API, you can use one or more authentication methods, see the examples below

## Install

```
npm i get-auth-middleware@latest --save
```

## Examples

### Example 01 - Firebase Authentication

To use authentication with firebase, you need to send the following key in the request header:

```
const token: string = 'user-firebase-auth-token';
{ 'authorization': 'Bearer ' + token }
```

And below you will have the example of how to obtain authentication

```typescript
import * as admin from 'firebase-admin';
import { firebaseAuth } from 'get-auth-middleware';

const firebaseApp: admin.app.App = admin.initializeApp({
   /// initilize options
});

app.use(firebaseAuth({	
   firebaseAuth: firebaseApp.auth(),	
   loadUserRecord: true, // to get the `firebaseUser` in `onGet` method
   onGet: async (result: any) => {	
      result.user = await UserModel.getByUid(result.decodedIdToken.uid);	
   }
   onFail: (error: any) => {
      // you can return a custom error, and if you return null the error will be ignored
      if (error.error) {	
            return error.error;	
      }
      return null	
   }
}))
```

In the `onGet` method, you will receive an object with the following structure:

```typescript
{
   token: string // token passed in the request header
   decodedIdToken: admin.auth.DecodedIdToken // decoded token (object structure: https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken)
   firebaseUser: admin.auth.UserRecord // only if `loadUserRecord` to be true (object structure: https://firebase.google.com/docs/reference/admin/node/admin.auth.UserRecord)
}
```

And in `onFail` the object will have the following structure:

```typescript
{
   error: any // it will only be informed if there is an error in the code execution.
   message: string // a message will be returned if there is no error and the request header does not have the necessary keys for authentication
}
```

### Example 02 - Custom Keys Auth

```typescript
import { customKeysAuth } from 'get-auth-middleware';

app.use(customKeysAuth({	
      keys: ['api-token', 'api-key'],	
      onGet: async (result: any) => {	
         result.user = await UserModel.getByToken(result.apiToken, result.apiKey);	
      },
      onFail: (error: any) => {
         // you can return a custom error, and if you return null the error will be ignored
         if (error.error) {	
               error;	
         }
         return null	
      }
}))
```

In the `onGet` method, you will receive an object with the necessary keys for authentication

```typescript
{
   apiToken: string // api-token passed in the request header
   apiKey: string // api-key passed in the request header
}
```

And in `onFail` the object will have the following structure:

```typescript
{
   error: any // it will only be informed if there is an error in the code execution.
   message: string // a message will be returned if there is no error and the request header does not have the necessary keys for authentication
}
```

### Example 03 - More than one authentication method

In this example, two types of authentication will be used, the first one to be obtained will be used, and the other types of authentication will not be tested.

If none of the authentication types are validated, the `onFail` method will be called. When using multiple authentications, do not use the `onFail` specific to each type of authentication

```typescript
import { getAuthMiddleware, firebaseAuth, customKeysAuth } from 'get-auth-middleware';

app.use(getAuthMiddleware({	
   authTypes: [	
      firebaseAuth({	
            firebaseAuth: firebaseApp.auth(),	
            loadUserRecord: true,	
            onGet: async (result: any) => {	
               result.user = await UserModel.getByUid(result.decodedIdToken.uid);	
            }	
      }),	
      customKeysAuth({	
            keys: ['api-token', 'api-key'],	
            onGet: async (result: any) => {	
               result.user = await UserModel.getByToken(result.apiToken, result.apiKey);	
            }	
      })	
   ],	
   onFail: (error: any) => {	
      // you can return a custom error, and if you return null the error will be ignored
      if (error.error) {	
            return error.error;	
      }
      return null	
   }	
}))
```