import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/client/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";
import { useAppForm } from "@/client/components/ui/tanstack-form";
import { authClient } from "@/client/lib/auth-client";
import { trpc } from "@/client/lib/trpc-client";
import type { GuestBookMessage } from "@/server/db/schema/guestbook";

const GuestbookSchema = z.object({
	name: z
		.string()
		.max(30, { message: "Name cannot be longer than 30 characters" }),
	message: z
		.string()
		.min(1, { message: "Message cannot be empty" })
		.max(50, { message: "Message cannot be longer than 50 characters" }),
});

export function Guestbook() {
	// Get session with automatic refetching on window focus
	const { data: session } = authClient.useSession();

	// Get user profile with automatic refetching on window focus
	const profile = useQuery({
		...trpc.user.getProfile.queryOptions(),
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		staleTime: 0, // Consider data stale immediately
	});

	const messages = useQuery({
		...trpc.guestbook.getAll.queryOptions(),
		refetchOnWindowFocus: true,
	});

	const createMutation = useMutation(
		trpc.guestbook.create.mutationOptions({
			onSuccess: () => {
				// Invalidate both messages and profile queries
				messages.refetch();
				profile.refetch();
				form.reset();
			},
		}),
	);

	const updateProfileMutation = useMutation(
		trpc.user.updateProfile.mutationOptions({
			onSuccess: () => {
				profile.refetch();
			},
		}),
	);

	const form = useAppForm({
		validators: { onChange: GuestbookSchema },
		defaultValues: {
			name: "",
			message: "",
		},
		onSubmit: ({ value }) => {
			// Use profile data if available, fallback to session, then form value
			const displayName =
				profile.data?.name || session?.user?.name || value.name || "Anonymous";

			// If the user is logged in and they've entered a new name, update their profile
			if (
				session?.user &&
				value.name &&
				!profile.data?.name &&
				!session.user.name
			) {
				updateProfileMutation.mutate({
					name: value.name,
				});
			}

			createMutation.mutate({
				name: displayName,
				message: value.message,
			});
		},
	});

	return (
		<div className="container mx-auto w-full min-w-0 max-w-[90vw] px-3 py-2 sm:max-w-2xl sm:px-4 md:max-w-3xl">
			<div className="mx-auto w-full max-w-xl space-y-8">
				<div className="space-y-4">
					<div className="space-y-2 text-center">
						<h1 className="font-bold text-4xl">Guestbook</h1>
						<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
							Powered by Cloudflare D1.
						</p>
					</div>

					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-4"
						>
							{!profile.data?.name && !session?.user?.name && (
								<form.AppField name="name">
									{(field) => (
										<field.FormItem>
											<field.FormControl>
												<div className="relative">
													<Input
														placeholder="Your Name"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														maxLength={30}
													/>
													{field.state.value.length >= 25 && (
														<span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-sm">
															{field.state.value.length}/30
														</span>
													)}
												</div>
											</field.FormControl>
											<field.FormMessage />
										</field.FormItem>
									)}
								</form.AppField>
							)}

							{(profile.data?.name || session?.user?.name) && (
								<div className="group relative">
									<Input
										placeholder="Your Name"
										value={profile.data?.name || session?.user?.name}
										disabled
										className="cursor-not-allowed"
									/>
									<div className="-top-2 absolute left-2 rounded bg-primary px-2 py-0.5 text-primary-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
										Visit your{" "}
										<Link to="/profile" className="underline">
											profile
										</Link>{" "}
										to change your name
									</div>
								</div>
							)}

							<form.AppField name="message">
								{(field) => (
									<field.FormItem>
										<field.FormControl>
											<div className="relative">
												<Input
													placeholder="Write a short message..."
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													maxLength={50}
												/>
												<span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-sm">
													{field.state.value.length}/50
												</span>
											</div>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							</form.AppField>

							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? "Adding..." : "Add Message"}
							</Button>
						</form>
					</form.AppForm>
				</div>

				<div className="space-y-4">
					{messages.isLoading ? (
						<p className="text-center">Loading messages...</p>
					) : messages.error ? (
						<p className="text-center text-red-500">Error loading messages</p>
					) : messages.data?.length === 0 ? (
						<p className="text-center text-muted-foreground">
							No guestbook messages. Be the first!
						</p>
					) : (
						messages.data?.map((msg: GuestBookMessage) => (
							<Card key={msg.id} className="gap-0 py-3">
								<CardHeader>
									<div className="flex items-start justify-between">
										<CardTitle className="font-bold text-xl">
											{msg.name}
										</CardTitle>
										<time className="text-muted-foreground text-sm">
											{new Date(msg.createdAt).toLocaleDateString()}
										</time>
									</div>
								</CardHeader>
								<CardContent>
									<p>{msg.message}</p>
									{msg.country && (
										<p className="mt-2 text-muted-foreground text-sm">
											From: {msg.country}
										</p>
									)}
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>
		</div>
	);
}
