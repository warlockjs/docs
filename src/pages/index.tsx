import Footer from "../components/Footer";
import Features from "../components/Features";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Video from "../components/Video";
import AboutSectionOne from "../components/About/AboutSectionOne";
import AboutSectionTwo from "../components/About/AboutSectionTwo";
import ScrollUp from "../components/Common/ScrollUp";
import { useEffect } from "react";

function setDarkMode() {
  if (typeof window !== "undefined") {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

const Home = () => {
  useEffect(() => {
    setDarkMode();
  }, []);

  return (
    <main className="relative">
      <ScrollUp />
      <Header />
      <Hero />
      <Features />
      <Video />
      <AboutSectionOne />
      <AboutSectionTwo />
      <Footer />
    </main>
  );
};

export default Home;
