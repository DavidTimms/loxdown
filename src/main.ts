#!/usr/bin/env ts-node

import Lox from "./Lox";

function main(args: string[]): void {
    const lox = new Lox();

    if (args.length > 1) {
        console.error("Usage: tslox [script]");
        process.exit(64);
    } else if (args.length === 1) {
        switch (lox.runFile(args[0])) {
            case "SYNTAX_ERROR":
            case "STATIC_ERROR":
                return process.exit(65);
            case "RUNTIME_ERROR":
                return process.exit(70);
            case "SUCCESS":
                return process.exit(0);
        }
    } else {
        lox.runPrompt();
    }
}

main(process.argv.slice(2));
