import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Seedling",
  description: "Evidence-based clinical intelligence for pediatric occupational therapy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700;8..60,800&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'DM Sans',sans-serif;background:#F7F6F1}
          .seedling-shell{display:flex;min-height:100vh}
          .seedling-main{flex:1;min-width:0;overflow-x:hidden}
          @media(max-width:768px){
            .seedling-sidebar{display:none!important}
            .sidebar-hamburger{display:flex!important}
            .seedling-main{padding-top:56px}
          }
        `}</style>
      </head>
      <body>
        <div className="seedling-shell">
          <Sidebar />
          <main className="seedling-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
