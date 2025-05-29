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
  type: z.enum(["main", "sub"], { required_error: "Category type is required" }),
  name: z.string().min(1, "Category name is required"),
  mainCategoryId: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MainCategory {
  id: number;
  name: string;
}

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCategoryModal({ open, onOpenChange }: AddCategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "main",
      name: "",
      mainCategoryId: undefined,
    },
  });

  const { data: mainCategories = [] } = useQuery<MainCategory[]>({
    queryKey: ["/api/categories/main"],
  });

  const categoryType = form.watch("type");

  const createMainCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/categories/main", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/main"] });
      toast({
        title: "Success",
        description: "Main category created successfully",
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

  const createSubCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; mainCategoryId: number }) => {
      return apiRequest("POST", "/api/categories/sub", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/sub"] });
      toast({
        title: "Success",
        description: "Sub-category created successfully",
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
    if (data.type === "main") {
      createMainCategoryMutation.mutate(data.name);
    } else {
      if (!data.mainCategoryId) {
        toast({
          title: "Error",
          description: "Main category is required for sub-categories",
          variant: "destructive",
        });
        return;
      }
      createSubCategoryMutation.mutate({
        name: data.name,
        mainCategoryId: data.mainCategoryId,
      });
    }
  };

  const isLoading = createMainCategoryMutation.isPending || createSubCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main">Main Category</SelectItem>
                      <SelectItem value="sub">Sub-Category</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {categoryType === "sub" && (
              <FormField
                control={form.control}
                name="mainCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Category</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select main category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mainCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Enter ${categoryType === "main" ? "main category" : "sub-category"} name`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
