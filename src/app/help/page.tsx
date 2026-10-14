import { redirect } from "next/navigation";

export default function HelpHubPage() {
    // Redirecting to the existing resources help hub which is comprehensive
    redirect("/resources/help");
}
