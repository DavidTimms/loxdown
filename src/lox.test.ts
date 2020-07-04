/* eslint-env jest */

// This script creates a jest test for every lox file in the
// tests directory which runs the code then compares the printed
// output to the sections labelled -- OUTPUT -- and -- ERROR --

import * as fs from "fs";
import Lox from "./Lox.js";

// This class overrides the print functions to allow capturing
// STDERR and STDOUT for tests
class TestLox extends Lox {
    stdout = "";
    stderr = "";

    print(message: string): void {
        this.stdout += message + "\n";
    }

    printError(message: string): void {
        this.stderr += message + "\n";
    }
}

function findFilesRecursively(dirPath: string, suffix: string): string[] {
    const dirEntries = fs.readdirSync(dirPath, {withFileTypes: true});
    return dirEntries.flatMap((dirEntry) => {
        if (dirEntry.isFile() && dirEntry.name.endsWith(suffix)) {
            return [dirEntry.name];
        } else if (dirEntry.isDirectory()) {
            return (
                findFilesRecursively(`${dirPath}/${dirEntry.name}`, suffix)
                    .map(fileName => `${dirEntry.name}/${fileName}`)
            );
        }
        return [];
    });
}

const testsDirPath = `${__dirname}/../tests/`;

for (const fileName of findFilesRecursively(testsDirPath, ".lox")) {
    test(fileName, () => {
        const filePath = `${testsDirPath}/${fileName}`;
        const content = fs.readFileSync(filePath, {encoding: "utf8"});

        const spec = {
            source: "",
            stdout: "",
            stderr: "",
        };
        let target: keyof typeof spec = "source";

        for (const line of content.split("\n")) {
            if (line.startsWith("-- OUTPUT --")) target = "stdout";
            else if (line.startsWith("-- ERROR --")) target = "stderr";
            else spec[target] += (spec[target] ? "\n" : "") + line;
        }

        const lox = new TestLox();

        lox.run(spec.source);

        expect(lox.stderr).toBe(spec.stderr);
        expect(lox.stdout).toBe(spec.stdout);
    });
}
