import { createFileRoute } from "@tanstack/react-router";
import { Profile } from "./-components/profile";

export const Route = createFileRoute("/_protectedLayout/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	return (
		<div className="container mx-auto w-full min-w-0 max-w-[90vw] px-3 py-2 sm:max-w-2xl sm:px-4 md:max-w-3xl">
			<Profile />
		</div>
	);
}
