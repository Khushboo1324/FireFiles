import type { Metadata } from "next";

import { UploadsPage } from "@/components/uploads/uploads-page";

export const metadata: Metadata = {
  title: "Uploads | FireFiles",
};

export default function UploadsRoute() {
  return <UploadsPage />;
}
