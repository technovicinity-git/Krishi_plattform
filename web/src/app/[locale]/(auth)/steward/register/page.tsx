import { AuthCard } from "@/components/auth/AuthCard";
import { StewardRegisterForm } from "@/components/auth/StewardRegisterForm";

export default function StewardRegisterPage() {
  return (
    <AuthCard width="lg">
      <StewardRegisterForm />
    </AuthCard>
  );
}