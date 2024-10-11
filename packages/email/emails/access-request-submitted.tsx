import * as React from "react";
import {
  Container,
  Font,
  Head,
  Html,
  Link,
  Text,
} from "@react-email/components";

import type {
  AccessRequestQuestion,
  AccessRequestQuestionOption,
  AccessRequestUserResponse,
} from "@acme/db/schema";

export default function AccessRequestSubmitted({
  title = "Access Request Received - We’ll Get Back to You Soon!",
  appName = "Oaklang",
  user = {
    id: "my_id",
    email: "name@example.com",
    name: "Jhon Doe",
  },
  submittedOn = new Date(),
  agreedToPrivacyPolicy = true,
  agreedToTermsOfServices = true,
  questionsAnswers = [
    {
      question: "My Question",
      createdAt: new Date(),
      id: "1",
      isMultiChoice: false,
      order: 1,
      answers: [
        {
          id: "1",
          createdAt: new Date(),
          questionId: "",
          optionId: "1",
          customAnswer: null,
          userId: "1",
          option: {
            id: "2",
            createdAt: new Date(),
            questionId: "",
            customAnswerPlaceholderText: "",
            isCustomAnswer: false,
            option: "Option 2",
            order: 2,
          },
        },
      ],
    },
    {
      question: "My Question 2",
      createdAt: new Date(),
      id: "1",
      isMultiChoice: true,
      order: 1,
      answers: [
        {
          id: "1",
          createdAt: new Date(),
          questionId: "",
          optionId: "1",
          customAnswer: null,
          userId: "1",
          option: {
            id: "1",
            createdAt: new Date(),
            questionId: "",
            customAnswerPlaceholderText: "",
            isCustomAnswer: false,
            option: "Option 1",
            order: 1,
          },
        },
        {
          id: "2",
          createdAt: new Date(),
          questionId: "",
          optionId: "2",
          customAnswer: null,
          userId: "1",
          option: {
            id: "2",
            createdAt: new Date(),
            questionId: "",
            customAnswerPlaceholderText: "",
            isCustomAnswer: false,
            option: "Option 2",
            order: 2,
          },
        },
      ],
    },
    {
      question: "My Question 3",
      createdAt: new Date(),
      id: "1",
      isMultiChoice: false,
      order: 1,
      answers: [
        {
          id: "1",
          createdAt: new Date(),
          questionId: "",
          optionId: "1",
          customAnswer: "This is a custom answer",
          userId: "1",
          option: {
            id: "1",
            createdAt: new Date(),
            questionId: "",
            customAnswerPlaceholderText: "",
            isCustomAnswer: true,
            option: "Other",
            order: 1,
          },
        },
      ],
    },
  ],
}: {
  agreedToTermsOfServices: boolean;
  agreedToPrivacyPolicy: boolean;
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  submittedOn: Date;
  title: string;
  appName?: string;
  appUrl?: string;
  questionsAnswers: (AccessRequestQuestion & {
    answers: (AccessRequestUserResponse & {
      option: AccessRequestQuestionOption;
    })[];
  })[];
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
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={600}
          fontStyle="normal"
        />
      </Head>

      <Container>
        <Text>Hi Admin</Text>
        <Text>
          A new access request has been submitted by a user. Below are the
          details of their submission:
        </Text>

        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 0 }}>
          User Information:
        </Text>
        <ul style={{ marginTop: 4 }}>
          <li>
            <span style={{ fontWeight: "bold" }}>User ID:</span> {user.id}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>User Name:</span> {user.name}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>User Email:</span> {user.email}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Submitted On:</span>{" "}
            {submittedOn.toLocaleString()}
          </li>
        </ul>

        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 0 }}>
          Request Details:
        </Text>
        <ul style={{ marginTop: 4 }}>
          <li>
            <span style={{ fontWeight: "bold" }}>
              Agreed to Terms of Service:
            </span>{" "}
            {agreedToTermsOfServices ? "Yes" : "No"}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>
              Agreed to Privacy Policy:
            </span>{" "}
            {agreedToPrivacyPolicy ? "Yes" : "No"}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Qustions and Answers:</span>
            <br />
            <ol>
              {questionsAnswers.map((qa) => (
                <li key={qa.id}>
                  <span style={{ fontWeight: "bold" }}>{qa.question}:</span>
                  <br />
                  <ul>
                    {qa.answers.map((answer) => (
                      <li key={answer.id}>
                        {answer.option.option}
                        {answer.option.isCustomAnswer &&
                          answer.customAnswer && (
                            <>
                              <br />
                              {answer.customAnswer}
                            </>
                          )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </li>
        </ul>

        <Text>
          Please review this request at your earliest convenience. You can
          manage and approve requests through the admin dashboard here:{" "}
          <Link href={`https://oaklang.com/admin/access-requests/${user.id}`}>
            Review Request
          </Link>
        </Text>

        <Text>Thank you for your attention to this request.</Text>

        <Text>
          Best regards,
          <br />
          {appName} System
        </Text>
      </Container>
    </Html>
  );
}
