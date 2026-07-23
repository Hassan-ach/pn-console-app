export interface DialogEntry {
    id: string;
    name: string;
    type: 'user' | 'group' | 'supergroup' | 'channel';
}

export async function fetchTelegramDialogs(): Promise<DialogEntry[]> {
    const stored = localStorage.getItem('telegram_config');
    if (!stored) throw new Error('No Telegram config found');

    const { apiId, apiHash, sessionString } = JSON.parse(stored);
    if (!apiId || !apiHash || !sessionString)
        throw new Error('Incomplete Telegram config');

    const { TelegramClient, StringSession } = window.TelegramLib;
    const client = new TelegramClient(
        new StringSession(sessionString),
        apiId,
        apiHash,
        { connectionRetries: 3, useWSS: true },
    );

    try {
        await client.connect();
        const dialogs = await client.getDialogs({});

        return dialogs.map((d: any) => {
            const className: string = d.entity?.className ?? '';
            let type: DialogEntry['type'] = 'group';
            if (className === 'User') type = 'user';
            else if (className === 'Channel') type = 'channel';
            else if (className === 'Chat') type = 'group';

            return {
                id: String(d.id),
                name:
                    d.name ||
                    d.title ||
                    `${d.firstName || ''} ${d.lastName || ''}`.trim() ||
                    String(d.id),
                type,
            };
        });
    } finally {
        await client.destroy();
    }
}
