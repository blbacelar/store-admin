import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import I18nInitializer from "@/components/I18nInitializer";
import AuthContext from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Personal Product Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthContext>
          <I18nInitializer>
            {children}
          </I18nInitializer>
        </AuthContext>
      </body>
    </html>
  );
}
