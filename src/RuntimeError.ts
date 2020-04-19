import Token from "./Token";

export default class RuntimeError extends Error {
    constructor(readonly token: Token, message: string) {
        super(message);
        this.token = token;
    }
}
