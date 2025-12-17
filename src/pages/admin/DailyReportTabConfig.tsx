import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Users,
  Save,
} from "lucide-react";
import { useDailyReportTabs } from "@/hooks/useDailyReportTabs";
import { useScheduleRoles } from "@/hooks/useScheduleRoles";
import { DEFAULT_TAB_CATEGORIES, TAB_ICONS, DailyReportTab } from "@/types/dailyReport";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// TODO: Get from user context - using actual facility ID
const FACILITY_ID = "35bd447c-d2c4-4250-9e8b-bf2874395dc3";

interface SortableTabItemProps {
  tab: DailyReportTab & { roles?: Array<{ role_id: string; role?: { name: string; color: string } }> };
  onEdit: () => void;
  onDelete: () => void;
  onManageRoles: () => void;
  onToggleActive: (active: boolean) => void;
}

const SortableTabItem = ({ tab, onEdit, onDelete, onManageRoles, onToggleActive }: SortableTabItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg group"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{tab.tab_name}</span>
          {tab.is_required && (
            <Badge variant="secondary" className="text-xs">Required</Badge>
          )}
          {!tab.is_active && (
            <Badge variant="outline" className="text-xs text-muted-foreground">Disabled</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {tab.roles && tab.roles.length > 0 ? (
            tab.roles.map((r) => (
              <Badge
                key={r.role_id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: r.role?.color, color: r.role?.color }}
              >
                {r.role?.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">All roles</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Switch
          checked={tab.is_active}
          onCheckedChange={onToggleActive}
          aria-label="Toggle active"
        />
        <Button variant="ghost" size="icon" onClick={onManageRoles}>
          <Users className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const DailyReportTabConfig = () => {
  const navigate = useNavigate();
  const { tabs, isLoading, createTab, updateTab, deleteTab, reorderTabs, assignRole, removeRole, isSubmitting } = useDailyReportTabs(FACILITY_ID);
  const { data: roles = [] } = useScheduleRoles();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<DailyReportTab | null>(null);
  const [formData, setFormData] = useState({
    tab_name: "",
    tab_key: "",
    icon: "clipboard",
    is_required: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(tabs, oldIndex, newIndex);
      
      reorderTabs.mutate(
        newOrder.map((t, i) => ({ id: t.id, display_order: i }))
      );
    }
  };

  const openCreateDialog = () => {
    setSelectedTab(null);
    setFormData({ tab_name: "", tab_key: "", icon: "clipboard", is_required: false });
    setEditDialogOpen(true);
  };

  const openEditDialog = (tab: DailyReportTab) => {
    setSelectedTab(tab);
    setFormData({
      tab_name: tab.tab_name,
      tab_key: tab.tab_key,
      icon: tab.icon,
      is_required: tab.is_required,
    });
    setEditDialogOpen(true);
  };

  const handleSaveTab = () => {
    if (!formData.tab_name.trim() || !formData.tab_key.trim()) return;

    if (selectedTab) {
      updateTab.mutate({
        id: selectedTab.id,
        tab_name: formData.tab_name.trim(),
        tab_key: formData.tab_key.trim(),
        icon: formData.icon,
        is_required: formData.is_required,
      });
    } else {
      createTab.mutate({
        facility_id: FACILITY_ID,
        tab_name: formData.tab_name.trim(),
        tab_key: formData.tab_key.trim(),
        icon: formData.icon,
        is_required: formData.is_required,
        is_active: true,
        display_order: tabs.length,
        form_template_id: null,
      });
    }
    setEditDialogOpen(false);
  };

  const handleDeleteTab = (tab: DailyReportTab) => {
    if (confirm(`Are you sure you want to delete "${tab.tab_name}"?`)) {
      deleteTab.mutate(tab.id);
    }
  };

  const openRolesDialog = (tab: DailyReportTab) => {
    setSelectedTab(tab);
    setRolesDialogOpen(true);
  };

  const handleToggleRole = (roleId: string) => {
    if (!selectedTab) return;
    
    const tabWithRoles = tabs.find(t => t.id === selectedTab.id);
    const hasRole = tabWithRoles?.roles?.some(r => r.role_id === roleId);

    if (hasRole) {
      removeRole.mutate({ tabId: selectedTab.id, roleId });
    } else {
      assignRole.mutate({ tabId: selectedTab.id, roleId });
    }
  };

  const seedDefaultTabs = () => {
    DEFAULT_TAB_CATEGORIES.forEach((cat, index) => {
      createTab.mutate({
        facility_id: FACILITY_ID,
        tab_name: cat.tab_name,
        tab_key: cat.tab_key,
        icon: cat.icon,
        is_required: false,
        is_active: index < 5, // Enable first 5 by default
        display_order: index,
        form_template_id: null,
      });
    });
  };

  const selectedTabRoles = selectedTab 
    ? tabs.find(t => t.id === selectedTab.id)?.roles ?? [] 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Daily Report Tab Configuration</h2>
          <p className="text-muted-foreground">
            Configure up to 15 tabs for different facility areas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Report Tabs ({tabs.length}/15)</CardTitle>
          <div className="flex gap-2">
            {tabs.length === 0 && (
              <Button variant="outline" onClick={seedDefaultTabs} disabled={isSubmitting}>
                Seed Defaults
              </Button>
            )}
            <Button onClick={openCreateDialog} disabled={tabs.length >= 15 || isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tab
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tabs...</div>
          ) : tabs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tabs configured. Click "Seed Defaults" to get started with default categories.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={tabs.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <SortableTabItem
                      key={tab.id}
                      tab={tab}
                      onEdit={() => openEditDialog(tab)}
                      onDelete={() => handleDeleteTab(tab)}
                      onManageRoles={() => openRolesDialog(tab)}
                      onToggleActive={(active) => updateTab.mutate({ id: tab.id, is_active: active })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTab ? "Edit Tab" : "Create New Tab"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab_name">Tab Name</Label>
              <Input
                id="tab_name"
                value={formData.tab_name}
                onChange={(e) => setFormData({ ...formData, tab_name: e.target.value })}
                placeholder="e.g., Front Desk Operations"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tab_key">Tab Key (unique identifier)</Label>
              <Input
                id="tab_key"
                value={formData.tab_key}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tab_key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                })}
                placeholder="e.g., front_desk"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAB_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(v) => setFormData({ ...formData, is_required: v })}
              />
              <Label htmlFor="is_required">Required tab (must be completed each shift)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTab} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roles Dialog */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Role Visibility</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select which roles can see and complete this tab. Leave empty for all roles.
            </p>
            <div className="space-y-2">
              {roles.map((role) => {
                const isAssigned = selectedTabRoles.some(r => r.role_id === role.id);
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span>{role.name}</span>
                    </div>
                    <Switch
                      checked={isAssigned}
                      onCheckedChange={() => handleToggleRole(role.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRolesDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyReportTabConfig;
