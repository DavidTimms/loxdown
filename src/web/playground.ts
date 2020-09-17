/// <reference lib="dom" />

import Lox from "../Lox.js";
import OutputHandler from "../OutputHandler.js";

const sourceCodeBox = document.getElementById("source-code-box") as HTMLTextAreaElement;
const runButton = document.getElementById("run-button") as HTMLButtonElement;

const output: OutputHandler = {
    print(message) {
        console.log(message);
    },
    printError(message) {
        console.error(message);
    },
};

function run(): void {
    const source = sourceCodeBox.value;
    const lox = new Lox(output);
    lox.run(source);
}

runButton.addEventListener("click", run);
