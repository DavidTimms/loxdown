# Loxdown

Loxdown is an experimental statically-typed variant of the Lox programming language, written during the [COVID-19 lockdown](https://en.wikipedia.org/wiki/COVID-19_pandemic).  It was originally implemented by following Bob Nystrom's excellent book ["Crafting Interpreters"](https://www.craftinginterpreters.com/). The static type system was added later, so the core of the implementation is still a dynamically-typed tree-walking interpreter.

The type system aims to be both *sound* and expressive enough to type most Lox programs. It has several advanced features, including [type inference](https://en.wikipedia.org/wiki/Type_inference), [generics](https://en.wikipedia.org/wiki/Generic_programming), [union types](https://en.wikipedia.org/wiki/Union_type), nil-safety and [flow-sensitive typing](https://en.wikipedia.org/wiki/Flow-sensitive_typing).

[You can read, write and run some example programs in your browser using the playground.](https://davidtimms.github.io/loxdown/playground)

**DISCLAIMER:** This is not really intended for real-world use. It was primarily an exercise to learn more about implementing languages and type systems.

## A Brief Tour of the Language

This guide assumes you are familiar with [the dynamically-typed Lox language, as explained in Crafting Interpreters.](https://www.craftinginterpreters.com/the-lox-language.html)

### Built-in Types

Out of the box, there are classes representing all of the native data types:

- `Nil`
- `Boolean`
- `Number`
- `String`
- `Array`
- `Function`
- `Class`

There is also a special type called `Any`, which represents a value of unknown type.

### Variables

You can add a type annotation to any variable declaration, after the variable name, separated with a colon.

```
var x: String = "Hello, world!";
```

If you do not add a type, it will be inferred by determining the type of the expression it is initialised with.

```
var x = 123; // Loxdown knows x is a number
```

### Functions

Functions must specify their parameter types and return type.

```
fun isPositive(x: Number): Boolean {
    return x > 0;
}
```

The only exception is functions which do not return a value, which should not specify a return type.

```
fun sayHello(name: String) {
    print "Hello, " + name;
}
```

### Classes

When you declare a class it creates both a *value* which can be called to create instances of the class, and a *type* which can be used in type annotations.

The class must annote the types of all of its fields, inside the class block, before any methods.

Type annotations for methods work just like standalone functions.

```
class Person {
    name: String;

    init(name: String) {
        this.name = name;
    }
}

var bob: Person = Person("Bob");
```

### Unions

The `|` operator can be used in type annotations to create a *union*. This means the runtime value can either be one type or another. The typechecker will only allow you to do things with this variable which are safe for all the members of the union. For instance you can only call methods if they exist in all member types and have compatible type signatures.

```
class Cat {
    sound(): String {
        return "Meow";
    }
}

class Dog {
    sound(): String {
        return "Woof";
    }
}

fun makePetSound(pet: Cat | Dog) {
    print(pet.sound() + "!");
}

makePetSound(Cat());
makePetSound(Dog());
```

### Type Aliases

### Callable Types

### Flow-typing

### Generics

