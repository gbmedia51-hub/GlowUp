import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlowUp — Perfect Your Looks",
  description: "Découvrez ce qui vous met en valeur et obtenez un plan personnalisé.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen w-full flex justify-center">
          <div className="w-full max-w-[440px] min-h-screen relative">{children}</div>
        </div>
      </body>
    </html>
  );
}
