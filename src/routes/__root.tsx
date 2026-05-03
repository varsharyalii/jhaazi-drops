import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Jhaazi — thrift drops" },
      { name: "description", content: "Jhaazi — social commerce for thrift sellers in India" },
      { property: "og:title", content: "Jhaazi — thrift drops" },
      { name: "twitter:title", content: "Jhaazi — thrift drops" },
      { property: "og:description", content: "Jhaazi — social commerce for thrift sellers in India" },
      { name: "twitter:description", content: "Jhaazi — social commerce for thrift sellers in India" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ab20d53d-d27c-4b0c-9025-f0d07fead241/id-preview-42fa914c--d0bda03f-72bd-471b-ab92-b178baad0fb4.lovable.app-1777842100366.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ab20d53d-d27c-4b0c-9025-f0d07fead241/id-preview-42fa914c--d0bda03f-72bd-471b-ab92-b178baad0fb4.lovable.app-1777842100366.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  ),
  component: () => <Outlet />,
  notFoundComponent: () => <div style={{ padding: 40 }}>404</div>,
});
