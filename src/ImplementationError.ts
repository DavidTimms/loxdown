// This class is thrown in cases which should never be reached.
// It indicates a bug in the compiler or interpreter, not in the
// user code.
export default class ImplementationError extends Error {}
