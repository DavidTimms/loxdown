# Loxdown

Loxdown is an experimental statically-typed variant of the Lox programming language, written during the [COVID-19 lockdown](https://en.wikipedia.org/wiki/COVID-19_pandemic).  It was originally implemented by following the exellent book ["Crafting Interpreters" by Bob Nystrom](https://www.craftinginterpreters.com/). The static type system was added later, so the core of the implementation is still a dynamically-typed tree-walking interpreter.

This is not really intented for other people to use. It was mainly an exercise to learn more about implementing languages and type systems.

Here is a simple example program:

```
var currentYear = 2020;

class Person {
    name: String;
    yearOfBirth: Number;

    init(name: String, yearOfBirth: Number) {
        this.name = name;
        this.yearOfBirth = yearOfBirth;
    }

    age(): Number {
        return currentYear - this.yearOfBirth;
    }
}

fun combinedAge(p1: Person, p2: Person): Number {
    return p1.age() + p2.age();
}

var alice = Person("Alice", 1999);
var bob   = Person("Robert", 1985);

print combinedAge(alice, bob);
```