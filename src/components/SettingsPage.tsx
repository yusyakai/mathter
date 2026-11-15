import { useState } from "react";
import { FONT_SCALES, updateSettings, useSettings } from "../settings";
import { clearLearning } from "../storage";

export function SettingsPage({ onCleared }: { onCleared: () => void }) {
  const settings = useSettings();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main className="page">
      <h2 className="page-heading">表示</h2>
      <section className="panel">
        <label className="field">
          <span className="field-label">文字の大きさ</span>
          <select
            value={settings.fontScale}
            onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })}
          >
            {FONT_SCALES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.partnerHint}
            onChange={(e) => updateSettings({ partnerHint: e.target.checked })}
          />
          カードを運んでいる間、くっつけられる相手を光らせる
        </label>
        <p className="guide">
          光らせると、どのカードとくっつくかを自分で考えなくても分かります。まずは切ったまま使うのがおすすめです。
        </p>
      </section>

      <h2 className="page-heading">この端末の記録</h2>
      <section className="panel">
        <p className="guide">
          思考ボード・解答ボードに置いたカード、連想ノートの記録、学習時間を消して、最初の状態に戻します。自作の問題と自作の型は消えません。
        </p>
        <button
          type="button"
          className="hint-button"
          onClick={() => {
            if (confirm("学習の記録をすべて消します。元に戻せません。よろしいですか？")) {
              clearLearning();
              onCleared();
              setMessage("学習の記録を消しました。");
            }
          }}
        >
          学習の記録を消す
        </button>
        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
