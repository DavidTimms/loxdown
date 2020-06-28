# TODO

- [ ] Data type improvements:
  - [X] Add runtime classes for all built-in data types - only "Class" is remaining.
  - [ ] Move all runtime classes for built-in types into "globals".
  - [ ] Avoid LoxString, LoxNumber etc. extending LoxInstance. This should massively reduce the need for unsafe type-casting. Refinement on the `type` field should work correctly.
  - [X] Allow `isInstance` to work on values which do not extend `LoxInstance`. This means all types within `LoxValue` should have a `loxClass` property.
- Organisation:
  - [ ] Organise test files into directories.
  - [ ] Organise main code into directories.
  - [ ] Use index files to reduce number of imports.
- Error handling:
  - [ ] Improve runtime errors from native functions. They currently crash the whole interpreter.
