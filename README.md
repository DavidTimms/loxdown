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

```ts
var x: String = "Hello, world!";
```

If you do not add a type, it will be inferred by determining the type of the expression it is initialised with.

```ts
var x = 123; // Loxdown knows x is a number
```

### Functions

Functions must specify their parameter types and return type.

```ts
fun isPositive(x: Number): Boolean {
    return x > 0;
}
```

The only exception is functions which do not return a value, which should not specify a return type.

```ts
fun sayHello(name: String) {
    print "Hello, " + name;
}
```

### Classes

When you declare a class it creates both a *value* which can be called to create instances of the class, and a *type* which can be used in type annotations.

The class must annote the types of all of its fields, inside the class block, before any methods.

Type annotations for methods work just like standalone functions.

```ts
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

```ts
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

Complex union types can become quite verbose to repeat throughout your program, so you can define a type alias to make things clearer.

```ts
type Animal = Cat | Dog;
```

### Callable Types

To write type annotations for higher-order functions, you can use syntax for callable types which mirrors the syntax for function declarations. This is compatible with both classes and functions.

```ts
// The type of a function which takes a single
// number and returns a string.
type NumberToString = fun (Number): String;
```

### Flow-typing and nil-safety

Loxdown will track the control flow of your code to know when a runtime check means we have new information about the type of a variable in one of the execution paths.

The primary way of doing this is with the built-in function `isInstance` which takes a value and a class and returns true if the value is an instance of the class.

```ts
fun double(value: Number | String): Number {
    if (isInstance(value, Number)) {
        // In this block we can use multiplication because
        // the type checker knowns `value` is a number.
        return value * 2;
    }

    // In this block, it knows that the oppsite is true -
    // `value` must be a string.
    return Number(value) * 2;
}

double(2); // 4
double("3"); // 6
```

Unlike many commonly used languages, Loxdown does not allow assigning the `nil` to any type except `Nil`. This means if you want a variable, field or parameter to be nilable, you need to opt-in with a union type. When you want to use the value, you will need to check that it is not nil. This eliminates one of the most common causes of bugs.

```ts
fun addOptional(x: Number, y: Number | Nil): Number {
    if (y) return x + y;
    else return x;
}

addOptional(2, 3); // 5
addOptional(6, nil); // 6
```

### Generics

Classes, functions, methods and type aliases support parametric polymorphism. In all cases, square brackets are used to provide the names of the type parameters. You can then use the parameters like any other types.

```ts
fun iff[T](condition: Boolean, ifTrue: T, ifFalse: T): T {
    if (condition) {
        return ifTrue;
    } else {
        return ifFalse;
    }
}
```

When you call a generic function or class, the types for the type parameter can be provided explicitly (again, using square brackets), or inferred from the types of the values passed in the call. The type inference cannot always find the right type in complex cases like union types.

```ts
var hour = 13;

// Explicitly provided type paramters
var hoursWorkRemaining = iff[Number | Nil](
    hour >= 9 and hour < 17,
    17 - hour,
    nil
);

// The inferred type parameter is 'String'
var greeting = iff(hour >= 12, "Good afternoon", "Good morning");
```

There is one generic class built-in, which is `Array`.

```ts
var xs: Array[Number] = [1, 2, 3];
xs.append(4);
```

For more examples, including generic classes, [take a look at the example programs in the playground, particularly the linked list and dictionary.](https://davidtimms.github.io/loxdown/playground)