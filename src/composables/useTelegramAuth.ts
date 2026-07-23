import { ref, type Ref } from 'vue';

declare global {
    interface Window {
        TelegramLib: {
            TelegramClient: typeof import('telegram').TelegramClient;
            StringSession: typeof import('telegram/sessions').StringSession;
            Api: typeof import('telegram').Api;
            computeCheck: (passwordInfo: any, password: string) => Promise<any>;
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
    let client: any = null;
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
        } catch (err: any) {
            state.value = {
                step: 'error',
                phone,
                error: err.message ?? String(err),
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
            const sessionString = client.session.save() as string;
            state.value = {
                step: 'connected',
                phone: phoneInfo.phone,
                sessionString,
            };
        } catch (err: any) {
            if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                state.value = {
                    step: 'awaiting-password',
                    phone: phoneInfo.phone,
                };
                return;
            }
            state.value = {
                step: 'error',
                phone: state.value.phone,
                error: err.message ?? String(err),
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
            const inputCheck = await computeCheck(passwordInfo, password);
            await client.invoke(
                new Api.auth.CheckPassword({ password: inputCheck }),
            );
            const sessionString = client.session.save() as string;
            state.value = {
                step: 'connected',
                phone: phoneInfo.phone,
                sessionString,
            };
        } catch (err: any) {
            state.value = {
                step: 'error',
                phone: state.value.phone,
                error: err.message ?? String(err),
            };
            throw err;
        }
    }

    async function resolveChatEntity(
        identifier: string,
    ): Promise<{ title: string; id: string } | null> {
        let c = client;
        let cleanup = false;
        if (!c) {
            const stored = localStorage.getItem('telegram_config');
            if (!stored) return null;
            try {
                const parsed = JSON.parse(stored);
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
