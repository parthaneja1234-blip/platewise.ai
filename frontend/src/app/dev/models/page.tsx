import { notFound } from "next/navigation";
import ModelsGalleryClient from "./ModelsGalleryClient";

export const metadata = {
  title: "3D Models Dev Gallery | PlateWise AI",
  description: "Internal 3D asset inspection and optimization gallery for PlateWise AI food models.",
};

export default function DevModelsPage() {
  // Hide this route entirely in production builds
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ModelsGalleryClient />;
}
