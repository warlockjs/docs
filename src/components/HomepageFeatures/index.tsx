import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Suitable for rapid development",
    description: (
      <>
        Build apps quickly with Warlock Js, it focuses on reducing development
        time by providing a lot of features out of the box.
      </>
    ),
  },
  {
    title: "Focus on What Matters",
    description: (
      <>
        Warlock Js does the heavy lifting for you, so you can focus on your app.
      </>
    ),
  },
  {
    title: "Powered by Typescript",
    description: (
      <>Leverage the power of Typescript to build your app with confidence.</>
    ),
  },
  {
    title: "Automation",
    description: (
      <>
        Warlock Js focuses on automatically loading routes, events,
        translations, main files, command lines, and more out of the box.
      </>
    ),
  },
  {
    title: "Postman Generation",
    description: (
      <>
        Warlock Js can generate postman collections for your routes
        automatically.
      </>
    ),
  },
  {
    title: "MongoDB Integration",
    description: (
      <>Warlock Js provides a built-in MongoDB integration for your app.</>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
