import MoonIcon from "../assets/moon.png";
import { Image } from "@heroui/react";
function Moon() {
  return (
    <Image src={MoonIcon} alt="moon" className=" w-5 h-5 mt-1 dark:invert " />
  );
}

export default Moon;
