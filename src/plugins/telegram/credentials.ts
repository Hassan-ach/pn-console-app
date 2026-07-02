import { Credentials } from "../contract";

export class TelegramCredentials extends Credentials {
    constructor(
        public readonly phoneNumber: string,
        public readonly password?: string,
    ) {
        super();
    }
}
