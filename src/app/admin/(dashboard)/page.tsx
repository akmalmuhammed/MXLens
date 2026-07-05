import { requireAdmin } from "@/lib/admin/auth";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboard() {
    await requireAdmin();

    return <AdminDashboardClient />;
}
