import AddNewButton from "@/features/dashboard/components/add-new-btn";
import AddRepo from "@/features/dashboard/components/add-repo";
import ProjectTable from "@/features/dashboard/components/project-table";
import { RecentProjects } from "@/features/dashboard/components/recent-projects";
import { getAllPlaygroundForUser } from "@/features/playground/actions";
import { EmptyState } from "@/components/empty-state";
import { DashboardClient } from "@/features/dashboard/components/dashboard-client";

// Force dynamic rendering to avoid auth errors during static build
export const dynamic = 'force-dynamic';

const DashboardMainPage = async () => {
  const playgrounds = await getAllPlaygroundForUser();
  const projects = (playgrounds || []).map((p) => ({
    ...p,
    description: p.description ?? "",
  }));

  return (
    <DashboardClient
      projects={projects}
      initialProjects={projects}
    />
  );
};

export default DashboardMainPage;