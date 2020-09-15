export default interface OutputHandler {
    print(message: string): void;
    printError(message: string): void;
}
