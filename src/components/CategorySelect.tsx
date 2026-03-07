import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useExpenseCategories, useCreateExpenseCategory } from "@/hooks/useExpenseCategories";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function CategorySelect({ value, onValueChange, className }: CategorySelectProps) {
  const { data: categories = [] } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createCategory.mutateAsync(newName.trim());
      onValueChange(created.name);
      setNewName("");
      setShowCreate(false);
    } catch {}
  };

  return (
    <div className={className}>
      <Select value={value || "__none__"} onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No category</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              {cat.name}
            </SelectItem>
          ))}
          <div className="border-t mt-1 pt-1 px-2 pb-1">
            {showCreate ? (
              <div className="flex gap-1">
                <Input
                  className="h-7 text-xs"
                  placeholder="New category"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
                <Button size="sm" className="h-7 text-xs px-2" onClick={handleCreate} disabled={createCategory.isPending}>
                  Add
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs justify-start"
                onClick={(e) => { e.preventDefault(); setShowCreate(true); }}
              >
                <Plus className="h-3 w-3 mr-1" /> New category
              </Button>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
