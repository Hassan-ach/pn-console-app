import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { insightsRouter } from './router/insightsRouter';

async function bootstrap() {
    // Load GramJS bundle (IIFE sets window.TelegramLib)
    if (!window.TelegramLib) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/telegram-bundle.js';
            script.onload = () => resolve();
            script.onerror = () =>
                reject(new Error('Failed to load telegram-bundle.js'));
            document.head.appendChild(script);
        });
    }

    const app = createApp(App);

    app.use(insightsRouter);
    app.mount('#app');
}

void bootstrap();
