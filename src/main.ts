#!/usr/bin/env ts-node

import * as fs from "fs"
import * as readline from "readline"

let hadError = false;

function main(args: string[]) {
    if (args.length > 1) {
        console.log("Usage: tslox [script]")
        process.exit(64);
    } else if (args.length === 1) {
        runFile(args[0]);
    } else {
        runPrompt();
    }
}

function runFile(path: string) {
    run(fs.readFileSync(path, {encoding: "utf8"}));

    // Indicate an error in the exit code
    if (hadError) process.exit(65);
}

function runPrompt() {
    //process.stdin.setEncoding('utf8')
    const stdinInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    function nextLine() {
        stdinInterface.question("> ", line => {
            run(line);
            hadError = false;
            nextLine();
        });
    }

    nextLine();
}

function run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    for (let token of tokens) {
        console.log(token);
    }
}

function error(line: number, message: string) {
    report(line, "", message);
}

function report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    hadError = true;
}

main(process.argv.slice(2))
