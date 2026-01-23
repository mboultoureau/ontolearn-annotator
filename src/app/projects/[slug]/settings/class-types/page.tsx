"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Label } from "@/app/_components/ui/label";
import { useToast } from "@/app/_components/ui/use-toast";
import { Plus, Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";

interface ClassType {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  _count: {
    annotationTypes: number;
  };
}

export default function ClassTypesPage({ params }: { params: { slug: string } }) {
  const t = useTranslations("ClassTypes");
  const { toast } = useToast();
  const { slug } = params;

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load class types
  const loadClassTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${slug}/class-types`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setClassTypes(data);
    } catch (error) {
      toast({
        title: t("errors.load"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassTypes();
  }, [slug]);

  // Filter class types
  const filteredClassTypes = classTypes.filter((ct) => {
    const matchesSearch = ct.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ct.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Create class type
  const handleCreate = async () => {
    if (!formName.trim()) return;

    try {
      setFormSubmitting(true);
      const response = await fetch(`/api/projects/${slug}/class-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast({
            title: t("errors.duplicate"),
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.error);
      }

      toast({ title: t("success.created") });
      setAddDialogOpen(false);
      setFormName("");
      loadClassTypes();
    } catch (error) {
      toast({
        title: t("errors.create"),
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update class type
  const handleUpdate = async () => {
    if (!selectedClassType || !formName.trim()) return;

    try {
      setFormSubmitting(true);
      const response = await fetch(
        `/api/projects/${slug}/class-types/${selectedClassType.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim() }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast({
            title: t("errors.duplicate"),
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.error);
      }

      toast({ title: t("success.updated") });
      setEditDialogOpen(false);
      setSelectedClassType(null);
      setFormName("");
      loadClassTypes();
    } catch (error) {
      toast({
        title: t("errors.update"),
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete class type
  const handleDelete = async () => {
    if (!selectedClassType) return;

    try {
      setFormSubmitting(true);
      const response = await fetch(
        `/api/projects/${slug}/class-types/${selectedClassType.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete");

      toast({ title: t("success.deleted") });
      setDeleteDialogOpen(false);
      setSelectedClassType(null);
      loadClassTypes();
    } catch (error) {
      toast({
        title: t("errors.delete"),
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (classType: ClassType) => {
    try {
      const newStatus = classType.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const response = await fetch(`/api/projects/${slug}/class-types/${classType.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast({
        title: newStatus === "ACTIVE" ? t("success.activated") : t("success.deactivated"),
      });
      loadClassTypes();
    } catch (error) {
      toast({
        title: t("errors.update"),
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (classType: ClassType) => {
    setSelectedClassType(classType);
    setFormName(classType.name);
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (classType: ClassType) => {
    setSelectedClassType(classType);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("statusFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="active">{t("status.active")}</SelectItem>
              <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addNew")}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.created")}</TableHead>
              <TableHead>{t("table.usage")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("loading", { ns: "Common" })}...
                </TableCell>
              </TableRow>
            ) : filteredClassTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">{t("empty")}</p>
                    <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClassTypes.map((classType) => (
                <TableRow key={classType.id}>
                  <TableCell className="font-medium">{classType.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={classType.status === "ACTIVE" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(classType)}
                    >
                      {classType.status === "ACTIVE"
                        ? t("status.active")
                        : t("status.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(classType.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {t("usage", { count: classType._count.annotationTypes })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(classType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(classType)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.add.title")}</DialogTitle>
            <DialogDescription>{t("dialog.add.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("form.name")}</Label>
              <Input
                id="name"
                placeholder={t("form.namePlaceholder")}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setFormName("");
              }}
            >
              {t("dialog.delete.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={formSubmitting || !formName.trim()}>
              {formSubmitting ? t("submitting", { ns: "Common" }) : t("dialog.add.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.edit.title")}</DialogTitle>
            <DialogDescription>{t("dialog.edit.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("form.name")}</Label>
              <Input
                id="edit-name"
                placeholder={t("form.namePlaceholder")}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedClassType(null);
                setFormName("");
              }}
            >
              {t("dialog.delete.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={formSubmitting || !formName.trim()}>
              {formSubmitting ? t("submitting", { ns: "Common" }) : t("dialog.edit.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.delete.title")}</DialogTitle>
            <DialogDescription>{t("dialog.delete.description")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedClassType && selectedClassType._count.annotationTypes > 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("dialog.delete.inUse", {
                    count: selectedClassType._count.annotationTypes,
                  })}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>{t("dialog.delete.notInUse")}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedClassType(null);
              }}
            >
              {t("dialog.delete.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formSubmitting}>
              {formSubmitting ? t("submitting", { ns: "Common" }) : t("dialog.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
