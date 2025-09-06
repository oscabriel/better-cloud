import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@client/components/ui/input-otp";
import { useAppForm } from "@client/components/ui/tanstack-form";
import { authClient } from "@client/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function SignInForm() {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();
	const [isOtpSent, setIsOtpSent] = useState(false);
	const [email, setEmail] = useState("");

	// Email OTP send mutation
	const sendOtpMutation = useMutation({
		mutationFn: async (email: string) => {
			return authClient.emailOtp.sendVerificationOtp({
				email,
				type: "sign-in",
			});
		},
		onSuccess: () => {
			setIsOtpSent(true);
			toast.success("Verification code sent to your email");
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error.error?.message || "Failed to send verification code");
		},
	});

	// Sign in with OTP mutation
	const verifyOtpMutation = useMutation({
		mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
			return authClient.signIn.emailOtp({ email, otp });
		},
		onSuccess: async () => {
			toast.success("Sign in successful");
			// Wait for session to be available
			const session = await authClient.getSession();
			if (session) {
				navigate({
					to: "/guestbook",
				});
			} else {
				toast.error("Failed to establish session");
			}
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error.error?.message || "Failed to verify code");
		},
	});

	// Social sign in mutations
	const socialSignInMutation = useMutation({
		mutationFn: async ({ provider }: { provider: "google" | "github" }) => {
			const callbackURL = import.meta.env.PROD
				? `${import.meta.env.VITE_FRONTEND_PROD_URL}/guestbook`
				: `${import.meta.env.VITE_FRONTEND_DEV_URL}/guestbook`;

			return authClient.signIn.social({
				provider,
				callbackURL,
			});
		},
		onSuccess: (_, variables) => {
			toast.success(`Successfully signed in with ${variables.provider}`);
		},
		onError: (error: { error?: { message?: string } }, variables) => {
			toast.error(
				error.error?.message || `Failed to sign in with ${variables.provider}`,
			);
			console.error(`${variables.provider} sign-in error:`, error);
		},
	});

	const emailForm = useAppForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onChange: z.object({
				email: z.string().email("Invalid email address"),
			}),
		},
		onSubmit: async ({ value }) => {
			setEmail(value.email);
			sendOtpMutation.mutate(value.email);
		},
	});

	const otpForm = useAppForm({
		defaultValues: {
			otp: "",
		},
		validators: {
			onChange: z.object({
				otp: z.string().min(6, "OTP must be at least 6 characters"),
			}),
		},
		onSubmit: async ({ value }) => {
			verifyOtpMutation.mutate({ email, otp: value.otp });
		},
	});

	const handleGoogleLogin = () => {
		socialSignInMutation.mutate({ provider: "google" });
	};

	const handleGithubLogin = () => {
		socialSignInMutation.mutate({ provider: "github" });
	};

	// Reset OTP form when verification fails
	if (verifyOtpMutation.isError) {
		otpForm.setFieldValue("otp", "");
		verifyOtpMutation.reset();
	}

	if (isPending) {
		return (
			<div className="mx-auto mt-10 w-full max-w-md p-6">
				<h1 className="mb-2 text-center font-bold text-3xl">Welcome ☁️</h1>
				<p className="mb-6 text-center text-muted-foreground">
					Choose a sign in method below.
				</p>
				{/* Render empty container while loading */}
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-2 text-center font-bold text-3xl">Welcome ☁️</h1>
			<p className="mb-6 text-center text-muted-foreground">
				Choose a sign in method below.
			</p>

			{!isOtpSent && (
				<>
					<emailForm.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void emailForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<emailForm.AppField name="email">
								{(field) => (
									<field.FormItem>
										<field.FormLabel>Email</field.FormLabel>
										<field.FormControl>
											<Input
												type="email"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												disabled={sendOtpMutation.isPending}
												placeholder="you@example.com"
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							</emailForm.AppField>

							<emailForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										className="w-full"
										disabled={
											!state.canSubmit ||
											state.isSubmitting ||
											sendOtpMutation.isPending
										}
									>
										{sendOtpMutation.isPending
											? "Sending code..."
											: "Send verification code"}
									</Button>
								)}
							</emailForm.Subscribe>
						</form>
					</emailForm.AppForm>

					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-gray-300 border-t dark:border-gray-600" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-background px-2 text-gray-500 dark:text-gray-400">
								Or continue with
							</span>
						</div>
					</div>

					<div className="space-y-4">
						<Button
							type="button"
							className="relative flex w-full items-center justify-center space-x-2 border border-gray-300 bg-background text-foreground hover:bg-accent dark:border-gray-600"
							onClick={handleGoogleLogin}
							disabled={socialSignInMutation.isPending}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="24"
								height="24"
								aria-hidden="true"
								role="img"
							>
								<title>Google Logo</title>
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span>Sign in with Google</span>
						</Button>

						<Button
							type="button"
							className="relative flex w-full items-center justify-center space-x-2 border border-gray-300 bg-background text-foreground hover:bg-accent dark:border-gray-600"
							onClick={handleGithubLogin}
							disabled={socialSignInMutation.isPending}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="currentColor"
								aria-hidden="true"
								role="img"
							>
								<title>GitHub Logo</title>
								<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
							</svg>
							<span>Sign in with GitHub</span>
						</Button>
					</div>
				</>
			)}

			{isOtpSent && (
				<otpForm.AppForm>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void otpForm.handleSubmit();
						}}
						className="space-y-4"
					>
						<p className="mb-4 text-center text-gray-600 text-sm">
							We've sent a verification code to{" "}
							<span className="font-medium">{email}</span>.
						</p>
						<otpForm.AppField name="otp">
							{(field) => (
								<field.FormItem>
									<field.FormLabel>Verification Code</field.FormLabel>
									<field.FormControl>
										<InputOTP
											value={field.state.value}
											onChange={(value) => field.handleChange(value)}
											onBlur={field.handleBlur}
											disabled={verifyOtpMutation.isPending}
											autoComplete="one-time-code"
											inputMode="numeric"
											pattern="[0-9]*"
											maxLength={6}
										>
											<InputOTPGroup className="justify-center">
												<InputOTPSlot
													key={0}
													index={0}
													className="h-10 w-10 text-xl"
												/>
												<InputOTPSlot
													key={1}
													index={1}
													className="h-10 w-10 text-xl"
												/>
												<InputOTPSlot
													key={2}
													index={2}
													className="h-10 w-10 text-xl"
												/>
												<InputOTPSlot
													key={3}
													index={3}
													className="h-10 w-10 text-xl"
												/>
												<InputOTPSlot
													key={4}
													index={4}
													className="h-10 w-10 text-xl"
												/>
												<InputOTPSlot
													key={5}
													index={5}
													className="h-10 w-10 text-xl"
												/>
											</InputOTPGroup>
										</InputOTP>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						</otpForm.AppField>

						<otpForm.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className="w-full"
									disabled={
										!state.canSubmit ||
										state.isSubmitting ||
										verifyOtpMutation.isPending
									}
								>
									{verifyOtpMutation.isPending
										? "Verifying..."
										: "Verify & Sign In"}
								</Button>
							)}
						</otpForm.Subscribe>

						<Button
							type="button"
							variant="link"
							className="w-full"
							onClick={() => {
								setIsOtpSent(false);
								otpForm.setFieldValue("otp", "");
							}}
							disabled={verifyOtpMutation.isPending}
						>
							Back to Email
						</Button>
					</form>
				</otpForm.AppForm>
			)}

			<div className="mt-8 text-center text-muted-foreground text-sm italic">
				Authentication powered by{" "}
				<a
					href="https://better-auth.com"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-muted-foreground underline hover:text-muted-foreground/80"
				>
					Better Auth
					<ExternalLink className="h-3 w-3" />
				</a>
				<br />
				and Cloudflare D1+KV
			</div>
		</div>
	);
}
