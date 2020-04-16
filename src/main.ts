#!/usr/bin/env ts-node

import * as fs from "fs";
import * as readline from "readline";

import Token from "./Token";
import TokenType from "./TokenType";
import Scanner from "./Scanner";
import Parser from "./Parser";
import AstPrinter from "./AstPrinter";

// TODO fix this global variable once we know how it'll be used.
// Perhaps move it into run() and have report() close over it?
let hadError = false;

function main(args: string[]): void {
    if (args.length > 1) {
        console.log("Usage: tslox [script]");
        process.exit(64);
    } else if (args.length === 1) {
        runFile(args[0]);
    } else {
        runPrompt();
    }
}

function runFile(path: string): void {
    run(fs.readFileSync(path, {encoding: "utf8"}));

    // Indicate an error in the exit code
    if (hadError) process.exit(65);
}

function runPrompt(): void {
    //process.stdin.setEncoding('utf8')
    const stdinInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    function nextLine(): void {
        stdinInterface.question("> ", line => {
            run(line);
            hadError = false;
            nextLine();
        });
    }

    nextLine();
}

function run(source: string): void {
    const scanner = new Scanner(source, printError);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens, printError);
    const expr = parser.parse();

    const astPrinter = new AstPrinter();
    console.log(astPrinter.print(expr));
}

function printError(location: number | Token, message: string): void {
    if (location instanceof Token) {
        if (location.type === TokenType.EOF) {
            report(location.line, " at end", message);
        } else {
            report(location.line, " at '" + location.lexeme + "'", message);
        }
    }
    else {
        report(location, "", message);
    }
}

function report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`);
    hadError = true;
}

main(process.argv.slice(2));
