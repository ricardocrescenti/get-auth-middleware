# get-auth-middleware

Package to easily obtain the data needed to authenticate your API from the request header.

You can work with one or more types of authentication, as explained in the examples below.

## Install

```
npm i get-auth-middleware@latest --save
```

## How to use

This package allows you to easily implement authentication in your API, you can use one or more authentication methods, see the examples below

## Examples

### Example 01 - Firebase Authentication

```typescript
import { firebaseAuth } from 'get-auth-middleware';

app.use(firebaseAuth({	
   firebaseAuth: firebaseApp.auth(),	
   loadUserRecord: true,	
   onGet: async (result: any) => {	
      result.user = await UserModel.getByUid(result.decodedIdToken.uid);	
   }  
   onFail: (error: any) => {	
      if (error.error) {	
            return new ApiResponseError(error.error);	
      }
      return null	
   }
}))
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
         if (error.error) {	
               return new ApiResponseError(error.error);	
         }
         return null	
      }
}))
```

### Example 03 - More than one authentication method

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
         if (error.error) {	
               return new ApiResponseError(error.error);	
         }
         return null	
      }	
   }))
```