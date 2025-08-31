import localFont from "next/font/local";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";
import QueryProvider from "@/components/QueryProvider";
import NavigationWrapper from "@/components/NavigationWrapper";

const pretendard = localFont({
  src: "../../public/font/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
});

export const metadata = {
  title: "Danggu - 사용자 관리 시스템",
  description: "Modern user management system with Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${pretendard.variable} font-pretendard antialiased bg-gray-50`}
      >
        <QueryProvider>
          <AuthInitializer />
          <NavigationWrapper />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
