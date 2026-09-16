export type AICommerceScalar = string | number | boolean | null;

export type AICommerceActionType =
  | "configure_product"
  | "update_item"
  | "add_product"
  | "remove_item"
  | "add_to_cart"
  | "quote_total"
  | "request_information";

export type AICommerceCommand = {
  action: AICommerceActionType;
  productQuery: string | null;
  itemRef: string | null;
  attributes: Record<string, AICommerceScalar>;
  itemRefs: string[];
  fields: string[];
};

export type AICommerceStateInput = {
  activeItemId: string | null;
  items: Array<{
    id: string;
    productSlug: string;
    quantity: number;
    configuration: Record<string, string>;
    unresolved?: Array<{ key: string; value: string }>;
  }>;
};

export type AICommerceOption = {
  key: string;
  label: string;
  kind: "select" | "number";
  required: boolean;
  values?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
};

export type AICommerceCartEntry = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  normalUnitPrice: number;
  pricingConfig: Record<string, string>;
  studentDiscountEligible: boolean;
  printCheckRequested: false;
  printCheckFee: 0;
  config: Record<string, string>;
};

export type AICommerceItem = {
  id: string;
  product: {
    slug: string;
    name: string;
    href: string;
    category: string;
  };
  quantity: number;
  quantityRules: {
    min: number;
    max: number;
    step: number;
    choices: number[];
  };
  configuration: Record<string, string>;
  options: AICommerceOption[];
  unresolved: Array<{ key: string; value: string }>;
  price: {
    status: "available" | "login_required" | "request";
    total?: number;
    normalTotal?: number;
  };
  canAddToCart: boolean;
  cartEntry?: AICommerceCartEntry;
};

export type AICommerceState = {
  activeItemId: string | null;
  items: AICommerceItem[];
  total: {
    status: "available" | "login_required" | "request" | "empty";
    amount?: number;
  };
};

export type AICommerceResponse = {
  reply: string;
  action: AICommerceActionType | "sync";
  state: AICommerceState;
  cartItems?: AICommerceCartEntry[];
};
