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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  quantityReceived: z.number().min(1, "Quantity must be at least 1"),
  costPerUnit: z.string().min(1, "Cost per unit is required"),
  supplierName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Product {
  id: number;
  name: string;
  productCode: string;
  price: string;
  stockQuantity: number;
}

interface RecordPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPurchaseModal({ open, onOpenChange }: RecordPurchaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      quantityReceived: 1,
      costPerUnit: "",
      supplierName: "",
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const selectedProductId = form.watch("productId");
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const quantityReceived = form.watch("quantityReceived");
  const costPerUnit = form.watch("costPerUnit");

  const totalCost = quantityReceived && costPerUnit ? quantityReceived * Number(costPerUnit) : 0;

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/purchases", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Success",
        description: "Purchase recorded successfully",
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
    createPurchaseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Purchase</DialogTitle>
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
                  <p><strong>Current Price:</strong> {Number(selectedProduct.price).toLocaleString()} RWF</p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="supplierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter supplier name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantityReceived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Received</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
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
              name="costPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Per Unit (RWF)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {totalCost > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Total Cost: {totalCost.toLocaleString()} RWF
                </p>
                {selectedProduct && (
                  <p className="text-xs text-blue-700 mt-1">
                    New Stock Level: {selectedProduct.stockQuantity + quantityReceived}
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
                disabled={createPurchaseMutation.isPending || !selectedProduct}
              >
                {createPurchaseMutation.isPending ? "Recording..." : "Record Purchase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
