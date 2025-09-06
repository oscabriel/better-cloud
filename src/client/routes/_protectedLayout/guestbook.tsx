import { createFileRoute } from "@tanstack/react-router";
import { Guestbook } from "./-components/guestbook";

export const Route = createFileRoute("/_protectedLayout/guestbook")({
	component: GuestbookPage,
});

function GuestbookPage() {
	return (
		<div className="container mx-auto w-full min-w-0 max-w-[90vw] px-3 py-2 sm:max-w-2xl sm:px-4 md:max-w-3xl">
			<Guestbook />
		</div>
	);
}
