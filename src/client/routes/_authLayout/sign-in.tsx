import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "./-components/sign-in-form";

export const Route = createFileRoute("/_authLayout/sign-in")({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="container mx-auto w-full min-w-0 max-w-[90vw] px-3 py-2 sm:max-w-2xl sm:px-4 md:max-w-3xl">
			<SignInForm />
		</div>
	);
}
