import { redirect } from "next/navigation";

export default function ApiDocsIndex() {
  redirect("/api-docs/developer-sdks/official-sdks");
}
