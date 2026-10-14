"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;

    // Simple validation
    if (!name || name.length < 2) {
        return { error: "Name must be at least 2 characters" };
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: { name },
        });

        revalidatePath("/settings/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { error: "Failed to update profile" };
    }
}
