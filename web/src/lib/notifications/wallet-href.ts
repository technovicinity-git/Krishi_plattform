/** Where each role's wallet lives. */
export function walletHref(role: string | null | undefined): string | null {
  switch (role) {
    case "investor":
      return "/portal/wallet";
    case "farmer":
      return "/farmer/wallet";
    case "steward":
      return "/steward/wallet";
    default:
      return null;
  }
}
