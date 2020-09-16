#!/usr/bin/env ts-node

import * as fs from "fs";
import * as readline from "readline";
import Lox from "./Lox";
import OutputHandler from "./OutputHandler";

// CLI entry point
function main(args: string[]): void {
    if (args.length > 1) {
        console.error("Usage: loxdown [script]");
        process.exit(64);
    } else if (args.length === 1) {
        runFile(args[0]);
    } else {
        startRepl();
    }
}

class ConsoleOutputHandler implements OutputHandler {
    print(message: string): void {
        console.log(message);
    }
    printError(message: string): void {
        console.error(message);
    }
}

function runFile(path: string): never {
    const output = new ConsoleOutputHandler();
    let source;

    try {
        source = fs.readFileSync(path, {encoding: "utf8"});
    } catch (error) {
        output.printError(`Unable to open file: ${path}`);
        process.exit(66);
    }

    const lox = new Lox(output);
    const status = lox.run(source);

    switch (status) {
        case "SYNTAX_ERROR":
        case "STATIC_ERROR":
            return process.exit(65);
        case "RUNTIME_ERROR":
            return process.exit(70);
        case "SUCCESS":
            return process.exit(0);
    }
}

function startRepl(): void {
    const lox = new Lox(new ConsoleOutputHandler());

    process.stdin.setEncoding("utf8");
    const stdinInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const nextLine = (): void => {
        stdinInterface.question("> ", line => {
            lox.run(line, {printLastExpr: true});
            nextLine();
        });
    };

    nextLine();
}

main(process.argv.slice(2));
