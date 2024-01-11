import { Roboto } from "next/font/google";

// If loading a variable font, you don't need to specify the font weight
const font = Roboto({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Maroš Kramár",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={font.className}>
      <body className="h-screen bg-background text-foreground">
        <main className="flex h-full min-h-screen">{children}</main>
      </body>
    </html>
  );
}
