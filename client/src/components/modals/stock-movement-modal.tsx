import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  movementType: z.enum(["in", "out"], { required_error: "Movement type is required" }),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Product {
  id: number;
  name: string;
  productCode: string;
  stockQuantity: number;
}

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockMovementModal({ open, onOpenChange }: StockMovementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      movementType: "in",
      quantity: 1,
      reason: "",
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const selectedProductId = form.watch("productId");
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const movementType = form.watch("movementType");
  const quantity = form.watch("quantity");

  const newStockLevel = selectedProduct ? 
    (movementType === "in" ? selectedProduct.stockQuantity + quantity : selectedProduct.stockQuantity - quantity) 
    : 0;

  const createStockMovementMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/stock-movements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (selectedProduct && data.movementType === "out" && data.quantity > selectedProduct.stockQuantity) {
      toast({
        title: "Error",
        description: "Cannot move out more stock than available",
        variant: "destructive",
      });
      return;
    }
    createStockMovementMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Movement</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          <div className="flex flex-col">
                            <span>{product.name} ({product.productCode})</span>
                            <span className="text-xs text-gray-500">
                              Current Stock: {product.stockQuantity}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <p><strong>Current Stock:</strong> {selectedProduct.stockQuantity}</p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select movement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in">Stock In (+)</SelectItem>
                      <SelectItem value="out">Stock Out (-)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={movementType === "out" ? selectedProduct?.stockQuantity : undefined}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for stock movement..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProduct && quantity > 0 && (
              <div className={`p-3 rounded-lg ${newStockLevel < 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                <p className={`text-sm font-medium ${newStockLevel < 0 ? 'text-red-900' : 'text-blue-900'}`}>
                  New Stock Level: {newStockLevel}
                </p>
                {newStockLevel < 0 && (
                  <p className="text-xs text-red-700 mt-1">
                    Warning: This would result in negative stock
                  </p>
                )}
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createStockMovementMutation.isPending || !selectedProduct || newStockLevel < 0}
              >
                {createStockMovementMutation.isPending ? "Recording..." : "Record Movement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
