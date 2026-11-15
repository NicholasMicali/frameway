# Callout text and link buttons

Select text in a callout's context field and use Bold, Italic, Bullet list, or Numbered list. This is a small text-markup editor: `**bold**`, `*italic*`, and lines starting with `- ` or `1. ` render in the card. The formatting checkbox lets you display the source literally. Existing projects remain plain text until formatting is enabled. Nested formatting/lists and inline images are not supported in this increment.

An optional link button opens an authored HTTP or HTTPS destination in a new tab when clicked. Use a descriptive button label. No destination is fetched automatically; the linked resource may require a network connection. Invalid addresses are not saved. Clear the destination to remove the button.

Optional `bodyFormat: "basic"`, `actionLabel`, and `actionUrl` fields extend the version-2 step schema without changing existing text. Backups, copies, and offline HTML/embed exports preserve them. Raw HTML is always escaped and action URLs reject executable schemes and embedded credentials. Older Frameway versions may display formatting markers literally and omit link buttons. Inline images from #13 remain deferred.
