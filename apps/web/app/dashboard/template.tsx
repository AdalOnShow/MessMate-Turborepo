/**
 * Re-mounts on every dashboard navigation, so each page gets the soft
 * fade-up entrance (see `.page-enter` in globals.css).
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-enter">{children}</div>;
}
