import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import Logo from "../assets/logo1.png";
import { Input, Image, Button, Divider, Alert, Skeleton } from "@heroui/react";
import SwitchTheme from "./Switch";
import X from "../assets/x.png";
import Google from "../assets/google.svg";
import Facebook from "../assets/facebook.svg";
import Eye from "../assets/eye.svg";
import EyeOff from "../assets/eye-slash.svg";
//import UserPic from "../assets/userName.svg"
import Email from "../assets/email.svg";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleXsignIn = async () => {
    try {
      const provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) {
      console.log(error);
    }
  };
  const handleFacebookSignIn = async () => {
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) {
      console.log(error);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) {
      console.log(error);
    }
  };
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(userCredential.user, {
        displayName: user.displayName,
      });

      navigate("/home");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("User not found");
        return;
      } else if (error.code === "auth/wrong-password") {
        setError("Wrong password");
        return;
      } else if (error.code === "auth/email-already-in-use") {
        setError("Email already in use");
        return;
      } else if (error.code === "auth/invalid-credential") {
        setError(
          "Invalid login credential. Please check your credentials and try again."
        );
        return;
      } else {
        setError("Something went wrong");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center  ">
      <Card className="w-full max-w-md m-5 pb-5 ">
        <CardHeader className="flex items-center justify-center">
          {loading ? (
            <Skeleton />
          ) : (
            <Link to="/">
              <Image
                src={Logo}
                alt="logo"
                className="w-40 dark:invert -mt-10"
              />
            </Link>
          )}
          <div className="mt-6">
            <SwitchTheme />
          </div>
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center">
          <div className="mb-4 flex flex-col items-center justify-center text-center max-w-[300px] mx-auto">
            {error && (
              <Alert
                className="flex items-center justify-center"
                type="error"
                color="danger"
                title="Error"
                description={error}
              />
            )}
          </div>

          <form
            onSubmit={handleSignIn}
            className="w-full flex flex-col items-center justify-center gap-5 pb-6 "
          >
            <Input
              className="max-w-[300px] "
              isRequired
              errorMessage="Please enter a valid email"
              label="Email"
              labelPlacement="outside"
              name="email"
              placeholder="Enter your email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              endContent={
                <Image src={Email} className="w-7 h-7 text-[#71717A]" />
              }
            />
            <Input
              className="w-[300px] "
              isRequired
              errorMessage="Please enter a valid password"
              label="Password"
              labelPlacement="outside"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              endContent={
                <>
                  <a
                    onClick={togglePassword}
                    className="cursor-pointer flex items-center"
                  >
                    {showPassword ? (
                      <Image src={EyeOff} className="w-7 h-7 text-[#71717A] " />
                    ) : (
                      <Image src={Eye} className="w-7 h-7  text-[#71717A]" />
                    )}
                  </a>
                </>
              }
            />

            <div className="pl-[180px] -mt-4 pt-1">
              <a
                href="/forgetpassword"
                className=" text-[13px] bg-transparent hover:underline text-blue-500 "
              >
                Forgot Password?
              </a>
            </div>
            {/*
              <div className="flex items-center justify-start gap-5">
                <div className="relative  ">
                  <input type="checkbox" className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
                </div>
                <p className="text-sm text-gray-500">Remember me</p>
              </div>*/}
            <Button type="submit" className="w-[300px] mt-5 text-center ">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 -mt-4 pb-6 ">
            Don&apos;t have an account?
            <a href="/signup" className="text-blue-500 hover:underline">
              {" "}
              Create one
            </a>
          </p>
          <div className="flex items-center justify-around">
            <Divider className="w-[150px] " />
            <p className="mx-5"> OR</p>
            <Divider className="w-[150px] " />
          </div>
        </CardBody>

        <CardFooter className="flex items-center justify-center pb-5">
          <div className=" flex item center justify-between gap-7">
            <Card className="w-[70px] h-[70px] flex items-center justify-center ">
              <Button
                onPress={handleGoogleSignIn}
                className="w-full h-full bg-transparent"
              >
                <Image src={Google} alt="google" className="w-10 h-10 " />
              </Button>
            </Card>
            <Card className="w-[70px] h-[70px] flex items-center justify-center ">
              <Button
                onPress={handleXsignIn}
                className="w-full h-full bg-transparent"
              >
                <Image src={X} alt="x" className="w-10 h-10 " />
              </Button>
            </Card>
            <Card className="w-[70px] h-[70px] flex items-center justify-center ">
              <Button
                onPress={handleFacebookSignIn}
                className="w-full h-full bg-transparent"
              >
                <Image src={Facebook} alt="facebook" className="w-10 h-10 " />
              </Button>
            </Card>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignIn;
