import Type from "./Type";
import types from "./builtinTypes";
import InstanceType from "./InstanceType";
import ClassType from "./ClassType";
import UnionType from "./UnionType";

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
         "is a new union type with the superclass replacing the subclass.",
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
});
