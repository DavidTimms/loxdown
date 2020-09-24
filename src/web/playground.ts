/// <reference lib="dom" />

import * as CodeMirror from "codemirror";
import Lox, { RunStatus } from "../Lox.js";

const leftColumn =
    document.getElementById("left-column") as HTMLDivElement;

const exampleSelection =
    document.getElementById("example-selection") as HTMLSelectElement;

const runButton =
    document.getElementById("run-button") as HTMLButtonElement;

const outputBox =
    document.getElementById("output") as HTMLButtonElement;

const outputTitle =
    document.getElementById("output-title") as HTMLHeadingElement;

const codeMirror = CodeMirror(leftColumn, {
    mode: "null",
    lineNumbers: true,
    autofocus: true,
});

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
    const source = codeMirror.getValue();
    const lox = new Lox(output);
    const status = lox.run(source);
    output.setStatus(status);
}

async function selectExample(): Promise<void> {
    const exampleFile = exampleSelection.value;

    try {
        const response = await fetch(`examples/${exampleFile}`);
        if (!response.ok) throw Error();
        codeMirror.setValue(await response.text());
    } catch (error) {
        codeMirror.setValue("// Unable to load example!");
    }
}

runButton.addEventListener("click", run);
exampleSelection.addEventListener("input", selectExample);
selectExample();