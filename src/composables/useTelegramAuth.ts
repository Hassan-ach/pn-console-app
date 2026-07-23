import { ref, type Ref } from 'vue';

interface TelegramApiAuthSignIn {
    phoneNumber: string;
    phoneCode: string;
    phoneCodeHash: string;
}
interface TelegramApiAuthCheckPassword {
    password: unknown;
}
interface TelegramApiAccountGetPassword {
    className: string;
}
interface TelegramApiAuthSignInResult {
    phoneCodeHash: string;
}
interface TelegramApi {
    auth: {
        SignIn: new (params: TelegramApiAuthSignIn) => unknown;
        CheckPassword: new (params: TelegramApiAuthCheckPassword) => unknown;
    };
    account: {
        GetPassword: new () => TelegramApiAccountGetPassword;
    };
}
interface TelegramClientInstance {
    connect(): Promise<void>;
    sendCode(
        params: { apiId: number; apiHash: string },
        phone: string,
    ): Promise<TelegramApiAuthSignInResult>;
    invoke<T>(request: T): Promise<unknown>;
    getEntity(identifier: string): Promise<{
        id: number;
        title?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
    }>;
    getDialogs(query: Record<string, unknown>): Promise<unknown[]>;
    session: { save(): string };
    destroy(): Promise<void>;
}

declare global {
    interface Window {
        TelegramLib: {
            TelegramClient: new (
                session: { save(): string },
                apiId: number,
                apiHash: string,
                options: Record<string, unknown>,
            ) => TelegramClientInstance;
            StringSession: new (sessionString: string) => {
                save(): string;
            };
            Api: TelegramApi;
            computeCheck: (
                passwordInfo: TelegramApiAccountGetPassword,
                password: string,
            ) => Promise<unknown>;
        };
    }
}

export interface AuthState {
    step:
        | 'idle'
        | 'sending-code'
        | 'awaiting-code'
        | 'awaiting-password'
        | 'connected'
        | 'error';
    phone: string;
    sessionString?: string;
    error?: string;
}

export interface UseTelegramAuthReturn {
    state: Ref<AuthState>;
    sendCode(apiId: number, apiHash: string, phone: string): Promise<void>;
    submitCode(code: string): Promise<void>;
    submitPassword(password: string): Promise<void>;
    reset(): void;
    resolveChatEntity(
        identifier: string,
    ): Promise<{ title: string; id: string } | null>;
}

export function useTelegramAuth(): UseTelegramAuthReturn {
    const state = ref<AuthState>({ step: 'idle', phone: '' });
    let client: TelegramClientInstance | null = null;
    let phoneInfo: { phone: string; phoneCodeHash: string } | null = null;

    function getLib() {
        if (!window.TelegramLib) {
            throw new Error('TelegramLib not loaded.');
        }
        return window.TelegramLib;
    }

    async function sendCode(apiId: number, apiHash: string, phone: string) {
        state.value = { step: 'sending-code', phone };
        try {
            const { TelegramClient, StringSession } = getLib();
            const session = new StringSession('');
            client = new TelegramClient(session, apiId, apiHash, {
                connectionRetries: 5,
                useWSS: true,
            });
            await client.connect();
            const result = await client.sendCode({ apiId, apiHash }, phone);
            phoneInfo = { phone, phoneCodeHash: result.phoneCodeHash };
            state.value = { step: 'awaiting-code', phone };
        } catch (err: unknown) {
            state.value = {
                step: 'error',
                phone,
                error: err instanceof Error ? err.message : String(err),
            };
            throw err;
        }
    }

    async function submitCode(code: string) {
        if (!client || !phoneInfo) {
            const errMsg = 'No pending auth session';
            state.value = {
                step: 'error',
                phone: state.value.phone,
                error: errMsg,
            };
            throw new Error(errMsg);
        }
        try {
            const { Api } = getLib();
            await client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: phoneInfo.phone,
                    phoneCode: code,
                    phoneCodeHash: phoneInfo.phoneCodeHash,
                }),
            );
            const sessionString = client.session.save();
            state.value = {
                step: 'connected',
                phone: phoneInfo.phone,
                sessionString,
            };
        } catch (err: unknown) {
            if (
                err instanceof Error &&
                'errorMessage' in err &&
                (err as { errorMessage: string }).errorMessage ===
                    'SESSION_PASSWORD_NEEDED'
            ) {
                state.value = {
                    step: 'awaiting-password',
                    phone: phoneInfo.phone,
                };
                return;
            }
            state.value = {
                step: 'error',
                phone: state.value.phone,
                error: err instanceof Error ? err.message : String(err),
            };
            throw err;
        }
    }

    async function submitPassword(password: string) {
        if (!client || !phoneInfo) {
            const errMsg = 'No pending auth session';
            state.value = {
                step: 'error',
                phone: state.value.phone,
                error: errMsg,
            };
            throw new Error(errMsg);
        }
        try {
            const { Api, computeCheck } = getLib();
            const passwordInfo = await client.invoke(
                new Api.account.GetPassword(),
            );
            const inputCheck = await computeCheck(
                passwordInfo as TelegramApiAccountGetPassword,
                password,
            );
            await client.invoke(
                new Api.auth.CheckPassword({ password: inputCheck }),
            );
            const sessionString = client.session.save();
            state.value = {
                step: 'connected',
                phone: phoneInfo.phone,
                sessionString,
            };
        } catch (err: unknown) {
            state.value = {
                step: 'error',
                phone: state.value.phone,
                error: err instanceof Error ? err.message : String(err),
            };
            throw err;
        }
    }

    async function resolveChatEntity(
        identifier: string,
    ): Promise<{ title: string; id: string } | null> {
        let c: TelegramClientInstance | null = client;
        let cleanup = false;
        if (!c) {
            const stored = localStorage.getItem('telegram_config');
            if (!stored) return null;
            try {
                const parsed = JSON.parse(stored) as {
                    sessionString?: string;
                    apiId: number;
                    apiHash: string;
                };
                const { TelegramClient, StringSession } = getLib();
                c = new TelegramClient(
                    new StringSession(parsed.sessionString ?? ''),
                    parsed.apiId,
                    parsed.apiHash,
                    { connectionRetries: 3, useWSS: true },
                );
                await c.connect();
                cleanup = true;
            } catch {
                return null;
            }
        }
        try {
            const entity = await c.getEntity(identifier);
            const id = String(entity.id);
            const title =
                entity.title ??
                entity.username ??
                (`${entity.firstName ?? ''} ${entity.lastName ?? ''}`.trim() ||
                    id);
            return { title, id };
        } catch {
            return null;
        } finally {
            if (cleanup) c?.destroy().catch(() => {});
        }
    }

    function reset() {
        client?.destroy().catch(() => {});
        client = null;
        phoneInfo = null;
        state.value = { step: 'idle', phone: '' };
    }

    return {
        state,
        sendCode,
        submitCode,
        submitPassword,
        reset,
        resolveChatEntity,
    };
}
