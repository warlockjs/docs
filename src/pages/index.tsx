import Footer from "../components/Footer";
import Features from "../components/Features";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Video from "../components/Video";
import AboutSectionOne from "../components/About/AboutSectionOne";
import AboutSectionTwo from "../components/About/AboutSectionTwo";
import ScrollUp from "../components/Common/ScrollUp";

const Home = () => {
  return (
    <>
      <ScrollUp />
      <Header />
      <Hero />
      <Features />
      <Video />
      <AboutSectionOne />
      <AboutSectionTwo />
      <Footer />
    </>
  );
};

export default Home;

// import Link from "@docusaurus/Link";
// import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
// import HomepageFeatures from "@site/src/components/HomepageFeatures";
// import Layout from "@theme/Layout";
// import clsx from "clsx";
// import React from "react";
// import styles from "./index.module.css";

// function HomepageHeader() {
//   const { siteConfig } = useDocusaurusContext();
//   return (
//     <header className={clsx("hero hero--primary", styles.heroBanner)}>
//       <div className="container">
//         <h1 className="hero__title">{siteConfig.title}</h1>
//         <p className="hero__subtitle">
//           Warlock.js is a cutting-edge, comprehensive, and user-friendly
//           solution for Node.js.
//         </p>
//       </div>
//     </header>
//   );
// }

// export default function Home(): JSX.Element {
//   const { siteConfig } = useDocusaurusContext();
//   return (
//     <Layout
//       title={siteConfig.title}
//       description="A robust Node.js framework for building blazing-fast applications."
//     >
//       <HomepageHeader />
//       <main>
//         <HomepageFeatures />
//       </main>
//     </Layout>
//   );
// }
