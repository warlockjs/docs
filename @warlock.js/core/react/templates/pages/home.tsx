import { useState } from "react";

export function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Hello World</h1>
      <button onClick={() => setCount(count => count + 1)}>
        count is: {count}
      </button>
    </>
  );
}
