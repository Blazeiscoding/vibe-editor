import { getAllPlaygroundForUser } from "@/features/playground/actions";
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
