import { Metadata } from "next";
import { MembersContent } from "../../../components/dashboard/members";

export const metadata: Metadata = {
  title: "Members",
  description: "manageMessMembers",
};

export default function MembersPage() {
  return <MembersContent />;
}
