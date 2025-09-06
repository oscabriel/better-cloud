import { Button } from "@client/components/ui/button";
import { Card, CardContent } from "@client/components/ui/card";
import { Input } from "@client/components/ui/input";
import { useAppForm } from "@client/components/ui/tanstack-form";
import { trpc } from "@client/lib/trpc-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// Define user profile interface
interface UserProfile {
	id: string;
	name: string | null;
	email: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: string | Date;
	updatedAt: string | Date;
}

const FormSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(50, "Name cannot be longer than 50 characters"),
});

function getInitials(
	name: string | null | undefined,
	email: string | null | undefined,
): string {
	if (name && name.length > 0) {
		return name
			.split(" ")
			.map((part) => part[0])
			.join("")
			.toUpperCase();
	}
	if (email && email.length > 0) {
		return email.split("@")[0].slice(0, 2).toUpperCase();
	}
	return "??";
}

export function Profile() {
	const [isEditing, setIsEditing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const profile = useQuery(trpc.user.getProfile.queryOptions());
	const updateMutation = useMutation(
		trpc.user.updateProfile.mutationOptions({
			onSuccess: () => {
				profile.refetch();
				setIsEditing(false);
				toast.success("Profile updated successfully");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update profile");
			},
		}),
	);

	const form = useAppForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onChange: FormSchema,
		},
		onSubmit: async ({ value }) => {
			if (profile.data) {
				// Type assertion with a specific type
				const userData = profile.data as unknown as UserProfile;
				updateMutation.mutate({
					name: value.name.trim(),
					image: userData.image || undefined,
				});
			}
		},
	});

	// Update form when profile data loads
	if (profile.data) {
		const userData = profile.data as unknown as UserProfile;
		// Only update the form if we haven't edited the name yet
		if (form.getFieldValue("name") === "") {
			form.setFieldValue("name", userData.name || "New User");
		}
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		// Create an image element to check dimensions
		const img = new Image();
		img.src = URL.createObjectURL(file);
		img.onload = () => {
			if (img.width > 512 || img.height > 512) {
				toast.error("Image must be 512x512 pixels or smaller");
				return;
			}

			const reader = new FileReader();
			reader.onload = async (e) => {
				const base64Image = e.target?.result as string;
				if (!profile.data) return;

				// Type assertion with a specific type
				const userData = profile.data as unknown as UserProfile;
				updateMutation.mutate({
					name: userData.name || "New User",
					image: base64Image,
				});
			};
			reader.readAsDataURL(file);
		};
	};

	return (
		<div className="container mx-auto w-full min-w-0 max-w-[90vw] px-3 py-2 sm:max-w-2xl sm:px-4 md:max-w-3xl">
			<div className="mx-auto w-full max-w-xl space-y-8">
				<div className="space-y-4">
					<div className="space-y-2 text-center">
						<h1 className="font-bold text-4xl">Profile</h1>
					</div>

					<Card className="overflow-hidden p-3 sm:p-2">
						{profile.isLoading ? (
							<CardContent className="flex items-center justify-center py-4">
								<div className="text-center text-muted-foreground">
									<Loader2 className="mx-auto mb-1 animate-spin" />
									Loading profile...
								</div>
							</CardContent>
						) : !profile.data ? (
							<CardContent className="py-3">
								<div className="text-center text-muted-foreground">
									Profile not available
								</div>
							</CardContent>
						) : (
							<CardContent className="px-4 py-4 sm:px-4 sm:py-3">
								{/* Type assertion with a specific type */}
								{(() => {
									const userData = profile.data as unknown as UserProfile;
									return (
										<div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
											<div className="group relative flex-shrink-0">
												<div
													className={`relative h-24 w-24 overflow-hidden rounded-full bg-muted sm:h-20 sm:w-20 ${isEditing ? "ring-2 ring-primary ring-offset-2" : ""}`}
												>
													{userData.image ? (
														<img
															src={userData.image}
															alt={userData.name || "User"}
															className="h-full w-full rounded-full object-cover"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center rounded-full bg-primary font-bold text-3xl text-primary-foreground sm:text-3xl">
															{getInitials(userData.name, userData.email)}
														</div>
													)}
													<Button
														variant="ghost"
														size="icon"
														className={`absolute inset-0 flex h-full w-full items-center justify-center bg-black/50 transition-opacity ${isEditing ? "opacity-100 hover:opacity-80" : "opacity-0 group-hover:opacity-100"}`}
														onClick={() => fileInputRef.current?.click()}
													>
														{isEditing ? (
															<Camera className="h-5 w-5 text-white" />
														) : (
															<span className="text-sm text-white">Change</span>
														)}
													</Button>
												</div>
												<input
													ref={fileInputRef}
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleFileChange}
												/>
											</div>
											<div className="w-full flex-1 text-center sm:text-left">
												{isEditing ? (
													<form.AppForm>
														<form
															onSubmit={(e) => {
																e.preventDefault();
																e.stopPropagation();
																void form.handleSubmit();
															}}
															className="space-y-4 sm:space-y-3"
														>
															<form.AppField name="name">
																{(field) => (
																	<field.FormItem>
																		<field.FormLabel>
																			Display Name
																		</field.FormLabel>
																		<field.FormControl>
																			<div className="relative">
																				<Input
																					value={field.state.value}
																					onChange={(e) =>
																						field.handleChange(e.target.value)
																					}
																					onBlur={field.handleBlur}
																					className="pr-12 text-base sm:text-lg"
																					maxLength={20}
																					disabled={updateMutation.isPending}
																				/>
																				<span className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground text-xs sm:text-sm">
																					{field.state.value.length}/20
																				</span>
																			</div>
																		</field.FormControl>
																		<field.FormMessage />
																	</field.FormItem>
																)}
															</form.AppField>
															<div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
																<form.Subscribe>
																	{(state) => (
																		<Button
																			type="submit"
																			className="w-full sm:w-auto"
																			disabled={
																				!state.canSubmit ||
																				state.isSubmitting ||
																				updateMutation.isPending
																			}
																		>
																			{updateMutation.isPending
																				? "Saving..."
																				: "Save"}
																		</Button>
																	)}
																</form.Subscribe>
																<Button
																	variant="outline"
																	className="w-full sm:w-auto"
																	onClick={() => {
																		setIsEditing(false);
																		form.setFieldValue(
																			"name",
																			userData.name || "New User",
																		);
																	}}
																>
																	Cancel
																</Button>
															</div>
														</form>
													</form.AppForm>
												) : (
													<div className="space-y-1 sm:space-y-0.5">
														<div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
															<div className="space-y-1">
																<h3 className="font-semibold text-2xl leading-tight sm:text-2xl">
																	{userData.name || "New User"}
																</h3>
																<p className="text-muted-foreground text-sm sm:text-base">
																	{userData.email}
																</p>
																<p className="text-muted-foreground/50 text-xs italic sm:text-sm">
																	Member since{" "}
																	{new Date(
																		userData.createdAt,
																	).toLocaleDateString()}
																</p>
															</div>
															<Button
																variant="outline"
																size="sm"
																className="flex-shrink-0 self-center sm:self-start"
																onClick={() => setIsEditing(true)}
															>
																Edit
															</Button>
														</div>
													</div>
												)}
											</div>
										</div>
									);
								})()}
							</CardContent>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}
