import {LoaderCircleIcon, LoaderIcon} from "lucide-react";

const PageLoader = () => {
  return (
    <div className="bg-white  flex items-center justify-center h-screen" >
      <LoaderCircleIcon className="size-10 animate-spin text-black "/> 
    </div>
  )
}

export default PageLoader 
