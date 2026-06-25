import { Metadata } from "next";
import { MembersContent } from "../../components/dashboard/members";

export const metadata: Metadata = {
  title: "Members",
  description: "Manage your mess members",
};

export default function MembersPage() {
  return <MembersContent />;
}
