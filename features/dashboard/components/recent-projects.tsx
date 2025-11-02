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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Projects
        </CardTitle>
        <CardDescription>
          Quick access to your recently used projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentProjects.map((project) => (
            <Link
              key={project.id}
              href={`/playground/${project.id}`}
              className="block"
            >
              <div className="group flex items-center justify-between p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.title}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {project.template}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {project.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
