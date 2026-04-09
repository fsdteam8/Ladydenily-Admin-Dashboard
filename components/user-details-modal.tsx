"use client";

import type { User } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatAddress(address: User["address"]) {
  if (!address) return "N/A";
  if (typeof address === "string") return address || "N/A";

  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "N/A";
}

type UserDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  title?: string;
  description?: string;
};

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  title = "User Details",
  description = "View all available user information.",
}: UserDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user.avatar?.url || "/placeholder.svg"}
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  {user.name}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  @{user.username} | {formatValue(user.role)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Unique ID</p>
                <p className="font-medium">{formatValue(user.uniqueId)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{formatValue(user.phone)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">
                  {formatValue(user.gender)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{formatValue(user.age)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Nationality</p>
                <p className="font-medium">{formatValue(user.nationality)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Updated At</p>
                <p className="font-medium">{formatDate(user.updatedAt)}</p>
              </div>
              <div className="rounded-md border p-3 md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{formatAddress(user.address)}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
