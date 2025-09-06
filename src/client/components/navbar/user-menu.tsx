import { Link } from "@tanstack/react-router";
import { LogOutIcon, UserCircleIcon } from "lucide-react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/client/components/ui/avatar";
import { Button } from "@/client/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { authClient } from "@/client/lib/auth-client";

export function UserMenu() {
	const { data: session } = authClient.useSession();

	if (!session || !session.user) {
		return (
			<Button variant="outline" asChild>
				<Link to="/sign-in">Sign In</Link>
			</Button>
		);
	}

	// Get user initials for avatar fallback
	const getUserInitials = () => {
		if (!session.user.name) return "U";
		return session.user.name
			.split(" ")
			.map((name: string) => name[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Account</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg">
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage
								src={session.user.image || ""}
								alt={session.user.name || "User"}
							/>
							<AvatarFallback className="rounded-lg">
								{getUserInitials()}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">
								{session.user.name || "User"}
							</span>
							<span className="truncate text-muted-foreground text-xs">
								{session.user.email}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link to="/profile">
							<UserCircleIcon className="mr-2 size-4" />
							Profile
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						authClient.signOut();
					}}
				>
					<LogOutIcon className="mr-2 size-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
