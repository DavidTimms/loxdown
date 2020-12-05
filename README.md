# Loxdown

Loxdown is an experimental statically-typed variant of the Lox programming language, written during the [COVID-19 lockdown](https://en.wikipedia.org/wiki/COVID-19_pandemic).  It was originally implemented by following Bob Nystrom's excellent book ["Crafting Interpreters"](https://www.craftinginterpreters.com/). The static type system was added later, so the core of the implementation is still a dynamically-typed tree-walking interpreter.

The type system aims to be both *sound* and expressive enough to type most Lox programs. It has several advanced features, including [type inference](https://en.wikipedia.org/wiki/Type_inference), [union types](https://en.wikipedia.org/wiki/Union_type), nil-safety and [flow-sensitive typing](https://en.wikipedia.org/wiki/Flow-sensitive_typing).

[You can read and run some example programs in your browser using the playground.](https://davidtimms.github.io/loxdown/playground)

**DISCLAIMER:** This is not really intended for other people to use. It was mainly an exercise to learn more about implementing languages and type systems.
