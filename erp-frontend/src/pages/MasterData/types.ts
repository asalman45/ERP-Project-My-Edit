// Master Data page specific types

export interface OEM {
  id: string;
  name: string;
  createdAt: string;
}

export interface Model {
  id: string;
  name: string;
  year: string;
  oemId: string;
  oemName: string;
  createdAt: string;
}

export interface UOM {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  partName: string;
  oemId: string;
  oemName: string;
  modelId: string;
  modelName: string;
  uomId: string;
  uomCode: string;
  standardCost?: number;
  category: string;
  createdAt: string;
}

export interface MasterDataState {
  oems: OEM[];
  models: Model[];
  uoms: UOM[];
  products: Product[];
  loading: {
    oems: boolean;
    models: boolean;
    uoms: boolean;
    products: boolean;
  };
}
