"use client"

import { Clock, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Project } from "../types"

interface RecentProjectsProps {
  projects: Project[]
  maxItems?: number
}

export function RecentProjects({ projects, maxItems = 5 }: RecentProjectsProps) {
  // Sort by most recently accessed/created and take top N
  const recentProjects = projects
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems)

  if (recentProjects.length === 0) {
    return null
  }

  return (
    <div className="glass-card rounded-xl w-full p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-primary" />
          Recent Projects
        </h3>
        <p className="text-sm text-muted-foreground">
          Quick access to your recently used projects
        </p>
      </div>
      <div>
        <div className="space-y-3">
          {recentProjects.map((project) => (
            <Link
              key={project.id}
              href={`/playground/${project.id}`}
              className="block"
            >
              <div className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <Badge variant="secondary" className="text-xs bg-secondary/50">
                      {project.template}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-200">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
