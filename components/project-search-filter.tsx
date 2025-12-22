"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import type { Project } from "@/features/dashboard/types";

interface ProjectSearchFilterProps {
  projects: Project[];
  onFilteredProjectsChange: (filtered: Project[]) => void;
}

export function ProjectSearchFilter({
  projects,
  onFilteredProjectsChange,
}: ProjectSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const filteredAndSorted = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.template.toLowerCase().includes(query)
      );
    }

    // Template filter
    if (templateFilter !== "all") {
      filtered = filtered.filter(
        (project) => project.template === templateFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, templateFilter, sortBy]);

  // Notify parent of filtered results (use useEffect, not useMemo)
  useEffect(() => {
    onFilteredProjectsChange(filteredAndSorted);
  }, [filteredAndSorted, onFilteredProjectsChange]);

  const hasActiveFilters = searchQuery || templateFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTemplateFilter("all");
  };

  const templates = Array.from(
    new Set(projects.map((p) => p.template))
  ).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, description, or template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Template Filter */}
        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template} value={template}>
                {template}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) =>
            setSortBy(value as "newest" | "oldest" | "name")
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {filteredAndSorted.length} of {projects.length} projects
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

