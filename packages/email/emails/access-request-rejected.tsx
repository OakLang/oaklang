import {
  Container,
  Font,
  Head,
  Html,
  Link,
  Text,
} from "@react-email/components";

export interface AccessRequestRejectedProps {
  name: string;
  title: string;
  supportEmail: string;
  appName?: string;
  appUrl?: string;
}
export default function AccessRequestRejected({
  name = "John Doe",
  title = "Update on Your Access Request for Oaklang - Request Not Approved",
  supportEmail = "support@oaklang.com",
  appName = "Oaklang",
  appUrl = "https://oaklang.com",
}: AccessRequestRejectedProps) {
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
          Thank you for your interest in {appName} and for taking the time to
          request access to our platform. After careful consideration, we regret
          to inform you that we’re unable to provide access to the app at this
          time.
        </Text>
        <Text>
          As we're still in the early stages of development, we have a limited
          number of spots available. While we can’t approve your request right
          now, we’ll be sure to keep your information on file and notify you as
          soon as more spaces become available.
        </Text>
        <Text>
          We really appreciate your enthusiasm and hope you’ll stay connected
          with us for future updates!
        </Text>
        <Text>
          If you have any questions, feel free to reach out to us at{" "}
          <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.
        </Text>
        <Text>Thank you again for your interest in {appName}.</Text>
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
