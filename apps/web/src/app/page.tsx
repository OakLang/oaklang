import { redirect, RedirectType } from "next/navigation";

export default function Page() {
  redirect("/en", RedirectType.replace);
}
