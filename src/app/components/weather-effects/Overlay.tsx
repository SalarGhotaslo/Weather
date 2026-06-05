import styles from "./Overlay.module.css";

// Shared decorative, full-viewport wrapper for the weather effects. Always
// aria-hidden — these are purely visual.
export default function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      {children}
    </div>
  );
}
