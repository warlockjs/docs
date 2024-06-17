// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/oceanicNext");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
import tailwindPlugin from "./plugins/tailwind-plugin.cjs";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Warlock.js",
  tagline: "Warlock.js ecosystem documentation",
  favicon: "img/favicon.ico",
  plugins: [tailwindPlugin],

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

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: "dark",
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      // Replace with your project's social card
      image: "https://mentoor.io/logo.svg",
      navbar: {
        title: "Warlock.js EcoSystem",
        logo: {
          alt: "mentoor.io",
          src: "https://mentoor.io/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "warlock/getting-started/introduction",
            position: "left",
            label: "Warlock",
          },
          {
            type: "doc",
            docId: "cascade/getting-started/introduction",
            position: "left",
            label: "Cascade",
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
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
