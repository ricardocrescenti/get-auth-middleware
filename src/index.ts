
import * as http from "http";

export type NextFunction = (error?: any | Error) => void;
export type MiddlewareCallback = (req: any, res: any, next: NextFunction) => Promise<void>;
export type OnGetCallback = (result: any, req: IHttpRequest) => void;
export type OnFailCallback = (error: any, req: IHttpRequest) => void;

export interface IHttpRequest extends http.IncomingMessage {
    auth: any;
}

export interface IAuthOptions {
    ignoredRoutes?: string[];
    authTypes: MiddlewareCallback[];
    onGet?: OnGetCallback;
    onFail?: OnFailCallback;
}

export interface IFirebaseAuthOptions extends Omit<IAuthOptions, 'authTypes'> {
    firebaseAuth: any;
    loadUserRecord?: boolean;
}
export interface ICustomAuthOptions extends Omit<IAuthOptions, 'authTypes'> {
    keys: string[];
}

export function getAuthMiddleware(options: IAuthOptions): MiddlewareCallback {
    if (!options.authTypes || options.authTypes.length === 0) {
        throw new Error('Not informed `authTypes`.');
    }

    return async (req: IHttpRequest, res: any, next: NextFunction) => {

        if (ignoredRoute(req, options, next)) {
            return;
        }

        const error = await executeMiddleware(options.authTypes, 0, req, res);

        if (error) {
            performFail(error, options, req, next);
        } else {
            performSucess(req.auth, options, req, next);
        }
    };
}

async function executeMiddleware(middlewares: MiddlewareCallback[], index: number, req: IHttpRequest, res: any): Promise<any> { 
    return await middlewares[index](req, res, async (error) => {
        if (error && error.error) {
            return error;
        } else if (index < middlewares.length - 1) {
            return await executeMiddleware(middlewares, index + 1, req, res);
        } else {
            return error;
        }
    });
}

export function firebaseAuth(options: IFirebaseAuthOptions): MiddlewareCallback {
    return async (req: IHttpRequest, res: http.ServerResponse, next: NextFunction) => {
        const result: any = {};

        /// if do not have the authorization header entered, it will return null and move
        /// to the next authentication type
        if (!req.headers.authorization) {
            return await performFail({ message: 'No autorization sent in header' }, options, req, next);
        }

        /// obtain authorization and verify that type is correct
        const authParts = req.headers.authorization.split(' ');
        if (authParts.length === 0 || authParts[0] !== 'Bearer') {
            return await performFail({ error: 'Invalid autorization type' }, options, req, next);
        }

        try {
            /// get and save token
            result.token = authParts[1];

            /// get decoded id token with uid
            const decodedIdToken = await options.firebaseAuth.verifyIdToken(result.token);
            result.decodedIdToken = decodedIdToken;
            
            /// get user record, if needed
            if (options.loadUserRecord) {
                result.firebaseUser = await options.firebaseAuth.getUser(decodedIdToken.uid);
            }
        } catch (error) {
            return await performFail({ error }, options, req, next);
        }

        /// successfully complete middleware
        return await performSucess(result, options, req, next);
    };
}
export function customKeysAuth(options: ICustomAuthOptions): MiddlewareCallback {
    return async (req: IHttpRequest, res: any, next: NextFunction) => {

        /// initialize object that contains auth keys
        const result: any = {};

        /// get request header authentication keys
        for (const key of options.keys) {

            /// if the key does not exist, it will be returned null and move on to the
            /// next authentication type; if you do not have a next authentication
            /// type, an error will be generated
            if (!req.headers[key]) {
                return performFail({ message: `No ${key} sent in header` }, options, req, next);
            }

            /// obter e salvar chave de autenticação
            result[key] = req.headers[key];
        }

        /// successfully complete middleware
        return performSucess(result, options, req, next);
    };
}

export async function performSucess(auth: any, options: any, req: IHttpRequest, next: NextFunction) {
    if (options && options.onGet) {
        const result = await options.onGet(auth, req);
        if (result) {
            auth = result;
        }
    }

    req.auth = auth;

    return next();
}
export async function performFail(error: any, options: any, req: IHttpRequest, next: NextFunction) {
    if (options && options.onFail) {
        const result = await options.onFail(error, req);
        if (result !== undefined) {
            error = result;
        } else {
            error = undefined;
        }
    }

    return next(error);
}

function ignoredRoute(req: http.IncomingMessage, options: IAuthOptions, next: NextFunction): boolean {
    if (options.ignoredRoutes && req.url && options.ignoredRoutes.indexOf(req.url) >= 0) {
        next();
        return true;
    }
    return false;
}