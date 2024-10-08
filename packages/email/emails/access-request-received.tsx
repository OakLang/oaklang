import {
  Container,
  Font,
  Head,
  Html,
  Link,
  Text,
} from "@react-email/components";

export default function AccessRequestReceived({
  title = "Access Request Received - We’ll Get Back to You Soon!",
  name = "John",
  supportEmail = "auth_request@oaklang.com",
  appName = "Oaklang",
  appUrl = "https://oaklang.com",
}: {
  title: string;
  name: string;
  supportEmail?: string;
  appName?: string;
  appUrl?: string;
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
        <Text>Hi {name}</Text>
        <Text>
          Thank you for submitting your request to join our testing phase! We’re
          excited about your interest and wanted to let you know that we’ve
          successfully received your access request.
        </Text>
        <Text>
          Our team is currently reviewing your submission, and we’ll notify you
          as soon as a decision has been made. We appreciate your patience
          during this process.
        </Text>
        <Text>
          In the meantime, if you have any questions, feel free to reach out to
          us at <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.
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
