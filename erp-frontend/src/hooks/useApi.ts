import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { ApiError } from "@/services/api";

// Custom hook for API queries with error handling
export const useApiQuery = <T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    retry?: boolean | number;
    staleTime?: number;
    onError?: (error: ApiError) => void;
  }
) => {
  const { toast } = useToast();

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        console.error('API Query Error:', error);
        throw error;
      }
    },
    enabled: options?.enabled,
    retry: options?.retry ?? 3,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      const errorMessage = error?.message || "An error occurred while fetching data";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};

// Custom hook for API mutations with error handling
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: (string | number)[][];
  }
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      const successMessage = options?.successMessage || "Operation completed successfully";
      
      toast({
        title: "Success",
        description: successMessage,
      });

      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error: ApiError, variables) => {
      const errorMessage = error.message || options?.errorMessage || "An error occurred";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(error, variables);
      }
    },
  });
};

// Custom hook for optimistic updates
export const useOptimisticMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: (string | number)[][];
    optimisticUpdate?: {
      queryKey: (string | number)[];
      updateFn: (oldData: any, variables: TVariables) => any;
    };
  }
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (options?.optimisticUpdate) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: options.optimisticUpdate.queryKey });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(options.optimisticUpdate.queryKey);

        // Optimistically update to the new value
        queryClient.setQueryData(
          options.optimisticUpdate.queryKey,
          (old: any) => options.optimisticUpdate!.updateFn(old, variables)
        );

        // Return a context object with the snapshotted value
        return { previousData };
      }
    },
    onSuccess: (data, variables) => {
      const successMessage = options?.successMessage || "Operation completed successfully";
      
      toast({
        title: "Success",
        description: successMessage,
      });

      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error: ApiError, variables, context) => {
      const errorMessage = error.message || options?.errorMessage || "An error occurred";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData && options?.optimisticUpdate) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }

      if (options?.onError) {
        options.onError(error, variables);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (options?.optimisticUpdate) {
        queryClient.invalidateQueries({ queryKey: options.optimisticUpdate.queryKey });
      }
    },
  });
};
