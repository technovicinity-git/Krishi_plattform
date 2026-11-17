import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <Header
        user={
          user
            ? {
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
              }
            : null
        }
      />
      <main>{children}</main>
      <Footer />
    </>
  );
}