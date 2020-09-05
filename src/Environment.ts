import LoxValue from "./LoxValue";
import Token from "./Token";
import ImplementationError from "./ImplementationError";

export default class Environment {
    private readonly values = new Map<string, LoxValue>();

    constructor(readonly enclosing: Environment | null = null) {
        this.enclosing = enclosing;
    }

    static fromObject(obj: {[name: string]: LoxValue}): Environment {
        const environment = new Environment();
        for (const [name, value] of Object.entries(obj)) {
            environment.define(name, value);
        }
        return environment;
    }

    get(name: Token): LoxValue {
        const value = this.values.get(name.lexeme);

        if (value === undefined) {
            if (this.enclosing) {
                return this.enclosing.get(name);
            }
            throw new ImplementationError(
                `Undefined variable '${name.lexeme}'.`);
        }

        return value;
    }

    assign(name: Token, value: LoxValue): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
        } else if (this.enclosing) {
            this.enclosing.assign(name, value);
        } else {
            throw new ImplementationError(
                `Undefined variable '${name.lexeme}'.`);
        }
    }

    define(name: string, value: LoxValue): void {
        this.values.set(name, value);
    }

    ancestor(distance: number): Environment {
        let environment = this as Environment;

        for (let i = 0; i < distance && environment.enclosing; i++) {
            environment = environment.enclosing;
        }
        return environment;
    }

    getAt(distance: number, name: string): LoxValue {
        const value = this.ancestor(distance).values.get(name);

        if (value === undefined) {
            throw new ImplementationError(
                `Unable to find variable '${name}' in expected environment ` +
                `at distance ${distance}.`);
        }

        return value;
    }

    assignAt(distance: number, name: Token, value: LoxValue): void {
        this.ancestor(distance).values.set(name.lexeme, value);
    }
}
