import { type Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermissionOrRedirect } from "@/server/auth/session";
import { getDashboardMetrics } from "@/server/actions/dashboard";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requirePermissionOrRedirect("report:view");

  const metrics = await getDashboardMetrics();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-center w-full">App Dashboard</h1>
      </div>

      <div className="flex justify-center w-full">
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-base bg-transparent hover:bg-accent/50">Sales</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col gap-1 p-3 w-48">
                  <Link href="/sales" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Sales order</NavigationMenuLink>
                  </Link>
                  <Link href="/sales/invoices" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Sale Invoice</NavigationMenuLink>
                  </Link>
                  <Link href="/sales/receipts" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Receipt</NavigationMenuLink>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-base bg-transparent hover:bg-accent/50">Purchase</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col gap-1 p-3 w-48">
                  <Link href="/purchases" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Purchase Order</NavigationMenuLink>
                  </Link>
                  <Link href="/purchases/bills" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Purchase Bill</NavigationMenuLink>
                  </Link>
                  <Link href="/purchases/payments" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Payment</NavigationMenuLink>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-base bg-transparent hover:bg-accent/50">Account</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col gap-1 p-3 w-56">
                  <Link href="/contacts" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Contact</NavigationMenuLink>
                  </Link>
                  <Link href="/products" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Product</NavigationMenuLink>
                  </Link>
                  <Link href="/analytic/accounts" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Analyticals</NavigationMenuLink>
                  </Link>
                  <Link href="/analytic/budgets" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Analytical Budget</NavigationMenuLink>
                  </Link>
                  <Link href="/accounts" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Chart of Account</NavigationMenuLink>
                  </Link>
                  <Link href="/journals" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Journals</NavigationMenuLink>
                  </Link>
                  <Link href="/journals/entries" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Journal Entries</NavigationMenuLink>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-base bg-transparent hover:bg-accent/50">Report</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col gap-1 p-3 w-48">
                  <Link href="/reports/balancesheet" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Balancesheet</NavigationMenuLink>
                  </Link>
                  <Link href="/reports/pnl" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Profit and Loss</NavigationMenuLink>
                  </Link>
                  <Link href="/reports/budget" legacyBehavior passHref>
                    <NavigationMenuLink className="block px-3 py-2 hover:bg-accent rounded-md text-sm">Budget Report</NavigationMenuLink>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="grid gap-6 md:max-w-3xl mx-auto">
        <Card className="shadow-md bg-card/60 backdrop-blur border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Sales</CardTitle>
            <Button size="sm">New</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">All</span>
                <span className="text-2xl font-bold">{metrics.sales.all}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Confirmed</span>
                <span className="text-2xl font-bold">{metrics.sales.confirmed}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Draft</span>
                <span className="text-2xl font-bold">{metrics.sales.draft}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-card/60 backdrop-blur border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Purchase</CardTitle>
            <Button size="sm">New</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">All</span>
                <span className="text-2xl font-bold">{metrics.purchase.all}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Confirmed</span>
                <span className="text-2xl font-bold">{metrics.purchase.confirmed}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Draft</span>
                <span className="text-2xl font-bold">{metrics.purchase.draft}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-card/60 backdrop-blur border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Budget Reports</CardTitle>
            <Button size="sm">Report</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Achieved</span>
                <span className="text-2xl font-bold">{metrics.budget.achieved}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Budget</span>
                <span className="text-2xl font-bold">{metrics.budget.planned}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-2xl shadow-sm bg-background">
                <span className="text-sm text-muted-foreground font-medium">Committed</span>
                <span className="text-2xl font-bold">{metrics.budget.committed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
