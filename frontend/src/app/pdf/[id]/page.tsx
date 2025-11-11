import { redirect } from "next/navigation";

type ParamShape = { id: string };

// Align with Next's PageProps expectation where params can be a Promise
export default async function PdfPage({ params }: { params?: Promise<ParamShape> }) {
  const resolved = params ? await params : undefined;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiUrl && resolved?.id) {
    // Redirect to backend inline view endpoint
    redirect(`${apiUrl}/api/bills/${resolved.id}/view`);
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-500">Viewer route removed. Use the View link from the list.</div>
    </div>
  );
}
