import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robert Kolek — Designer",
  description:
    "I turn complexity into clarity. Portfolio of Robert Kolek — crafting thoughtful digital experiences through design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend+Giga:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise antialiased">
        {children}
      </body>
    </html>
  );
}
