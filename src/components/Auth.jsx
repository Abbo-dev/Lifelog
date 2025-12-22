import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input, Image, Button, Checkbox, Alert } from "@heroui/react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import SwitchTheme from "./Switch";
import Logo from "../assets/logo2.png";
import EmailIcon from "../assets/email.svg";
import UserIcon from "../assets/userName.svg";
import Eye from "../assets/eye.svg";
import EyeOff from "../assets/eye-slash.svg";
import Google from "../assets/google.svg";
import Facebook from "../assets/facebook.svg";
import X from "../assets/x.png";

const normalizeMode = (value) => (value === "signup" ? "signup" : "signin");

const getGreeting = () => {
  const hours = new Date().getHours();
  if (hours < 12) return "Good morning";
  if (hours < 18) return "Good afternoon";
  return "Good evening";
};

const getAuthErrorMessage = (error) => {
  switch (error?.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "That email is already in use. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was canceled.";
    case "auth/account-exists-with-different-credential":
      return "An account exists with this email using a different sign-in method.";
    default:
      return "Something went wrong. Please try again.";
  }
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = normalizeMode(searchParams.get("mode"));
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (!searchParams.get("mode")) {
      setSearchParams({ mode: "signin" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setError("");
    setLoading(false);
    setShowPassword(false);
    setPassword("");
    if (mode === "signin") setUsername("");
  }, [mode]);

  const handleModeToggle = () => {
    setSearchParams({ mode: isSignup ? "signin" : "signup" });
  };

  const handleProviderSignIn = async (provider) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const trimmedEmail = email.trim();

      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );
        const trimmedName = username.trim();
        if (trimmedName) {
          await updateProfile(userCredential.user, { displayName: trimmedName });
        }
        navigate("/home");
        return;
      }

      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const leftTitle = isSignup ? "Join LifeLog" : "Welcome back";
  const leftSubtitle = isSignup
    ? "Create your account and start logging."
    : "Sign in to your account to continue.";

  const authInputClassNames = {
    label: "mb-3",
  };

  return (
    <div className="w-full flex justify-center px-4 pt-16 pb-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] shadow-[0_35px_90px_rgba(0,0,0,0.35)] bg-white/95 dark:bg-[#071a33]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <section className="relative overflow-hidden px-8 py-10 md:px-10 md:py-12 text-white bg-gradient-to-br from-[#0072F5] via-[#5EA2EF] to-[#9353D3]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute top-16 -right-16 w-56 h-56 rounded-full bg-black/10 blur-2xl" />
              <div className="absolute bottom-10 left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            </div>

            <div className="relative z-10 flex flex-col h-full min-h-[260px]">
              <div className="flex items-start justify-between gap-4">
                <Link to="/" className="inline-flex items-center gap-2">
                  <Image
                    src={Logo}
                    alt="LifeLog"
                    className="w-[130px] invert"
                  />
                </Link>
                <div className="md:hidden">
                  <SwitchTheme />
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
                  {leftTitle}
                </h2>
                <p className="mt-3 text-white/85 text-sm md:text-base max-w-sm">
                  {leftSubtitle}
                </p>
              </div>

              <div className="mt-auto pt-10">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">
                  lifelog.app
                </p>
              </div>
            </div>

            <svg
              aria-hidden="true"
              className="hidden md:block pointer-events-none absolute bottom-[-1px] left-[-1px] w-[calc(100%+2px)]"
              viewBox="0 0 800 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,48 C160,116 310,0 470,56 C590,98 690,92 800,24 L800,120 L0,120 Z"
                className="fill-white/95 dark:fill-[#071a33]"
              />
            </svg>
          </section>

          <section className="relative px-8 py-10 md:px-12 md:py-12 bg-white/95 dark:bg-[#071a33] text-slate-900 dark:text-white">
            <div className="hidden md:flex absolute right-6 top-6">
              <SwitchTheme />
            </div>

            <div className="space-y-7">
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Hello!
                </p>
                <p className="text-sm font-semibold text-[#0072F5]">
                  {greeting}
                </p>
              </div>

              <div className="space-y-2">
                <h1 className="text-lg font-semibold">
                  <span className="text-[#0072F5]">
                    {isSignup ? "Create" : "Login"}
                  </span>{" "}
                  {isSignup ? "your account" : "your account"}
                </h1>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  {isSignup
                    ? "It only takes a minute."
                    : "Enter your credentials below."}
                </p>
              </div>

              {error && (
                <Alert
                  type="error"
                  color="danger"
                  title="Error"
                  description={error}
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-9 pt-4">
                {isSignup && (
                  <Input
                    isRequired
                    variant="underlined"
                    label="Username"
                    labelPlacement="outside"
                    placeholder="Your name"
                    value={username}
                    isDisabled={loading}
                    onChange={(e) => setUsername(e.target.value)}
                    classNames={authInputClassNames}
                    endContent={
                      <Image src={UserIcon} alt="" className="w-6 h-6 opacity-70" />
                    }
                  />
                )}

                <Input
                  isRequired
                  variant="underlined"
                  label="Email Address"
                  labelPlacement="outside"
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  isDisabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  classNames={authInputClassNames}
                  endContent={
                    <Image src={EmailIcon} alt="" className="w-6 h-6 opacity-70" />
                  }
                />

                <Input
                  isRequired
                  variant="underlined"
                  label="Password"
                  labelPlacement="outside"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  isDisabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  classNames={authInputClassNames}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="cursor-pointer flex items-center"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Image
                        src={showPassword ? EyeOff : Eye}
                        alt=""
                        className="w-6 h-6 opacity-70"
                      />
                    </button>
                  }
                />

                <div className="flex items-center justify-between gap-3">
                  {!isSignup ? (
                    <Checkbox
                      size="sm"
                      isSelected={rememberMe}
                      onValueChange={setRememberMe}
                      className="text-xs text-slate-600 dark:text-white/70"
                    >
                      Remember
                    </Checkbox>
                  ) : (
                    <span />
                  )}

                  {!isSignup && (
                    <Link
                      to="/forgetpassword"
                      className="text-xs text-slate-600 dark:text-white/70 hover:text-[#0072F5] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full rounded-md bg-gradient-to-r from-[#0072F5] to-[#9353D3] text-white font-semibold tracking-[0.28em] uppercase"
                >
                  {isSignup ? "Create" : "Submit"}
                </Button>

                <div className="text-center text-xs text-slate-600 dark:text-white/70">
                  {isSignup ? "Already have an account?" : "New here?"}{" "}
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="text-[#0072F5] hover:underline font-medium"
                  >
                    {isSignup ? "Sign in" : "Create account"}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                  <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-white/50">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="flat"
                    isDisabled={loading}
                    onPress={() => handleProviderSignIn(new GoogleAuthProvider())}
                    className="h-12 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
                    aria-label="Continue with Google"
                  >
                    <Image src={Google} alt="" className="w-6 h-6" />
                  </Button>
                  <Button
                    type="button"
                    variant="flat"
                    isDisabled={loading}
                    onPress={() => handleProviderSignIn(new TwitterAuthProvider())}
                    className="h-12 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
                    aria-label="Continue with X"
                  >
                    <Image src={X} alt="" className="w-6 h-6" />
                  </Button>
                  <Button
                    type="button"
                    variant="flat"
                    isDisabled={loading}
                    onPress={() => handleProviderSignIn(new FacebookAuthProvider())}
                    className="h-12 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
                    aria-label="Continue with Facebook"
                  >
                    <Image src={Facebook} alt="" className="w-6 h-6" />
                  </Button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
