
export interface AttributeValue {
  id: string;
  value: string;
}

export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export interface CombinationResult {
  productName: string;
  headers: string[];
  variants: string[][];
}
    