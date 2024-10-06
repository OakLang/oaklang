import React from "react";
import {
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Text,
} from "@react-email/components";

export default function VerificationRequest({
  url = "https://this-is-a-magic-link.com/adhflas",
  title,
  appName = "Oaklang",
}: {
  url: string;
  title: string;
  appName?: string;
}) {
  return (
    <Html lang="en">
      <title>{title}</title>
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Container>
        <Text style={{ fontSize: 16 }}>Welcome to {appName}</Text>
        <Text style={{ fontSize: 16 }}>
          Please click the magic link below to sign in to your account.
        </Text>
        <Button
          href={url}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            display: "inline-flex",
            padding: "12px 20px",
          }}
        >
          <Text style={{ fontSize: 16, padding: 0, margin: 0 }}>Sign In</Text>
        </Button>
        <Text style={{ fontSize: 16 }}>
          If you are on a mobile device, you can copy the link below and paste
          it into the browser of your choice.
        </Text>
        <Text style={{ fontSize: 16 }}>{url}</Text>
        <Text style={{ fontSize: 16 }}>
          If you did not request this email, you can safely ignore it.
        </Text>
        <Hr />
        <Text style={{ fontSize: 16, opacity: 0.5 }}>
          © {new Date().getFullYear()} {appName}
        </Text>
      </Container>
    </Html>
  );
}
