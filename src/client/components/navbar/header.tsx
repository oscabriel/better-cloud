import { Link } from "@tanstack/react-router";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/client/components/navbar/theme-toggle";
import { UserMenu } from "@/client/components/navbar/user-menu";
import { Button } from "@/client/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { authClient } from "@/client/lib/auth-client";
import { GITHUB_REPO_URL } from "@/client/lib/constants";

export function Header() {
	const { data: session } = authClient.useSession();
	const [isOpen, setIsOpen] = useState(false);

	const links = session
		? [
				{ to: "/", label: "Home" },
				{ to: "/counter", label: "Counter" },
				{ to: "/guestbook", label: "Guestbook" },
			]
		: [{ to: "/", label: "Home" }];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				{/* Mobile Navigation Menu */}
				<div className="md:hidden">
					<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="flex items-center gap-1 text-lg"
							>
								Menu
								<ChevronDown
									className={`h-4 w-4 transition-transform duration-200 ${
										isOpen ? "rotate-180" : ""
									}`}
								/>
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{links.map(({ to, label }) => (
								<DropdownMenuItem key={to} asChild className="text-lg">
									<Link to={to} className="w-full">
										{label}
									</Link>
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild className="text-lg">
								<a
									href={GITHUB_REPO_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex w-full items-center gap-1"
								>
									Source
									<ExternalLink className="h-4 w-4" />
								</a>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Desktop Navigation */}
				<nav className="hidden items-center gap-1 md:flex">
					{links.map(({ to, label }) => (
						<Button key={to} className="text-lg" variant="ghost" asChild>
							<Link to={to}>{label}</Link>
						</Button>
					))}
					<Button className="mr-1 text-lg" variant="ghost" asChild>
						<a
							href={GITHUB_REPO_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1"
						>
							Source
							<ExternalLink className="h-4 w-4" />
						</a>
					</Button>
				</nav>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					{session ? (
						<UserMenu />
					) : (
						<Button variant="outline" asChild>
							<Link to="/sign-in">Sign In</Link>
						</Button>
					)}
				</div>
			</div>
			<hr />
		</div>
	);
}
