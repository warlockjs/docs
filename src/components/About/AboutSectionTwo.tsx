const AboutSectionTwo = () => {
  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap items-center">
          <div className="w-full px-4 lg:w-1/2">
            <div
              className="relative mx-auto mb-12 aspect-[25/24] max-w-[500px] text-center lg:m-0"
              data-wow-delay=".15s"
            >
              <img
                src="/images/about/about-image-2.svg"
                alt="about image"
                className="drop-shadow-three dark:hidden dark:drop-shadow-none"
              />
              <img
                src="/images/about/about-image-2-dark.svg"
                alt="about image"
                className="hidden drop-shadow-three dark:block dark:drop-shadow-none"
              />
            </div>
          </div>
          <div className="w-full px-4 lg:w-1/2">
            <div className="max-w-[470px]">
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Unit Testing Support
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Ensure code reliability and functionality with our framework's
                  Unit Testing Support. Streamline testing, catch bugs early,
                  and maintain quality effortlessly.
                </p>
              </div>
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Eloquent Validation
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Eloquent Validation integrates with Eloquent ORM to simplify
                  model data validation, ensuring integrity with easy rule
                  definitions and custom error messages.
                </p>
              </div>
              <div className="mb-1">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  6+ Cache Drivers
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Introducing our framework's cache driver feature, offering six
                  options to boost performance: Memory, LRU, Redis, File, Memory
                  Extended, and Null. Choose the ideal caching strategy for your
                  needs, from lightning-fast in-memory storage to bypassing
                  caching altogether.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionTwo;
