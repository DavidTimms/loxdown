// This is a little hack to ensure the auto-generated AST code works.
// It is not clever enough to know that VariableExpr is defined in
// Expr.ts, so we have to alias it to its own module here.
import { VariableExpr } from "./Expr";
export default VariableExpr;
