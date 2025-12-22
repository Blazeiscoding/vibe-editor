"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Keyboard,
  Bell,
  Palette,
  Save,
  ArrowLeft,
  Code,
  Loader2,
} from "lucide-react";
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
  defaultSettings,
  type UserSettings,
} from "@/hooks/queries/use-settings";
import { useState, useEffect } from "react";

export function SettingsClient() {
  const router = useRouter();

  // TanStack Query hooks
  const { data: settings, isLoading } = useSettingsQuery();
  const updateMutation = useUpdateSettingsMutation();

  // Local state for form (synced with server data)
  const [formData, setFormData] = useState<UserSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form with fetched settings
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  // Update form field
  const updateField = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData, {
      onSuccess: () => {
        setHasChanges(false);
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your preferences and customize your experience
          </p>
        </div>
      </div>

      {/* Editor Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Editor Preferences
          </CardTitle>
          <CardDescription>
            Customize your code editor experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={formData.editorFontSize.toString()}
              onValueChange={(v) => updateField("editorFontSize", parseInt(v))}
            >
              <SelectTrigger id="font-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tab-size">Tab Size</Label>
            <Select
              value={formData.editorTabSize.toString()}
              onValueChange={(v) => updateField("editorTabSize", parseInt(v))}
            >
              <SelectTrigger id="tab-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 4, 8].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} spaces
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Editor Theme</Label>
            <Select
              value={formData.editorTheme}
              onValueChange={(v) => updateField("editorTheme", v)}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vs-dark">Dark (VS Code)</SelectItem>
                <SelectItem value="vs-light">Light (VS Code)</SelectItem>
                <SelectItem value="hc-black">High Contrast Dark</SelectItem>
                <SelectItem value="hc-light">High Contrast Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="word-wrap">Word Wrap</Label>
            <Select
              value={formData.wordWrap}
              onValueChange={(v) =>
                updateField("wordWrap", v as UserSettings["wordWrap"])
              }
            >
              <SelectTrigger id="word-wrap">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="on">On</SelectItem>
                <SelectItem value="wordWrapColumn">
                  At Column (80 chars)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="minimap">Show Minimap</Label>
              <p className="text-sm text-muted-foreground">
                Display a minimap of the code on the right side
              </p>
            </div>
            <Switch
              id="minimap"
              checked={formData.minimap}
              onCheckedChange={(v) => updateField("minimap", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto Save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your work as you type
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={formData.autoSave}
              onCheckedChange={(v) => updateField("autoSave", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>
            Customize keyboard shortcuts (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keyboard shortcut customization will be available in a future
            update. Press{" "}
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
              ?
            </kbd>{" "}
            to view all available shortcuts.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for important events
              </p>
            </div>
            <Switch
              id="notifications"
              checked={formData.notifications}
              onCheckedChange={(v) => updateField("notifications", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-2">
        {hasChanges && (
          <p className="text-sm text-muted-foreground self-center mr-2">
            You have unsaved changes
          </p>
        )}
        <Button
          onClick={handleSave}
          size="lg"
          disabled={updateMutation.isPending || !hasChanges}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
