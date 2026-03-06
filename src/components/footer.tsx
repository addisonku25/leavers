import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Leavers
        </p>
        <nav className="flex gap-6">
          <Link
            href="/terms"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
