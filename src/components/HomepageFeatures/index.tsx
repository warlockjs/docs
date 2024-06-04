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
      <>Build apps fast with Warlock.js, featuring many built-in tools.</>
    ),
  },
  {
    title: "Focus on What Matters",
    description: (
      <>
        Warlock.js does the heavy lifting for you, so you can focus on your app.
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
        Warlock.js automatically loads routes, events, translations, main files,
        command lines, and more.
      </>
    ),
  },
  {
    title: "Postman Generation",
    description: (
      <>
        Warlock.js can generate postman collections for your routes
        automatically.
      </>
    ),
  },
  {
    title: "MongoDB Integration",
    description: (
      <>Warlock.js provides a built-in MongoDB integration for your app.</>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4", styles.featureCard)}>
      <div className="text--center padding-horiz--md">
        <h3 className="text-red-500">{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresWrapper}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
