export interface SchemaProperties {
  v: D;
  d: D;
  u: D;
  i: D;
  ri: D;
  s: D;
  a: A;
}

export interface A {
  oneOf: OneOf[];
}

export interface OneOf {
  description: string;
  type: string;
  $id?: string;
  properties?: OneOfProperties;
  additionalProperties?: boolean;
  required?: string[];
}

export type OneOfProperties = {
  d: D;
  i: D;
  dt: Dt;
  u?: D;
} & {
  [key: string]: D; // TODO - This needs to be expanded in the future.
};

export interface D {
  description: string;
  type: string;
}

export interface Dt {
  description: string;
  type: string;
  format: string;
}
export interface SchemaDetail {
  $id: string;
  $schema: string;
  title: string;
  description: string;
  type: string;
  credentialType: string;
  version: string;
  properties: SchemaProperties;
  additionalProperties: boolean;
  required: string[];
}

export interface Schema {
  id: string;
  name: string;
}
