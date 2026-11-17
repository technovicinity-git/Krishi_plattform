export interface MenuItem {
  label: string;
  href: string;
}

export function getMenuItemsForRole(role: string, locale?: string): MenuItem[] {
  const p = locale ? `/${locale}` : "";

  switch (role) {
    case "investor":
      return [
        { label: "Dashboard", href: `${p}/portal` },
        { label: "Profile", href: `${p}/portal/profile` },
        { label: "Account Settings", href: `${p}/portal/settings` },
      ];
    case "steward":
      return [
        { label: "Dashboard", href: `${p}/steward` },
        { label: "Farmers", href: `${p}/steward/farmers` },
        { label: "Account Settings", href: `${p}/steward/settings` },
      ];
    case "farmer":
      return [
        { label: "Dashboard", href: `${p}/farmer` },
        { label: "Account Settings", href: `${p}/farmer/settings` },
      ];
    case "admin":
      return [
        { label: "Admin Console", href: `/krishi-console` },
        { label: "Plans", href: `/krishi-console/plans` },
        { label: "KYC Reviews", href: `/krishi-console/kyc` },
        { label: "Stewards", href: `/krishi-console/stewards` },
      ];
    default:
      return [];
  }
}