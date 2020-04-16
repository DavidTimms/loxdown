import Token from "./Token";

type ErrorHandler = (location: number | Token, message: string) => void;

export default ErrorHandler;
