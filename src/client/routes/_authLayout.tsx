import { Loader } from "@client/components/navbar/loader";
import { authClient } from "@client/lib/auth-client";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authLayout")({
	component: AuthLayout,
});

function AuthLayout() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Loader />;
	}

	if (!session?.user) {
		return <Outlet />;
	}

	return <Navigate to="/" />;
}
