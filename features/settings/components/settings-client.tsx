"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Keyboard, Bell, Palette, Save, ArrowLeft } from "lucide-react";

export function SettingsClient() {
  const router = useRouter();
  const [editorFontSize, setEditorFontSize] = useState("14");
  const [tabSize, setTabSize] = useState("2");
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // TODO: Save to database/user preferences
    toast.success("Settings saved successfully!");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
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
            <Select value={editorFontSize} onValueChange={setEditorFontSize}>
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
            <Select value={tabSize} onValueChange={setTabSize}>
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto Save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your work as you type
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
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
            Keyboard shortcut customization will be available in a future update.
            Press <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">?</kbd> to view all available shortcuts.
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
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

