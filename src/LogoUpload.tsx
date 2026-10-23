import { useRef } from 'react';
import { Icon } from './Icon';

export function LogoUpload({
  logo,
  disabled,
  onUpload,
  onRemove,
}: {
  logo?: string;
  disabled: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="logo-upload">
      <span className="field-label">Company logo</span>
      <input
        ref={input}
        aria-label="Company logo"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onUpload(file);
        }}
      />
      <div className="logo-upload-actions">
        {logo && <img src={logo} alt="Uploaded company logo" />}
        <button disabled={disabled} onClick={() => input.current?.click()}>
          <Icon name="upload" />
          {logo ? 'Replace logo' : 'Upload logo'}
        </button>
        {logo && (
          <button
            className="icon-button danger-text"
            aria-label="Remove logo"
            title="Remove logo"
            disabled={disabled}
            onClick={onRemove}
          >
            <Icon name="trash" />
          </button>
        )}
      </div>
      <p className="field-note">PNG, JPEG, or WebP, up to 5 MB. Shown only on title slides.</p>
    </div>
  );
}
