import katex from "katex";
import { memo } from "react";

/** `$...$` を KaTeX で、それ以外を文字のまま表示する。 */
export const Rich = memo(function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("$").map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part, { throwOnError: false }),
            }}
          />
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
});
