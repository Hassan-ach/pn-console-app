export class TLSSocket {
    connect() {
        return this;
    }
    on() {
        return this;
    }
    write() {
        return this;
    }
    end() {
        return this;
    }
    destroy() {
        return this;
    }
}
export function connect() {
    return new TLSSocket();
}
export function createConnection() {
    return new TLSSocket();
}
export default { TLSSocket, connect, createConnection };
