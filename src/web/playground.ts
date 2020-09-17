/// <reference lib="dom" />

import Lox from "../Lox.js";

const sourceCodeBox = document.getElementById("source-code-box") as HTMLTextAreaElement;
const runButton = document.getElementById("run-button") as HTMLButtonElement;
const outputBox = document.getElementById("output") as HTMLButtonElement;

const output = {
    clear(): void {
        outputBox.innerText = "";
    },
    print(message: string): void {
        const messageBox = document.createElement("div");
        messageBox.innerText = message;
        outputBox.appendChild(messageBox);
    },
    printError(message: string): void {
        const messageBox = document.createElement("div");
        messageBox.innerText = message;
        messageBox.classList.add("error");
        outputBox.appendChild(messageBox);
    },
};

function run(): void {
    output.clear();
    const source = sourceCodeBox.value;
    const lox = new Lox(output);
    lox.run(source);
}

runButton.addEventListener("click", run);
