import { redirect } from "next/navigation";

export default function DevelopersRedirectPage() {
  redirect("/users?tab=developers");
}
