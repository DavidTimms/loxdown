# Static Typechecker

- Design decisions:
  - Primarily nominal, rather than structural.
  - The type system should aim to be sound - no type errors at runtime.
  - Nil is not assignable to another type. Types can be made nullable through unions with Nil.
  - Functions which do not declare a return type must not return a value.
  - The types of variables will be inferred, but not parameters or return types.
  - If a subclass overrides a method, the type of each parameter must match or be a superclass of the parameter's type in the original method.
  - Eventually, type guards using `isInstance` will allow refining union types.

- Roadmap:
  - [X] Add syntax support for type declarations for parameters, return types and variable declarations.
  - [X] Add classes for representing types within the typechecker.
  - [X] Find a way to define types for the initial globals.
  - [X] Adapt the resolver to perform basic typechecking for functions, variables and operators.
  - [X] Introduce separate namespaces for types and values.
  - [X] Modify scoping rules and typechecking order to allow mutual recursion.
  - [X] Add support for string concatenation (currently '+' only works on numbers).
  - [X] Add support for classes and subtyping.
  - [X] Allow classes to declare the types of their fields.
  - [ ] Add syntax for declaring callable types.
  - [ ] Change scoping rules so variable initialisations are hoisted.
  - [ ] Resolve unsoundness of fields when accessed before they are assigned.
  - [ ] Adapt AST to allow accessing the source location of any expression for type errors.
  - [ ] Sort errors by location in the source code, so the order is not affected by deferred checking.
  - [ ] Add support for union types.
  - [ ] Add type aliases.
  - [ ] Add generics.
