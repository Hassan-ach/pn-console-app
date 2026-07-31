import { ref } from 'vue';

export function useExternalLinks() {
    const pendingLink = ref<string | null>(null);

    async function openExternalLink(url: string) {
        try {
            const { openUrl } = await import('@tauri-apps/plugin-opener');
            await openUrl(url);
        } catch {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    function handleLinkClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const anchor = target.closest<HTMLAnchorElement>('a[href]');
        if (!anchor) return;
        const href = anchor.href;
        if (!/^https?:\/\//i.test(href)) return;
        event.preventDefault();
        pendingLink.value = href;
    }

    async function confirmOpen() {
        const url = pendingLink.value;
        pendingLink.value = null;
        if (!url) return;
        await openExternalLink(url);
    }

    function cancel() {
        pendingLink.value = null;
    }

    return {
        pendingLink,
        handleLinkClick,
        confirmOpen,
        cancel,
        openExternalLink,
    };
}
