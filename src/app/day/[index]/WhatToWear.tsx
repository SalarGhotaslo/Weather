import styles from "./WhatToWear.module.css";

// "What to Wear" card — dress-code summary + item chips from getDressCode().
export default function WhatToWear({
  summary,
  items,
}: {
  summary: string;
  items: string[];
}) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>What to Wear</h2>
      <p className={styles.summary}>{summary}</p>
      <div className={styles.items}>
        {items.map((item) => (
          <span key={item} className={styles.item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
