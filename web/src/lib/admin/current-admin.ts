import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

/**
 * Returns the current admin user. Redirects to /krishi-console/login
 * if not logged in or not an admin.
 *
 * Use in Server Components and admin API routes.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/krishi-console/login");
  }

  return user;
}

/**
 * Non-redirecting variant — returns null if not an admin.
 * Use in route handlers where you want to return a 401/403 JSON response.
 */
export async function getCurrentAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}