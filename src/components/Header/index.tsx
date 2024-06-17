"use client";

import { useEffect, useState } from "react";
import menuData from "./menuData";
import mainLogo from "../../../static/images/warlock.png";

const Header = () => {
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <>
      <header
        className={`header left-0 top-0 z-40 flex w-full items-center ${
          sticky
            ? "fixed z-[9999] bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm transition dark:bg-gray-dark dark:shadow-sticky-dark"
            : "absolute bg-transparent"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4 xl:mr-12">
              <a
                href="/"
                className={`header-logo flex items-center gap-2 w-full text-2xl font-semibold text-black dark:text-white ${
                  sticky ? "py-5 lg:py-2" : "py-8"
                } `}
              >
                <img src={mainLogo} alt="Warlock.js Logo" className="size-10" />
                Warlock.js
              </a>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute cursor-pointer right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-1 lg:hidden border-none outline-none"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0 " : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar absolute right-0 z-30 w-[250px] rounded border-[.5px] border-body-color/50 bg-white px-6 duration-300 dark:border-body-color/20 dark:bg-dark lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100  ${
                    navbarOpen
                      ? "visibility top-full opacity-100 h-[100px]"
                      : "invisible top-[120%] opacity-0 h-auto"
                  }`}
                >
                  <ul className="block lg:flex list-none lg:gap-5 p-0 m-0">
                    {menuData.map((menuItem, index) => (
                      <li key={index} className="group relative">
                        <a
                          href={menuItem.path}
                          className={`flex py-2 text-base font-semibold lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 `}
                        >
                          {menuItem.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-end gap-3 pr-16 lg:pr-0">
                <a
                  href="https://github.com/hassanzohdy"
                  target="_blank"
                  className="ease-in-up hidden rounded-sm bg-black p-3 text-base font-medium text-white shadow-btn transition duration-300 hover:bg-black/80 hover:text-white hover:shadow-btn-hover md:block md:px-9 lg:px-6 xl:px-9"
                >
                  Github
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
