import { useEffect, useState } from "react";
import { Image, Button, Avatar, Skeleton } from "@heroui/react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import SwitchTheme from "./Switch";
import Logo from "../assets/logo2.png";
import { auth } from "../firebase";

const NavbarSide = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
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
    return unsubscribe;
  }, []);

  return (
    <header className="w-full text-slate-900 dark:text-white bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center justify-center">
          <Link to="/">
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

        <div className="flex items-center gap-3 md:gap-4 px-3 py-2 rounded-full bg-[#f0f4fb] dark:bg-[#0f1f3a] border border-slate-200/70 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-black/30">
          <SwitchTheme />

          {loading ? (
            <Button className="w-20">
              <Skeleton />
            </Button>
          ) : isAuthenticated ? (
            <>
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar
                  className="w-8 h-8 rounded-full text-medium ring-2 ring-[#0072F5]/20"
                  src={auth.currentUser.photoURL}
                  alt="avatar"
                  name={
                    userName?.charAt(0)?.toUpperCase() ||
                    auth.currentUser.displayName?.charAt(0)?.toUpperCase()
                  }
                />
                <span className="text-sm font-medium text-slate-900 dark:text-white hidden sm:inline">
                  {userName}
                </span>
              </Link>
              <Button className="w-20" onPress={handleSignOut}>
                Log Out
              </Button>
            </>
          ) : (
            <Link to="/signin">
              <Button className="w-20">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavbarSide;
