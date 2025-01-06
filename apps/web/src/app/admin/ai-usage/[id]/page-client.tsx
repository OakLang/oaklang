"use client";

import { useParams } from "next/navigation";

import InfoTable from "~/components/InfoTable";
import SyntaxHighlighter from "~/components/SyntaxHighlighter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import AppBar from "../../app-bar";

export default function PageClient() {
  const { id } = useParams<{ id: string }>();
  const usageQuery = api.admin.aiUsage.getAIUsage.useQuery({ id });

  return (
    <>
      <AppBar
        breadcrumb={[{ href: "/admin/ai-usage", title: "AI Usage" }]}
        pageTitle={id}
      />
      <div className="mx-auto my-16 w-full max-w-screen-lg px-4">
        {usageQuery.isPending ? (
          <p>Loading...</p>
        ) : usageQuery.isError ? (
          <p>{usageQuery.error.message}</p>
        ) : (
          <div className="space-y-16">
            <Accordion type="multiple" defaultValue={["usage-info"]}>
              <AccordionItem value="usage-info">
                <AccordionTrigger>Usage Info</AccordionTrigger>
                <AccordionContent>
                  <InfoTable
                    data={Object.entries({
                      id: usageQuery.data.id,
                      "Created At": formatDate(usageQuery.data.createdAt),
                      "User Id": usageQuery.data.userId ?? "-",
                      "User Email": usageQuery.data.userEmail ?? "-",
                      Type: String(usageQuery.data.type ?? "-"),
                      Platform: usageQuery.data.platform ?? "-",
                      Model: usageQuery.data.model ?? "-",
                      "Token Count": String(
                        usageQuery.data.tokenCount?.toLocaleString() ?? "-",
                      ),
                    }).map((entry) => ({ label: entry[0], value: entry[1] }))}
                  />
                </AccordionContent>
              </AccordionItem>
              {usageQuery.data.user && (
                <AccordionItem value="user-info">
                  <AccordionTrigger>User Info</AccordionTrigger>
                  <AccordionContent>
                    <InfoTable
                      data={Object.entries({
                        Id: usageQuery.data.user.id,
                        "Joined At": formatDate(usageQuery.data.user.createdAt),
                        Name: usageQuery.data.user.name ?? "-",
                        Email: usageQuery.data.user.email,
                        "Email Verified": usageQuery.data.user.emailVerified
                          ? formatDate(usageQuery.data.user.emailVerified)
                          : "-",
                        Role: usageQuery.data.user.role,
                        Blocked: usageQuery.data.user.isBlocked ? "Yes" : "No",
                      }).map((entry) => ({ label: entry[0], value: entry[1] }))}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="prompt">
                <AccordionTrigger>Prompt</AccordionTrigger>
                <AccordionContent>
                  <pre className="whitespace-pre-wrap">
                    {usageQuery.data.prompt ?? "-"}
                  </pre>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="metadata">
                <AccordionTrigger>Metadata</AccordionTrigger>
                <AccordionContent>
                  <SyntaxHighlighter language="json">
                    {JSON.stringify(usageQuery.data.metadata, null, 2)}
                  </SyntaxHighlighter>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="result">
                <AccordionTrigger>Result</AccordionTrigger>
                <AccordionContent>
                  <SyntaxHighlighter language="json">
                    {JSON.stringify(usageQuery.data.result, null, 2)}
                  </SyntaxHighlighter>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    </>
  );
}
