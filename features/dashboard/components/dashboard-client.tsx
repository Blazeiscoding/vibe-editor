"use client";

import { useState, useEffect } from "react";
import AddNewButton from "@/features/dashboard/components/add-new-btn";
import AddRepo from "@/features/dashboard/components/add-repo";
import ProjectTable from "@/features/dashboard/components/project-table";
import { RecentProjects } from "@/features/dashboard/components/recent-projects";
import { EmptyState } from "@/components/empty-state";
import { ProjectSearchFilter } from "@/components/project-search-filter";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import type { Project } from "@/features/dashboard/types";

interface DashboardClientProps {
  projects: Project[];
  initialProjects: Project[];
}

export function DashboardClient({
  projects: initialProjects,
}: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(
    initialProjects
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Update projects when initialProjects changes
  useEffect(() => {
    setProjects(initialProjects);
    setFilteredProjects(initialProjects);
  }, [initialProjects]);

  // Keyboard shortcut for shortcuts panel
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <AddNewButton />
          <AddRepo />
        </div>

        {/* Recent Projects Section */}
        {projects && projects.length > 0 && (
          <div className="mt-8 w-full">
            <RecentProjects
              projects={projects}
              maxItems={5}
            />
          </div>
        )}

        {/* Search and Filter */}
        {projects && projects.length > 0 && (
          <div className="mt-8 w-full">
            <ProjectSearchFilter
              projects={projects}
              onFilteredProjectsChange={setFilteredProjects}
            />
          </div>
        )}

        <div className="mt-10 flex flex-col justify-center items-center w-full">
          {projects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description="Get started by creating your first playground or importing from GitHub"
              action={{
                label: "Create New Project",
                href: "/dashboard?action=new",
              }}
              tips={[
                "Start with a template to get up and running quickly",
                "Import from GitHub to continue existing projects",
                "Explore different frameworks and libraries",
              ]}
            />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title="No projects match your filters"
              description="Try adjusting your search or filter criteria"
              action={{
                label: "Clear Filters",
                onClick: () => {
                  setFilteredProjects(projects);
                },
              }}
            />
          ) : (
            <ProjectTable projects={filteredProjects} />
          )}
        </div>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <KeyboardShortcuts
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}

