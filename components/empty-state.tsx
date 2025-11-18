"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  tips?: string[];
}

export function EmptyState({
  title = "No projects found",
  description = "Get started by creating your first playground",
  icon,
  action,
  tips,
}: EmptyStateProps) {
  const defaultIcon = (
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-muted-foreground" />
    </div>
  );

  const defaultAction = {
    label: "Create New Project",
    href: "/dashboard?action=new",
  };

  const defaultTips = [
    "Start with a template to get up and running quickly",
    "Import from GitHub to continue existing projects",
    "Explore different frameworks and libraries",
  ];

  const finalAction = action || defaultAction;
  const finalTips = tips || defaultTips;

  return (
    <Card className="w-full max-w-2xl mx-auto border-dashed">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {icon || defaultIcon}
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {finalAction.href ? (
          <Link href={finalAction.href}>
            <Button size="lg" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {finalAction.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button size="lg" className="w-full" onClick={finalAction.onClick}>
            <Plus className="mr-2 h-4 w-4" />
            {finalAction.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {finalTips.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Quick Tips</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {finalTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

