import type { Metadata } from "next";
import Landing from "@/app/page";

const title="LifeLens — Your health story, remembered";
const description="Keep medications, appointments, documents, memories, and family check-ins together in one private timeline.";

export const metadata:Metadata={
  title,description,
  alternates:{canonical:"/"},
  robots:{index:false,follow:true},
  openGraph:{title,description,type:"website",siteName:"LifeLens",url:"/x/lifelens-2026",images:[{url:"/lifelens-launch-card-v3.jpg",secureUrl:"/lifelens-launch-card-v3.jpg",type:"image/jpeg",width:1200,height:630,alt:title}]},
  twitter:{card:"summary_large_image",title,description,images:[{url:"/lifelens-launch-card-v3.jpg",alt:title}]},
};

export default Landing;
