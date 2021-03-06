import GenericParamType from "./GenericParamType";
import Type from "./Type";

export type GenericParamMap = Map<GenericParamType, Type | null>;
export type FullGenericParamMap = Map<GenericParamType, Type>;
