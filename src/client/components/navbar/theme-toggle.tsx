import { Moon, Sun } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import { useTheme } from "@/client/lib/theme-provider";

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();

	return (
		<Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
			<Sun className="h-[1.5rem] w-[1.3rem] dark:hidden" />
			<Moon className="hidden h-5 w-5 dark:block" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
