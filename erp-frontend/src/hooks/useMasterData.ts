import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { 
  oemApi, 
  modelApi, 
  uomApi, 
  productApi, 
  dataTransformers, 
  dataTransformersToBackend,
  ApiError 
} from '../services/api';
import { OEM, Model, UOM, Product } from '@/types';

// Custom hook for managing OEM data
export const useOEMs = () => {
  const [oems, setOEMs] = useState<OEM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOEMs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await oemApi.getAll();
      const transformedData = data.map(dataTransformers.oem);
      setOEMs(transformedData);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch OEMs';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createOEM = useCallback(async (oemData: Omit<OEM, 'id' | 'createdAt'>) => {
    try {
      const backendData = dataTransformersToBackend.oem(oemData);
      const newOEM = await oemApi.create(backendData);
      const transformedOEM = dataTransformers.oem(newOEM);
      setOEMs(prev => [transformedOEM, ...prev]);
      toast({
        title: "Success",
        description: "OEM created successfully",
      });
      return transformedOEM;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create OEM';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const updateOEM = useCallback(async (id: string, oemData: Partial<Omit<OEM, 'id' | 'createdAt'>>) => {
    try {
      const backendData = dataTransformersToBackend.oem(oemData);
      const updatedOEM = await oemApi.update(id, backendData);
      const transformedOEM = dataTransformers.oem(updatedOEM);
      setOEMs(prev => prev.map(oem => oem.id === id ? transformedOEM : oem));
      toast({
        title: "Success",
        description: "OEM updated successfully",
      });
      return transformedOEM;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update OEM';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const deleteOEM = useCallback(async (id: string) => {
    try {
      await oemApi.delete(id);
      setOEMs(prev => prev.filter(oem => oem.id !== id));
      toast({
        title: "Success",
        description: "OEM deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete OEM';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchOEMs();
  }, [fetchOEMs]);

  return {
    oems,
    loading,
    error,
    fetchOEMs,
    createOEM,
    updateOEM,
    deleteOEM,
  };
};

// Custom hook for managing Model data
export const useModels = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await modelApi.getAll();
      const transformedData = data.map(dataTransformers.model);
      setModels(transformedData);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createModel = useCallback(async (modelData: Omit<Model, 'id' | 'createdAt' | 'oemName'>) => {
    try {
      const backendData = dataTransformersToBackend.model(modelData);
      const newModel = await modelApi.create(backendData);
      const transformedModel = dataTransformers.model(newModel);
      setModels(prev => [transformedModel, ...prev]);
      toast({
        title: "Success",
        description: "Model created successfully",
      });
      return transformedModel;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create model';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const updateModel = useCallback(async (id: string, modelData: Partial<Omit<Model, 'id' | 'createdAt' | 'oemName'>>) => {
    try {
      const backendData = dataTransformersToBackend.model(modelData);
      const updatedModel = await modelApi.update(id, backendData);
      const transformedModel = dataTransformers.model(updatedModel);
      setModels(prev => prev.map(model => model.id === id ? transformedModel : model));
      toast({
        title: "Success",
        description: "Model updated successfully",
      });
      return transformedModel;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update model';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const deleteModel = useCallback(async (id: string) => {
    try {
      await modelApi.delete(id);
      setModels(prev => prev.filter(model => model.id !== id));
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete model';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    fetchModels,
    createModel,
    updateModel,
    deleteModel,
  };
};

// Custom hook for managing UOM data
export const useUOMs = () => {
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUOMs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await uomApi.getAll();
      const transformedData = data.map(dataTransformers.uom);
      setUOMs(transformedData);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch UOMs';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createUOM = useCallback(async (uomData: Omit<UOM, 'id' | 'createdAt'>) => {
    try {
      const backendData = dataTransformersToBackend.uom(uomData);
      const newUOM = await uomApi.create(backendData);
      const transformedUOM = dataTransformers.uom(newUOM);
      setUOMs(prev => [transformedUOM, ...prev]);
      toast({
        title: "Success",
        description: "UOM created successfully",
      });
      return transformedUOM;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create UOM';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const updateUOM = useCallback(async (id: string, uomData: Partial<Omit<UOM, 'id' | 'createdAt'>>) => {
    try {
      const backendData = dataTransformersToBackend.uom(uomData);
      const updatedUOM = await uomApi.update(id, backendData);
      const transformedUOM = dataTransformers.uom(updatedUOM);
      setUOMs(prev => prev.map(uom => uom.id === id ? transformedUOM : uom));
      toast({
        title: "Success",
        description: "UOM updated successfully",
      });
      return transformedUOM;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update UOM';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const deleteUOM = useCallback(async (id: string) => {
    try {
      await uomApi.delete(id);
      setUOMs(prev => prev.filter(uom => uom.id !== id));
      toast({
        title: "Success",
        description: "UOM deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete UOM';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchUOMs();
  }, [fetchUOMs]);

  return {
    uoms,
    loading,
    error,
    fetchUOMs,
    createUOM,
    updateUOM,
    deleteUOM,
  };
};

// Custom hook for managing Product data
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async (params?: { limit?: number; offset?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.getAll(params);
      const transformedData = data.map(dataTransformers.product);
      setProducts(transformedData);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'oemName' | 'modelName' | 'uomCode'>) => {
    try {
      const backendData = dataTransformersToBackend.product(productData);
      await productApi.create(backendData);
      // Refetch products to get complete data with joined fields (oem_name, model_name, uom_code)
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create product';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast, fetchProducts]);

  const updateProduct = useCallback(async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'oemName' | 'modelName' | 'uomCode'>>) => {
    try {
      const backendData = dataTransformersToBackend.product(productData);
      await productApi.update(id, backendData);
      // Refetch products to get complete data with joined fields (oem_name, model_name, uom_code)
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update product';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast, fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await productApi.delete(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete product';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
