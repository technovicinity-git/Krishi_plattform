import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CreateFarmerForm } from "@/components/steward/CreateFarmerForm";

export default async function NewFarmerPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/steward/farmers"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-secondary hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          Back to Farmers
        </Link>
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Add Farmer
        </h1>
      </div>

      <CreateFarmerForm />
    </div>
  );
}