import { redirect } from "next/navigation";
import { NewOperationForm } from "@/components/operations/new-operation-form";
import { requireAccountContext } from "@/lib/auth/context";

export default async function NewOperationPage() {
  const context = await requireAccountContext();
  if (context.subscriptionStatus !== "active") redirect("/portal");
  return <div className="live-page live-form-page"><div className="live-page-heading"><div><p className="eyebrow">NOVA OPERAÇÃO</p><h1>Qualifique a oportunidade</h1><p>Os dados serão vinculados à sua conta e não poderão ser consultados por outro cliente.</p></div></div><NewOperationForm /></div>;
}
