/// <reference lib="dom" />

import Lox, { RunStatus } from "../Lox.js";

const sourceCodeBox = document.getElementById("source-code-box") as HTMLTextAreaElement;
const runButton = document.getElementById("run-button") as HTMLButtonElement;
const outputBox = document.getElementById("output") as HTMLButtonElement;
const outputTitle = document.getElementById("output-title") as HTMLHeadingElement;

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
    setStatus(status: RunStatus): void {
        const statusClasses: {[RS in RunStatus]: string} = {
            "SYNTAX_ERROR": "syntax-error",
            "STATIC_ERROR": "static-error",
            "RUNTIME_ERROR": "runtime-error",
            "SUCCESS": "success",
        };
        outputTitle.classList.remove(...Object.values(statusClasses));
        outputTitle.classList.add(statusClasses[status]);
        outputTitle.innerText = status.replace(/_/g, " ") + "!";
    },
};

function run(): void {
    output.clear();
    const source = sourceCodeBox.value;
    const lox = new Lox(output);
    const status = lox.run(source);
    output.setStatus(status);
}

runButton.addEventListener("click", run);
