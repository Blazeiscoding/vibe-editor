import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "../types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Code, User } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Format dates for display
  const createdAtFormatted = formatDistanceToNow(new Date(project.createdAt), {
    addSuffix: true,
  });

  // Get template icon based on template type
  const getTemplateIcon = (template: string) => {
    switch (template.toUpperCase()) {
      case "REACT":
        return "/react-icon.png";
      case "NEXTJS":
        return "/nextjs-icon.png";
      case "EXPRESS":
        return "/express-icon.png";
      default:
        return "/placeholder.svg";
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:bg-white/5 transition-all duration-300 group cursor-pointer relative">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-secondary/50 border border-white/5"
            >
              <Image
                src={getTemplateIcon(project.template) || "/placeholder.svg"}
                alt={project.template}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <Badge
                variant="outline"
                className="mt-1 border-primary/20 text-primary bg-primary/5"
              >
                {project.template}
              </Badge>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-background shadow-sm ring-1 ring-border">
              <Image
                src={project.user.image || "/placeholder.svg"}
                alt={project.user.name ?? "User avatar"}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2 min-h-[3rem]">{project.description}</p>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <User size={14} className="text-primary/70" />
            <span>{project.user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-primary/70" />
            <span>Created {createdAtFormatted}</span>
          </div>
          <div className="flex items-center gap-2">
            <Code size={14} className="text-primary/70" />
            <span className="font-mono text-xs opacity-70">ID: {project.id.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
