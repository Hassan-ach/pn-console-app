export class Socket {
  connect() { return this; }
  on() { return this; }
  write() { return this; }
  end() { return this; }
  destroy() { return this; }
  setKeepAlive() { return this; }
  setTimeout() { return this; }
  setNoDelay() { return this; }
  once() { return this; }
  emit() { return this; }
  removeListener() { return this; }
}
export function connect() { return new Socket(); }
export function createConnection() { return new Socket(); }
export function createServer() { return { on: () => {}, listen: () => {} }; }
export default { Socket, connect, createConnection, createServer };
