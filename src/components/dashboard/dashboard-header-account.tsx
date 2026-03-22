"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { isWeb3AuthConfigured } from "@/config/web3auth";

export function DashboardHeaderAccount() {
  const router = useRouter();
  const { disconnect, address, isConnected } = useWallet();

  const handleLogout = async () => {
    disconnect();
    router.push("/");
    router.refresh();
  };

  if (!isWeb3AuthConfigured) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/">Configure wallet</Link>
      </Button>
    );
  }

  if (!isConnected || !address) {
    return (
      <Button variant="default" size="sm" asChild>
        <Link href="/">Sign in</Link>
      </Button>
    );
  }

  const initials = address.slice(2, 4).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold outline-none ring-offset-background hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Account menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Connected wallet</p>
            <p className="font-mono text-xs break-all">{address}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Marketing site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => void handleLogout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
