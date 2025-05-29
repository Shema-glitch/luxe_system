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
  quantitySold: z.number().min(1, "Quantity must be at least 1"),
  salePrice: z.string().min(1, "Sale price is required"),
});

type FormData = z.infer<typeof formSchema>;

interface Product {
  id: number;
  name: string;
  productCode: string;
  price: string;
  stockQuantity: number;
}

interface RecordSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordSaleModal({ open, onOpenChange }: RecordSaleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      quantitySold: 1,
      salePrice: "",
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const selectedProductId = form.watch("productId");
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const quantitySold = form.watch("quantitySold");
  const salePrice = form.watch("salePrice");

  const totalAmount = quantitySold && salePrice ? quantitySold * Number(salePrice) : 0;

  const createSaleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/sales", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Success",
        description: "Sale recorded successfully",
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
    if (selectedProduct && data.quantitySold > selectedProduct.stockQuantity) {
      toast({
        title: "Error",
        description: "Insufficient stock available",
        variant: "destructive",
      });
      return;
    }
    createSaleMutation.mutate(data);
  };

  // Auto-fill sale price with product price when product is selected
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === Number(productId));
    if (product) {
      form.setValue("productId", product.id);
      form.setValue("salePrice", product.price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
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
                    onValueChange={handleProductChange}
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
                              Stock: {product.stockQuantity} | Price: {Number(product.price).toLocaleString()} RWF
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
                  <p><strong>Available Stock:</strong> {selectedProduct.stockQuantity}</p>
                  <p><strong>Standard Price:</strong> {Number(selectedProduct.price).toLocaleString()} RWF</p>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="quantitySold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Sold</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={selectedProduct?.stockQuantity || 999}
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
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale Price (RWF)</FormLabel>
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

            {totalAmount > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Total Amount: {totalAmount.toLocaleString()} RWF
                </p>
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
                disabled={createSaleMutation.isPending || !selectedProduct}
              >
                {createSaleMutation.isPending ? "Recording..." : "Record Sale"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
