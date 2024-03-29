import { APP_NAME } from '~/utils/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Privacy Policy - ${APP_NAME}`,
};

export default function Privacy() {
  return (
    <main className="prose mx-auto my-16 dark:prose-invert md:prose-lg">
      <h1># Privacy Policy</h1>

      <h2>## Information we collect</h2>

      <p>We collect information in the following ways:</p>

      <ul>
        <li>
          Account and profile information. When you sign up for a wonderful.dev account, we store information such as your GitHub login
          username. This will never be shared publicly without your consent.
        </li>
        <li>
          Integrations. If you grant us authorization to integrate with another service provider, we will connect that service to ours and
          only collect data from that service which is necessary to provide you the integration service. For example when you connect the
          YouTube integration, we store the titles, descriptions, and total subscriber counts of your YouTube channels. You can remove an
          integration at any time which deletes all content that was received from that service. Your content, including YouTube data, is
          also immediately deleted and no longer stored or indexed by wonderful.dev when you delete your wonderful.dev account.
        </li>
        <li>
          Usage information. We may collect information about the services you use and how you use them, like which pages you visit and
          which features you use. We use cookies with unique identifiers to authenticate your login session.
        </li>
      </ul>

      <h2>## How we use information we collect</h2>

      <p>
        We use the information we collect to provide, maintain, and protect services for our users. We may also use this information to
        improve your user-experience with our services. We will ask for your consent before using any of your information for a purpose
        other than set out in this Privacy Policy.
      </p>

      <p>When you contact wonderful.dev, we may keep a record of your name and email address to better solve any customer issues.</p>

      <h2>## Information we share</h2>

      <p>
        We do not sell our users’ private personal information. We share information about you in the limited circumstances spelled out
        below and with appropriate safeguards on your privacy:
      </p>

      <ul>
        <li>
          With your consent: We may share and disclose information with your consent or at your direction. For example, when you connect the
          YouTube integration we may share your YouTube channel titles, YouTube username, and total subscribers count publicly on your
          wonderful.dev profile.
        </li>
        <li>
          Aggregated and de-identified information: We may share information that has been aggregated or reasonably de-identified, so that
          the information could not reasonably be used to identify you. For example, we may publish aggregate statistics about the use of
          our Services.
        </li>
        <li>
          As required by law: We may disclose information about you in response to a subpoena, court order, or other governmental request.
        </li>
      </ul>

      <h2>## Information security</h2>

      <p>
        We work hard to protect your private information. We enforce SSL when our users communicate with wonderful.dev. We do not store
        passwords for user accounts, and instead rely on GitHub login for user authentication.
      </p>

      <h2>## Changes</h2>

      <p>
        We reserve the right, in our sole and absolute discretion, to make changes to this Policy from time to time. Please review this
        Privacy Policy periodically to check for updates.
      </p>
    </main>
  );
}
