import { useState } from "react"
import { auth } from "../firebase"
import { createUserWithEmailAndPassword , updateProfile , signInWithPopup , GoogleAuthProvider ,TwitterAuthProvider, FacebookAuthProvider} from "firebase/auth";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import Logo from "../assets/logo1.png";
import { Input, Image, Button , Divider, Alert} from "@heroui/react"
import SwitchTheme from "./Switch";
import X from "../assets/x.png";
import Google from "../assets/google.svg";
import Facebook from "../assets/facebook.svg";
import { Link, useNavigate } from "react-router-dom"
import Eye from "../assets/eye.svg";
import EyeOff from "../assets/eye-slash.svg";
import UserPic from "../assets/userName.svg" 
import Email from "../assets/email.svg";


function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [ password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };
  const navigate = useNavigate();
   const handleXsignIn = async () => {
    try {
      const provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) { 
      console.log(error);
    }
  }
   const handleFacebookSignIn = async () => {
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) { 
      console.log(error);
    }
  }
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) { 
      console.log(error);
    }
  }
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: username,
      });

      navigate("/home");
      console.log("User created with success with username:", username );
    }
    catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Change email , email already in use");
        return;
      }
      else if (error.code === "auth/invalid-email") {
        setError("Invalid email");
        return;
      }
      else if (error.code === "auth/weak-password") {
        setError("Please enter a strong password");
        return;
      } else {
        setError(error.message);
        console.log("Error creating user:", error.message);
      }

      setError(error.message);
      console.log("Error creating user:", error.message);
    }
  };







  return (
    
    <div className="w-full h-screen flex justify-center items-center ">
      <Card className="w-full max-w-md m-5 pb-5">
        <CardHeader className="flex items-center justify-center">
          <Link to="/">
            <Image src={Logo} alt="logo" className="w-40 dark:invert -mt-10" />
          </Link>
          <div className="mt-6">            
            <SwitchTheme />            
          </div>       
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center overflow-hidden -mt-5 ">         
              
          <form onSubmit={handleSignUp} className="w-full flex flex-col items-center justify-center gap-6 pb-7"  >
          <div className="mb-4 flex flex-col items-center justify-center text-center max-w-[300px] mx-auto">
            {error && <Alert  className="flex items-center justify-center" type="error" color="danger" title="Error" description={error} />}
            </div>
              <Input
                className="max-w-[300px] "
                isRequired
                label="Username"
                labelPlacement="outside"
                name="username"
                placeholder="Enter your username"
                type="username"
              onChange={(e) => setUsername(e.target.value)}
              endContent={
                <Image
                  src={UserPic}  className="w-7 h-7 text-[ #71717A] "
                />
              }
            />

            <Input
                className="w-[300px]"
                isRequired
                errorMessage="Please enter a valid email"
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                type="email"
              onChange={(e) => setEmail(e.target.value)}
              endContent={
                <Image
                  src={Email}  className="w-7 h-7 text-[#71717A] "
                />
              }
            />
                             
            <Input
                className="w-[300px]"
                isRequired
                errorMessage="Please enter a valid password"
                label="Password"
                labelPlacement="outside"
                name="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              endContent={  
                  <>
                  <a onClick={togglePassword} className="cursor-pointer flex items-center">
                      { 
                      showPassword ? (
                        <Image
                          src={EyeOff}  className="w-7 h-7 text-[#71717A] "
                        />
                      ) : (
                        <Image
                          src={Eye}  className="w-7 h-7  text-[#71717A]"
                        />
                      )
                  }
                  </a>
                  </>
                }
            />
          
            <Button type="submit" className="w-[300px] mb-1 text-center mt-3" >
              Sign Up  
            </Button>
          </form>  
          
          <div className="flex items-center justify-between">
            <Divider className="w-[150px] " />
            <p className="mx-4"> OR</p>
            <Divider className="w-[150px]" />
          </div>        
        </CardBody>
        <CardFooter className="flex items-center justify-center pb-5">
          <div className=" flex item center justify-between gap-7">

            <Card  className="w-[70px] h-[70px] flex items-center justify-center ">
              <Button onPress={handleGoogleSignIn} className="w-full h-full bg-transparent" >
                <Image src={Google} alt="apple" className="w-10 h-10 " />
              </Button>            
            </Card>
             
            <Card  className="w-[70px] h-[70px] flex items-center justify-center ">             
              <Button onPress={handleXsignIn} className="w-full h-full bg-transparent" >                
                <Image src={X} alt="apple" className="w-10 h-10 " />
                
              </Button>
            
            </Card>
             
            <Card  className="w-[70px] h-[70px] flex items-center justify-center ">   
              <Button onPress={handleFacebookSignIn} className="w-full h-full bg-transparent" >
                <Image src={Facebook} alt="apple" className="w-10 h-10 " />
              </Button>
            </Card>
          
          </div>
        
        </CardFooter>


      </Card>
    </div>
  )
}

export default SignUp