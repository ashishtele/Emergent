import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Nothing found here.</h1>
      <Link href="/" className="text-sm underline">
        Back to Emergent home
      </Link>
    </div>
  );
}
