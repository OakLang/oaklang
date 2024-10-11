import {
  Container,
  Font,
  Head,
  Html,
  Link,
  Text,
} from "@react-email/components";

export interface AccessRequestAcceptedProps {
  name: string;
  title: string;
  supportEmail: string;
  appName?: string;
  appUrl?: string;
}
export default function AccessRequestAccepted({
  name = "John Doe",
  title = "Your Access Request Has Been Approved! Welcome to Oaklang 🎉",
  supportEmail = "support@oaklang.com",
  appName = "Oaklang",
  appUrl = "https://oaklang.com",
}: AccessRequestAcceptedProps) {
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
        <Text>Hi {name}</Text>
        <Text>
          We are excited to inform you that your access request for {appName}{" "}
          has been accepted! 🎉 You can now log in and start using the app to
          learn new languages.
        </Text>
        <Text>
          <span style={{ fontWeight: "600" }}>Important:</span> Since you are
          part of our early access or beta testing group, please keep in mind
          that you might incounter bugs, incomplete features, and your data
          might get lost.
        </Text>
        <Text>
          If you have any questions, feel free to reach out to us at{" "}
          <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.
        </Text>
        <Text>
          Thank you again for your interest in being part of our beta testing
          phase!
        </Text>
        <Text>
          Best regards,
          <br />
          The {appName} Team
          <br />
          <Link href={appUrl}>{appUrl}</Link>
          <br />
          <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>
        </Text>
      </Container>
    </Html>
  );
}
