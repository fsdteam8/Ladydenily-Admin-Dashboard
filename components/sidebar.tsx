"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react"; // Added useState for modal state
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  User,
  Radio,
  Gift,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Added Dialog imports
import Image from "next/image";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Trainer", href: "/trainer", icon: Users },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "User", href: "/user", icon: User },
  { name: "Signal Send", href: "/signal-send", icon: Radio },
  { name: "Offer", href: "/offer", icon: Gift },
];

const handleSignOut = () => {
  signOut({ callbackUrl: "/auth/login" });
};

export function Sidebar() {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Added state for modal

  return (
    <div className="flex h-screen w-52 flex-col bg-[#E8ECF1] border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center p-4">
        <Link href="/">
          <Image
            src="/LTA_LOGO.png"
            alt="Logo"
            width={100}
            height={100}
            className="w-[151px] h-[80px]"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors text-[#1A3E74]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-[#1A3E74] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-[#1A3E74]"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          className="text-[#1A3E74] flex items-center"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-[#1A3E74]" />
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="max-w-md rounded-lg shadow-lg bg-white p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold text-red-600">
              Are you sure you want to log out?
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-2">
              Logging out will end your current session. You'll need to sign in
              again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsLogoutModalOpen(false);
                handleSignOut();
              }}
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
