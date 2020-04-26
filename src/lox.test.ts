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

const testsDirPath = `${__dirname}/../tests/`;
const dirEntries = fs.readdirSync(testsDirPath, {withFileTypes: true});

for (const dirEntry of dirEntries) {
    if (dirEntry.isFile() && dirEntry.name.endsWith(".lox")) {
        test(dirEntry.name, () => {
            const filePath = `${testsDirPath}/${dirEntry.name}`;
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

            expect(lox.stdout).toBe(spec.stdout);
            expect(lox.stderr).toBe(spec.stderr);
        });
    }
}
