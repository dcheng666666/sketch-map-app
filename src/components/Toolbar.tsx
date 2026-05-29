interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  onExportPng: () => void | Promise<void>;
  disabled: boolean;
}

export function Toolbar({
  title,
  onTitleChange,
  onExportPng,
  disabled,
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
          Download PNG
        </button>
      </div>
    </div>
  );
}
