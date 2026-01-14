import { useEffect, useRef, useState } from "react";
import { Image, Button, Avatar, Skeleton } from "@heroui/react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import SwitchTheme from "./Switch";
import Logo from "../assets/logo2.png";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const NavbarSide = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { userPhotoUrl } = useAuth();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsMenuOpen(false);
    try {
      sessionStorage.setItem("lifelog:skipAuthModal", Date.now().toString());
    } catch {
      // ignore storage errors
    }
    try {
      await signOut(auth);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsAuthenticated(false);
      navigate("/home");
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    let active = true;
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!active) return;
      if (currentUser) {
        setIsAuthenticated(true);
        setUserName(
          currentUser.displayName ||
            currentUser.email?.split("@")?.[0] ||
            "Account"
        );
        setLoading(false);
      } else {
        setIsAuthenticated(false);
        setUserName("");
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-30 w-full text-slate-900 dark:text-white bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center justify-center ">
          <Link to="/home">
            {loading ? (
              <Skeleton className="w-[140px] rounded-lg" />
            ) : (
              <Image
                src={Logo}
                alt="LifeLog logo"
                className="w-[140px] dark:invert transition-all"
              />
            )}
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-4 px-4 py-2.5 rounded-full glass-panel-soft border border-white/20 dark:border-white/10 shadow-[0_12px_30px_rgba(15,32,65,0.12)]">
          <SwitchTheme />
          {/** 
          <Link
            to="/pricing"
            className="text-sm font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:inline"
          >
            Pricing
              </Link>
              */}
          {loading ? (
            <Button
              size="sm"
              variant="flat"
              className="px-4 glass-chip text-slate-900 dark:text-white"
            >
              <Skeleton />
            </Button>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex items-center justify-center rounded-full ring-2 ring-[#0072F5]/20 hover:ring-[#5EA2EF]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[#5EA2EF]"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                >
                  <Avatar
                    className="w-9 h-9 rounded-full text-medium"
                    showFallback
                    src={userPhotoUrl || undefined}
                    alt="avatar"
                    name={
                      userName?.charAt(0)?.toUpperCase() ||
                      auth.currentUser?.displayName?.charAt(0)?.toUpperCase()
                    }
                  />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-44 rounded-2xl border border-white/15 bg-white/10 dark:bg-black/30 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 glass-panel-soft">
                    <h1 className="px-3 py-2 text-sm font-medium">
                      Hey, {userName.at(0).toUpperCase() + userName.slice(1)}
                    </h1>
                    <hr className="my-2 border-white/10" />

                    <Link
                      to="/profile"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-left ${
                        isSigningOut
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-red-600/20 hover:text-red-400"
                      }`}
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      aria-busy={isSigningOut}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>

              {/*}  <Link
                to="/profile"
                className="text-sm font-medium text-slate-900 dark:text-white hidden sm:inline"
                onClick={() => setIsMenuOpen(false)}
              >
                {userName}
                </Link>
              */}
              <Button
                size="sm"
                variant="flat"
                className="px-4 glass-chip text-slate-900 dark:text-white hover:-translate-y-0.5 transition-transform"
                onPress={handleSignOut}
                isLoading={isSigningOut}
                isDisabled={isSigningOut}
              >
                Log Out
              </Button>
            </div>
          ) : (
            <Link to="/auth?mode=signin">
              <Button
                size="sm"
                variant="flat"
                className="px-4 glass-chip text-slate-900 dark:text-white hover:-translate-y-0.5 transition-transform"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavbarSide;
