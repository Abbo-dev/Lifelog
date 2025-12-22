import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button, Input, Image, Alert } from "@heroui/react";
import Logo from "../assets/logo1.png";
import { Link } from "react-router-dom";
import SwitchTheme from "./Switch";
import { useState } from "react";
import { auth } from "../firebase";
import {
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
function PasswordForget() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length === 0) {
        setError("Email not found, please check your email and try again.");
        return;
      } else {
        await sendPasswordResetEmail(auth, email);
        setError("");
        console.log("Password reset email sent to:", email);
      }
    } catch (error) {
      setError(error.message);
      console.log(error);
    }
  };

  return (
    <>
      <div className="w-full h-screen flex justify-center items-center overflow-hidden   transition-all">
        <Card className="w-full max-w-md m-5 pb-10">
          <CardHeader className="flex items-center justify-center -mt-4">
            <Link to="/">
              <Image
                src={Logo}
                alt="logo"
                className="w-40 dark:invert -mt-10"
              />
            </Link>
            <div className="mt-6">
              <SwitchTheme />
            </div>
          </CardHeader>
          <div className="  mb-3 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-semibold text-center mb-3">
              Reset Password
            </h1>
          </div>

          {error && (
            <div className="mb-4 flex flex-col items-center justify-center text-center max-w-[300px] mx-auto transition-all ">
              <Alert
                className="flex items-center justify-center"
                type="error"
                color="danger"
                title="Error"
                description={error}
              />
            </div>
          )}

          <CardBody className="flex flex-col items-center justify-center">
            <form
              onSubmit={handlePasswordReset}
              className="w-full flex flex-col items-center justify-center gap-5 pb-6 "
            >
              <Input
                className="max-w-[300px] tramsform-all"
                isRequired
                errorMessage="Please enter a valid email"
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <div className="mt-1">
                  <p className="text-center text-sm text-gray-500 -mt-4 pb-6 ">
                    Don't have an account?
                    <Link to="/auth?mode=signup" className="text-blue-500 hover:underline">
                      {" "}
                      Create one
                    </Link>
                  </p>
                </div>
              )}

              <Button type="submit" className="w-[300px] mb-1 text-center mt-3">
                Reset Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default PasswordForget;
