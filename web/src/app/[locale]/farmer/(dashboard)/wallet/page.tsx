import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWallet } from "@/lib/wallet";
import { WalletView } from "@/components/wallet/WalletView";

export const dynamic = "force-dynamic";

export default async function FarmerWalletPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const wallet = await getWallet(user.id);
  return (
    <WalletView
      wallet={wallet}
      basePath="/farmer/wallet"
      investmentHref={(id) => `/farmer/investments/${id}`}
    />
  );
}
