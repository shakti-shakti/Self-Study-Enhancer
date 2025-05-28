
"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { Logo } from "@/components/icons/logo";
import { navItems } from "./sidebar-nav-items";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }
  
  const handleLogout = () => {
    logout();
    router.push("/login");
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader className="p-4">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <Logo className="hidden group-data-[collapsible=icon]:flex !space-x-0 justify-center" />
        </SidebarHeader>
        <SidebarContent asChild>
          <ScrollArea className="flex-1">
            <SidebarMenu className="px-2 py-4">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={item.exactMatch ? pathname === item.href : pathname.startsWith(item.href)}
                      disabled={item.disabled}
                      className={cn(
                        "w-full justify-start",
                        (item.exactMatch ? pathname === item.href : pathname.startsWith(item.href)) 
                          ? "bg-primary/10 text-primary hover:bg-primary/20" 
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
           <SidebarMenuButton
            onClick={handleLogout}
            tooltip="Log Out"
            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive"
            >
            <LogOut className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block ml-2">
              {/* Breadcrumbs or page title can go here */}
               <h1 className="text-xl font-semibold">
                {navItems.find(item => item.exactMatch ? pathname === item.href : pathname.startsWith(item.href))?.title || "Page"}
              </h1>
            </div>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
