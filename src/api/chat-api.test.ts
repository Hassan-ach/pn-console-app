import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatApi } from './chat-api';

vi.mock('./client', () => ({
    api: {
        get: vi.fn(),
        stream: vi.fn(),
    },
}));

import { api } from './client';

function createMockStream(chunks: string[]) {
    let index = 0;
    return new Response(
        new ReadableStream({
            pull(controller) {
                if (index < chunks.length) {
                    controller.enqueue(new TextEncoder().encode(chunks[index]));
                    index++;
                } else {
                    controller.close();
                }
            },
        }),
    );
}

function sseEvent(data: Record<string, unknown>): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}

describe('chatApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMessages', () => {
        it('returns typed chat messages', async () => {
            const mockMessages = [
                {
                    id: '1',
                    role: 'USER',
                    content: 'Hello',
                    createdAt: '2026-07-28T10:00:00Z',
                },
                {
                    id: '2',
                    role: 'ASSISTANT',
                    content: 'Hi there!',
                    createdAt: '2026-07-28T10:00:01Z',
                },
            ];
            vi.mocked(api.get).mockResolvedValue(mockMessages);

            const result = await chatApi.getMessages();

            expect(api.get).toHaveBeenCalledWith('/chat/messages');
            expect(result).toEqual(mockMessages);
        });
    });

    describe('sendMessageStream', () => {
        it('calls onToken for each token chunk', async () => {
            const events = [
                sseEvent({ type: 'token', content: 'Hello' }),
                sseEvent({ type: 'token', content: ' world' }),
                sseEvent({ type: 'token', content: '!' }),
                sseEvent({ type: 'done' }),
            ];
            vi.mocked(api.stream).mockResolvedValue(createMockStream(events));

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream('Hi', {
                onToken,
                onDone,
                onError,
            });

            expect(onToken).toHaveBeenCalledTimes(3);
            expect(onToken).toHaveBeenNthCalledWith(1, 'Hello');
            expect(onToken).toHaveBeenNthCalledWith(2, ' world');
            expect(onToken).toHaveBeenNthCalledWith(3, '!');
        });

        it('calls onDone when stream completes', async () => {
            const events = [
                sseEvent({ type: 'token', content: 'Hi' }),
                sseEvent({ type: 'done' }),
            ];
            vi.mocked(api.stream).mockResolvedValue(createMockStream(events));

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream('Hi', {
                onToken,
                onDone,
                onError,
            });

            expect(onDone).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();
        });

        it('calls onError when api.stream rejects', async () => {
            vi.mocked(api.stream).mockRejectedValue(new Error('Network error'));

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream('Hi', {
                onToken,
                onDone,
                onError,
            });

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Network error' }),
            );
            expect(onToken).not.toHaveBeenCalled();
            expect(onDone).not.toHaveBeenCalled();
        });

        it('calls onError with 401 session expired message', async () => {
            vi.mocked(api.stream).mockRejectedValue(
                new Error('Session expired. Please log in again.'),
            );

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream('Hi', {
                onToken,
                onDone,
                onError,
            });

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Session expired. Please log in again.',
                }),
            );
        });

        it('skips malformed JSON line without calling onError', async () => {
            const events = [
                'data: {not-json}\n\n',
                sseEvent({ type: 'token', content: 'valid' }),
                sseEvent({ type: 'done' }),
            ];
            vi.mocked(api.stream).mockResolvedValue(createMockStream(events));

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream('Hi', {
                onToken,
                onDone,
                onError,
            });

            expect(onError).not.toHaveBeenCalled();
            expect(onToken).toHaveBeenCalledWith('valid');
            expect(onDone).toHaveBeenCalledTimes(1);
        });

        it('calls onError with error type from stream', async () => {
            const events = [sseEvent({ type: 'error', message: 'LLM failed' })];
            vi.mocked(api.stream).mockResolvedValue(createMockStream(events));

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream('Hi', {
                onToken,
                onDone,
                onError,
            });

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'LLM failed' }),
            );
        });

        it('does not call onError when stream is aborted', async () => {
            const abortController = new AbortController();
            vi.mocked(api.stream).mockRejectedValue(
                new DOMException('The operation was aborted', 'AbortError'),
            );

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await chatApi.sendMessageStream(
                'Hi',
                { onToken, onDone, onError },
                abortController.signal,
            );

            expect(onError).not.toHaveBeenCalled();
            expect(onToken).not.toHaveBeenCalled();
            expect(onDone).not.toHaveBeenCalled();
        });
    });
});
