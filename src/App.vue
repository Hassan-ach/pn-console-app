<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const signupKey = ref(0);

const rawHash = window.location.hash;
const oauthTokenMatch = rawHash.match(/access_token=([^&]+)/);
if (oauthTokenMatch) {
    sessionStorage.setItem('access_token', oauthTokenMatch[1]);
}

function onOauthMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'oauth-success') {
        sessionStorage.setItem('access_token', event.data.token);
        router.push('/home');
    }
}

onMounted(async () => {
    const match = rawHash.match(/access_token=([^&]+)/);
    if (match) {
        sessionStorage.setItem('access_token', match[1]);

        if (window.opener && window.opener !== window) {
            window.opener.postMessage(
                { type: 'oauth-success', token: match[1] },
                window.location.origin,
            );
            window.close();
            return;
        }

        try {
            const { emitTo } = await import('@tauri-apps/api/event');
            const { getCurrentWindow } = await import(
                '@tauri-apps/api/window'
            );
            await emitTo('main', 'oauth-result', {
                token: match[1],
                is_new: false,
            });
            await getCurrentWindow().close();
            return;
        } catch {
            // Not running in Tauri — fall through
        }

        router.push('/home');
        return;
    }

    window.addEventListener('message', onOauthMessage);

    try {
        const { listen } = await import('@tauri-apps/api/event');
        await listen<{ token: string; is_new: boolean }>(
            'oauth-result',
            (event) => {
                sessionStorage.setItem('access_token', event.payload.token);
                router.push('/home');
            },
        );
        await listen('oauth-cancelled', () => {
            signupKey.value++;
        });
    } catch {
        // Not running in Tauri
    }
});
</script>

<template>
    <router-view />
</template>
