import Type from "./Type";
import types from "./builtinTypes";
import ClassType from "./ClassType";
import UnionType from "./UnionType";
import CallableType from "./CallableType";

describe("Type.union", () => {

    test("The union of a type with itself is the original type", () => {
        expect(Type.union(types.String, types.String)).toBe(types.String);
    });

    test("The union of a type with its subclass is the original type", () => {
        const Animal = new ClassType("Animal");
        const Giraffe = new ClassType("Giraffe", {superclass: Animal});
        const animal = Animal.instance();
        const dog = Giraffe.instance();

        expect(Type.union(animal, dog)).toBe(animal);
    });

    test("The union of two unrelated types is a union type with both", () => {
        expect(Type.union(types.String, types.Number))
            .toEqual(new UnionType([types.String, types.Number]));
    });

    test("The union of two instances with a common superclass is a union " +
         "type, not the superclass",
    () => {
        const Animal = new ClassType("Animal");
        const Lobster = new ClassType("Lobster", {superclass: Animal});
        const Duck = new ClassType("Duck", {superclass: Animal});
        const lobster = Lobster.instance();
        const duck = Duck.instance();

        expect(Type.union(lobster, duck))
            .toEqual(new UnionType([lobster, duck]));
    });

    test("The union of two distinct union types is a union type with all " +
         "their children",
    () => {
        const stringOrBoolean = new UnionType([types.String, types.Boolean]);
        const numberOrNil = new UnionType([types.Number, types.Nil]);

        expect(Type.union(stringOrBoolean, numberOrNil))
            .toEqual(new UnionType([
                types.String,
                types.Boolean,
                types.Number,
                types.Nil,
            ]));
    });

    test("The union of a union type with another union type with the same " +
         "children is a new union type with those same children",
    () => {
        const stringOrBoolean = new UnionType([types.String, types.Boolean]);
        const booleanOrString = new UnionType([ types.Boolean, types.String]);

        expect(Type.union(stringOrBoolean, booleanOrString))
            .toEqual(new UnionType([
                types.String,
                types.Boolean,
            ]));
    });

    test("The union of a union type with a superclass of one of its members " +
         "is a new union type with the superclass replacing the subclass",
    () => {
        const Animal = new ClassType("Animal");
        const Mouse = new ClassType("Mouse", {superclass: Animal});
        const maybeMouse = new UnionType([types.Nil, Mouse.instance()]);

        expect(Type.union(Animal.instance(), maybeMouse))
            .toEqual(new UnionType([
                Animal.instance(),
                types.Nil,
            ]));
    });

    test("The union of a callable type with an identical callable type is an " +
         "identical callable type",
    () => {
        const callable1 =
            new CallableType([], [types.String, types.Number], types.Boolean);
        const callable2 =
            new CallableType([], [types.String, types.Number], types.Boolean);

        expect(Type.union(callable1, callable2)).toEqual(callable1);
    });

    test("The union of a callable type with a compatible callable type with " +
         "narrower parameter types is the narrower callable type. (classes)",
    () => {
        const Animal = new ClassType("Animal");
        const Platypus = new ClassType("Platypus", {superclass: Animal});
        const wider = new CallableType(
            [],
            [Animal.instance(), types.Number],
            types.String,
        );
        const narrower = new CallableType(
            [],
            [Platypus.instance(), types.Number],
            types.String,
        );

        expect(Type.union(wider, narrower)).toEqual(narrower);
    });

    test("The union of a callable type with a compatible callable type with " +
         "narrower parameter types is the narrower callable type. (unions)",
    () => {
        const stringOrBoolean =
            new UnionType([types.String, types.Boolean]);
        const wider =
            new CallableType([], [types.Number, stringOrBoolean], types.String);
        const narrower =
            new CallableType([], [types.Number, types.String], types.String);

        expect(Type.union(wider, narrower)).toEqual(narrower);
    });

    test("The union of a callable type with a compatible callable type will " +
         "pick the narrowest type for each of their parameters.",
    () => {
        const stringOrBoolean =
            new UnionType([types.String, types.Boolean]);
        const stringOrNumber =
            new UnionType([types.String, types.Number]);
        const wider =
            new CallableType([], [types.Number, stringOrBoolean], types.String);
        const narrower =
            new CallableType([], [stringOrNumber, types.String], types.String);

        expect(Type.union(wider, narrower))
            .toEqual(new CallableType(
                [],
                [types.Number, types.String],
                types.String,
            ));
    });

    test("The union of two callable types with compatible parameter types " +
         "but different return types is a callable with a union return type",
    () => {
        const returnsString =
            new CallableType([], [types.Number], types.String);
        const returnsNumber =
            new CallableType([], [types.Number], types.Number);

        expect(Type.union(returnsString, returnsNumber))
            .toEqual(new CallableType(
                [],
                [types.Number],
                new UnionType([types.String, types.Number]),
            ));
    });
});
