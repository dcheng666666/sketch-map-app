interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  onExportPng: () => void | Promise<void>;
  disabled: boolean;
  isExporting: boolean;
}

export function Toolbar({
  title,
  onTitleChange,
  onExportPng,
  disabled,
  isExporting,
}: Props) {
  return (
    <div className="toolbar">
      <label className="toolbar-field">
        Map title
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="My travel sketch map"
        />
      </label>

      <div className="toolbar-actions">
        <button type="button" onClick={onExportPng} disabled={disabled}>
          {isExporting ? "Preparing..." : "Download PNG"}
        </button>
      </div>
    </div>
  );
}
