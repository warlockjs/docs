import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import tailwindPlugin from "./plugins/tailwind-plugin";

const config: Config = {
  title: "Warlock.js",
  tagline: "Warlock.js ecosystem documentation",
  favicon: "img/favicon.ico",
  plugins: [tailwindPlugin, "@docusaurus/theme-mermaid"],

  // Set the production url of your site here
  url: "https://warlock.js.org",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "mentoor.io", // Usually your GitHub org/user name.
  projectName: "Warlock.js", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  markdown: {
    mermaid: true,
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          lastVersion: "current", // Makes "current" (v4) the default version
          versions: {
            current: {
              label: "4.x (Latest)",
              path: "docs", // v4 at: warlock.js.org/docs/...
              badge: true,
              banner: "none",
            },
            "3.x": {
              label: "3.x",
              path: "v3", // v3 at: warlock.js.org/v3/...
              badge: true,
              banner: "unmaintained",
            },
          },
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  headTags: [
    {
      tagName: "html",
      attributes: {
        "data-theme": "dark",
        class: "dark",
      },
    },
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    image: "./src/static/images/warlock.png",
    navbar: {
      title: "Warlock.js",
      logo: {
        alt: "warlock.io",
        src: "./images/warlock.png",
      },
      items: [
        {
          type: "doc",
          docId: "framework/getting-started/introduction",
          position: "left",
          label: "Framework",
        },
        {
          type: "doc",
          docId: "seal/getting-started/introduction",
          position: "left",
          label: "Seal",
        },
        {
          type: "doc",
          docId: "cascade/getting-started/introduction",
          position: "left",
          label: "Cascade",
        },
        {
          type: "doc",
          docId: "cache/introduction",
          position: "left",
          label: "Cache",
        },
        {
          type: "dropdown",
          label: "More",
          position: "left",
          items: [
            {
              href: "/docs/herald/introduction",
              label: "Herald — Message Bus",
            },
            {
              href: "/docs/logger/introduction",
              label: "Logger — Logging",
            },
            {
              href: "/docs/scheduler/introduction",
              label: "Scheduler — Job Scheduling",
            },
          ],
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          dropdownActiveClassDisabled: true,
        },
        {
          href: "https://github.com/hassanzohdy",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      // links: [
      //   {
      //     title: "Community",
      //     items: [
      //       {
      //         label: "Youtube",
      //         href: "https://www.youtube.com/channel/UCF0g3jlqqhb1dxPW90twKcw",
      //       },
      //       {
      //         label: "Discord",
      //         href: "https://discord.gg/vtZE9YzaFz",
      //       },
      //       {
      //         label: "Facebook",
      //         href: "https://facebook.com/mentoor.io",
      //       },
      //     ],
      //   },
      // ],
      copyright: `Copyright © ${new Date().getFullYear()} mentoor.io, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
