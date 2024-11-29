import { type ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { useState } from "react";
import { redirectWithSuccess } from "remix-toast";
import { toast } from "sonner";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";

export async function loader() {
  const questions = await db.questionWithAnswer.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  return json({ questions });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const question = formData.get("question");

    if (!question || typeof question !== "string") {
      return json({ error: "Question is required" }, { status: 400 });
    }

    try {
      await db.questionWithAnswer.create({
        data: {
          question,
          answer: "",
        },
      });

      return redirectWithSuccess("/admin/questionnaire", "Question added successfully");
    } catch (error) {
      console.error("Failed to add question:", error);
      return json({ error: "Failed to add question" }, { status: 400 });
    }
  }

  if (intent === "delete") {
    const questionId = formData.get("questionId");

    if (!questionId || typeof questionId !== "string") {
      return json({ error: "Question ID is required" }, { status: 400 });
    }

    try {
      await db.questionWithAnswer.delete({
        where: {
          id: questionId,
        },
      });

      return redirectWithSuccess("/admin/questionnaire", "Question deleted successfully");
    } catch (error) {
      console.error("Failed to delete question:", error);
      return json({ error: "Failed to delete question" }, { status: 400 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function QuestionnairePage() {
  const { questions } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [newQuestion, setNewQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    fetcher.submit(e.currentTarget as HTMLFormElement);
    setNewQuestion("");
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeading title="Questionnaire Management" />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Question</h2>
        <fetcher.Form method="post" className="space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="intent" value="create" />
          <div className="flex gap-4">
            <Input
              name="question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter a new question"
              className="flex-1"
              required
            />
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Adding..." : "Add Question"}
            </Button>
          </div>
        </fetcher.Form>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Current Questions</h2>
        <div className="border rounded-lg p-4 shadow-sm">
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-gray-500 italic">No questions added yet.</p>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between group">
                  <span className="font-medium">
                    {index + 1}. {question.question}
                  </span>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="questionId" value={question.id} />
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </Button>
                  </fetcher.Form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
