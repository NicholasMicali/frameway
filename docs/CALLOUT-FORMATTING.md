# Callout text and link buttons

Select text in a callout's context field and use Bold or Italic. This is a small text-markup editor: `**bold**`, `*italic*`, and lines starting with `- ` or `1. ` render in the card. Formatting is always enabled; list markers can be typed directly. Nested formatting/lists and inline images are not supported in this increment.

Under Advanced, expand Optional link to add a button label and destination. The optional link button opens an authored HTTP or HTTPS destination in a new tab when clicked. Use a descriptive button label. No destination is fetched automatically; the linked resource may require a network connection. Invalid addresses are not saved. Clear the destination to remove the button.

Optional `bodyFormat: "basic"`, `actionLabel`, and `actionUrl` fields extend the version-2 step schema while preserving the stored text. Current readers render basic formatting regardless of the legacy bodyFormat flag. Backups, copies, and offline HTML/embed exports preserve them. Raw HTML is always escaped and action URLs reject executable schemes and embedded credentials. Older Frameway versions may display formatting markers literally and omit link buttons. Inline images from #13 remain deferred.
