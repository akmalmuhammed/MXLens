import { redirect } from "next/navigation";

export default function LimitReachedPage() {
    redirect("/analyze");
}
