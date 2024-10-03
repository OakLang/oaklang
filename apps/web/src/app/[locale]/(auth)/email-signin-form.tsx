"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useRouter } from "~/i18n/routing";

const emailSchema = z.object({
  email: z.string().email(),
});

export default function EmailSignInForm({
  type,
  callbackUrl,
}: {
  type: "signin" | "signup";
  callbackUrl?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async ({ email }: z.infer<typeof emailSchema>) => {
    try {
      setLoading(true);
      const data = await signIn("resend", {
        email,
        callbackUrl,
        redirect: false,
      });
      console.log(data);

      if (data?.url) {
        const url = new URL(data.url);
        url.pathname = "/verify-request";
        router.push(url.href);
        return;
      }

      throw new Error(data?.error ?? "Something went wrong!");
    } catch (error) {
      toast("Failed to sign in with email", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {type === "signin" ? (
            <>
              Continue
              <ArrowRight className="-mr-1 ml-2 h-4 w-4" />
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}
