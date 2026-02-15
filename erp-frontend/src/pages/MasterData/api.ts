import { useToast } from "@/hooks/use-toast";
import { oemApi, modelApi, uomApi, productApi, dataTransformers, dataTransformersToBackend } from "@/services/api";

// Master Data types
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

// Generic API error handler
const handleApiError = (error: any, toast: any) => {
  const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};

// Master Data API functions
export const masterDataApi = {
  // OEM API functions
  oem: {
    getAll: async (): Promise<OEM[]> => {
      try {
        const data = await oemApi.getAll();
        return data.map(dataTransformers.oem);
      } catch (error) {
        throw error;
      }
    },

    create: async (oemData: Omit<OEM, "id" | "createdAt">): Promise<OEM> => {
      try {
        const backendData = dataTransformersToBackend.oem(oemData);
        const data = await oemApi.create(backendData);
        return dataTransformers.oem(data);
      } catch (error) {
        throw error;
      }
    },

    update: async (id: string, oemData: Partial<Omit<OEM, "id" | "createdAt">>): Promise<OEM> => {
      try {
        const backendData = dataTransformersToBackend.oem(oemData);
        const data = await oemApi.update(id, backendData);
        return dataTransformers.oem(data);
      } catch (error) {
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await oemApi.delete(id);
      } catch (error) {
        throw error;
      }
    },
  },

  // Model API functions
  model: {
    getAll: async (): Promise<Model[]> => {
      try {
        const data = await modelApi.getAll();
        return data.map(dataTransformers.model);
      } catch (error) {
        throw error;
      }
    },

    create: async (modelData: Omit<Model, "id" | "createdAt" | "oemName">): Promise<Model> => {
      try {
        const backendData = dataTransformersToBackend.model(modelData);
        const data = await modelApi.create(backendData);
        return dataTransformers.model(data);
      } catch (error) {
        throw error;
      }
    },

    update: async (id: string, modelData: Partial<Omit<Model, "id" | "createdAt" | "oemName">>): Promise<Model> => {
      try {
        const backendData = dataTransformersToBackend.model(modelData);
        const data = await modelApi.update(id, backendData);
        return dataTransformers.model(data);
      } catch (error) {
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await modelApi.delete(id);
      } catch (error) {
        throw error;
      }
    },
  },

  // UOM API functions
  uom: {
    getAll: async (): Promise<UOM[]> => {
      try {
        const data = await uomApi.getAll();
        return data.map(dataTransformers.uom);
      } catch (error) {
        throw error;
      }
    },

    create: async (uomData: Omit<UOM, "id" | "createdAt">): Promise<UOM> => {
      try {
        const backendData = dataTransformersToBackend.uom(uomData);
        const data = await uomApi.create(backendData);
        return dataTransformers.uom(data);
      } catch (error) {
        throw error;
      }
    },

    update: async (id: string, uomData: Partial<Omit<UOM, "id" | "createdAt">>): Promise<UOM> => {
      try {
        const backendData = dataTransformersToBackend.uom(uomData);
        const data = await uomApi.update(id, backendData);
        return dataTransformers.uom(data);
      } catch (error) {
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await uomApi.delete(id);
      } catch (error) {
        throw error;
      }
    },
  },

  // Product API functions
  product: {
    getAll: async (params?: { limit?: number; offset?: number }): Promise<Product[]> => {
      try {
        const data = await productApi.getAll(params);
        return data.map(dataTransformers.product);
      } catch (error) {
        throw error;
      }
    },

    create: async (productData: Omit<Product, "id" | "createdAt" | "oemName" | "modelName" | "uomCode">): Promise<Product> => {
      try {
        const backendData = dataTransformersToBackend.product(productData);
        const data = await productApi.create(backendData);
        return dataTransformers.product(data);
      } catch (error) {
        throw error;
      }
    },

    update: async (id: string, productData: Partial<Omit<Product, "id" | "createdAt" | "oemName" | "modelName" | "uomCode">>): Promise<Product> => {
      try {
        const backendData = dataTransformersToBackend.product(productData);
        const data = await productApi.update(id, backendData);
        return dataTransformers.product(data);
      } catch (error) {
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await productApi.delete(id);
      } catch (error) {
        throw error;
      }
    },
  },
};

// Hooks for master data with error handling
export const useMasterDataApi = () => {
  const { toast } = useToast();

  // OEM hooks
  const createOEM = async (oemData: Omit<OEM, "id" | "createdAt">) => {
    try {
      const result = await masterDataApi.oem.create(oemData);
      toast({
        title: "Success",
        description: "OEM created successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const updateOEM = async (id: string, oemData: Partial<Omit<OEM, "id" | "createdAt">>) => {
    try {
      const result = await masterDataApi.oem.update(id, oemData);
      toast({
        title: "Success",
        description: "OEM updated successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const deleteOEM = async (id: string) => {
    try {
      await masterDataApi.oem.delete(id);
      toast({
        title: "Success",
        description: "OEM deleted successfully",
      });
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Model hooks
  const createModel = async (modelData: Omit<Model, "id" | "createdAt" | "oemName">) => {
    try {
      const result = await masterDataApi.model.create(modelData);
      toast({
        title: "Success",
        description: "Model created successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const updateModel = async (id: string, modelData: Partial<Omit<Model, "id" | "createdAt" | "oemName">>) => {
    try {
      const result = await masterDataApi.model.update(id, modelData);
      toast({
        title: "Success",
        description: "Model updated successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const deleteModel = async (id: string) => {
    try {
      await masterDataApi.model.delete(id);
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // UOM hooks
  const createUOM = async (uomData: Omit<UOM, "id" | "createdAt">) => {
    try {
      const result = await masterDataApi.uom.create(uomData);
      toast({
        title: "Success",
        description: "UOM created successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const updateUOM = async (id: string, uomData: Partial<Omit<UOM, "id" | "createdAt">>) => {
    try {
      const result = await masterDataApi.uom.update(id, uomData);
      toast({
        title: "Success",
        description: "UOM updated successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const deleteUOM = async (id: string) => {
    try {
      await masterDataApi.uom.delete(id);
      toast({
        title: "Success",
        description: "UOM deleted successfully",
      });
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Product hooks
  const createProduct = async (productData: Omit<Product, "id" | "createdAt" | "oemName" | "modelName" | "uomCode">) => {
    try {
      const result = await masterDataApi.product.create(productData);
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Omit<Product, "id" | "createdAt" | "oemName" | "modelName" | "uomCode">>) => {
    try {
      const result = await masterDataApi.product.update(id, productData);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await masterDataApi.product.delete(id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  return {
    // OEM
    createOEM,
    updateOEM,
    deleteOEM,
    // Model
    createModel,
    updateModel,
    deleteModel,
    // UOM
    createUOM,
    updateUOM,
    deleteUOM,
    // Product
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
