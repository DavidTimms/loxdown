import Token from "./Token";

export default class RuntimeError extends Error {
    constructor(message: string, public token: Token | null = null) {
        super(message);
    }
}
