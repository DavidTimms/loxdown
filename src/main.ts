#!/usr/bin/env ts-node

import Lox from "./Lox";

function main(args: string[]): void {
    const lox = new Lox();

    if (args.length > 1) {
        console.error("Usage: tslox [script]");
        process.exit(64);
    } else if (args.length === 1) {
        lox.runFile(args[0]);
    } else {
        lox.runPrompt();
    }
}

main(process.argv.slice(2));
