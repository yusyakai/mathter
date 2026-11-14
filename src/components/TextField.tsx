import { useRef, type RefObject } from "react";
import { Rich } from "./Rich";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 何行の入力欄にするか。省くと1行 */
  rows?: number;
  placeholder?: string;
  /** 数式の入力を助けるボタンを出す */
  tools?: boolean;
  /** 入力欄そのものを外から使うとき（選んだ範囲を読むなど） */
  fieldRef?: RefObject<HTMLTextAreaElement | null>;
}

const snippets: { name: string; before: string; after: string }[] = [
  { name: "数式 $ $", before: "$", after: "$" },
  { name: "分数", before: "\\dfrac{", after: "}{}" },
  { name: "2乗", before: "^2", after: "" },
  { name: "√", before: "\\sqrt{", after: "}" },
  { name: "≦", before: "\\le ", after: "" },
  { name: "≧", before: "\\ge ", after: "" },
];

/** 文字の入力欄。`$` を含むときは、下に数式の見え方を出す。 */
export function TextField({ label, value, onChange, rows, placeholder, tools, fieldRef }: Props) {
  const own = useRef<HTMLTextAreaElement | null>(null);
  const area = fieldRef ?? own;

  const insert = (before: string, after: string) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    onChange(value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    });
  };

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {rows ? (
        <textarea
          ref={area}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {tools && rows && (
        <span className="field-tools">
          {snippets.map((sn) => (
            <button
              key={sn.name}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                insert(sn.before, sn.after);
              }}
            >
              {sn.name}
            </button>
          ))}
        </span>
      )}
      {value.includes("$") && (
        <span className="field-preview">
          <Rich text={value} />
        </span>
      )}
    </label>
  );
}
