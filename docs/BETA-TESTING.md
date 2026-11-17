# Try Frameway and report feedback

Download the extension ZIP from the [v0.3.0 beta release](https://github.com/NicholasMicali/frameway/releases/tag/v0.3.0), extract it to a folder you will keep, then use Chrome → Extensions → Developer mode → Load unpacked to select the folder containing `manifest.json`. [The README](../README.md) also explains building from source. The goal is to create a walkthrough you would actually send to a colleague or customer. Start with approved dummy data: the repository and its GitHub issues are public.

## A short test session

1. Record a short workflow with several clicks, scrolling, and a pause. Stop and confirm the editor opens with screenshot/video steps.
2. Edit the title, a callout, and an area highlight. Change the walkthrough theme, reorder a step, and trim or split a video.
3. Preview from the beginning and follow it as a new viewer. Check that every step can be reached and the ending makes sense.
4. Reload the editor and check that your work remains saved.
5. Export a project backup and import it again. Download standalone HTML and open it offline. If relevant, try the embed ZIP on a test site.
6. Note the most confusing moment, anything that failed, and the one improvement that would make this useful in your daily work.

Windows enterprise testers should also work through the [Windows checklist](../TODO.md#windows-enterprise-validation--owner-feedback-received). A policy restriction is a useful finding; there is no need to bypass it.

## Home and project library

The Library shows two ways to capture a workflow: use Frameway → Record this tab from Chrome’s toolbar for automatic click-by-click steps, or choose Record my screen for a desktop window or an entire screen and add screenshot steps in the editor. Both paths currently record silent video. Your project library comes before the visible Record → Edit → Share guide, sharing/backup guidance, and use cases. Help & installation links to this guide; developer setup instructions are kept out of the everyday workspace.

Search by project name or sort by creation date, last edited, name, or estimated media size. Click a project to open it. Its three-dot options menu offers Rename, Make a copy, Export backup, and Delete with confirmation. Import project backup restores an editable project ZIP; HTML exports are for viewing. The header project picker includes Library and a searchable project list. Options contains Storage & backups, Import project backup, and Keyboard shortcuts.

When testing, create two walkthroughs, rename one from its menu, and try Last edited sorting. Opening or exporting should not change the edit date. Make a copy, edit it, and confirm the original stays unchanged. Find and reopen a project, export its backup, and cancel a deletion before trying a confirmed deletion on a disposable test project. Reload and verify the remaining project is intact.

## Keyboard help

Open **Options → Keyboard shortcuts** using the keyboard. Check that Escape returns focus to Options. Try Undo/Redo outside text fields and the arrow keys on a focused timeline trim handle. Opening a dialog should prevent project Undo/Redo behind it. Inside a text field, normal browser text editing should still work.

## Report a bug or request

Open an [issue](https://github.com/NicholasMicali/frameway/issues/new), or send these notes directly to the maintainer. One issue per problem makes follow-up easier.

```text
Summary:
Type: bug / usability / feature request / environment restriction
Impact: blocks the workflow / workaround available / minor inconvenience
Frameway version or commit:
OS and version:
Chrome version (and whether managed by your organization):
Installation: built from source / extension ZIP
Mode: extension / website recorder
Use case and intended audience:
Steps to reproduce:
Expected result:
Actual result:
How often it happens:
Workaround, if any:
For feature requests: what task would this enable or make easier?
```

For alignment problems, include browser zoom, display scaling, and monitor setup. For exports, include the export type, approximate recording length, and recipient browser/sharing channel.

Share only sanitized screenshots or logs. Do not attach credentials, customer data, internal URLs, or real enterprise recordings to public issues. Playback trims do not remove the underlying recording from exports. Store local test artifacts outside the checkout or in ignored `recordings/` and `exports/` directories.

## Backup and import

1. Open your project, then select **Share → Export project backup**. Save the `.frameway.zip` file somewhere outside browser storage. Keep it zipped.
2. Select **Options → Import project backup** in the Frameway header and choose that ZIP. This creates a separate editable project; it does not overwrite the original.
3. Preview the imported copy and check its video, screenshots, title, callouts, branding, and step order. Make an edit and reload to confirm it saves.
4. To test recovery across an extension update or another computer, export before updating, then import the same ZIP into the destination installation. You can also use a separate Chrome profile for a clean recovery test.

**Download HTML** and **Export embed** create viewer-facing playback exports. Use **Export project backup** for an editable backup. The extension and localhost editor have separate libraries; project ZIPs transfer work between them.

## Reported findings

The owner reports successful Windows use, delivery of standalone HTML to other people, and editable project recovery through export → reinstall → import. Exact Windows/Chrome versions, managed-policy configuration, and sharing channel were not supplied. This does not establish the remaining detailed Windows checklist items.

| Environment / version          | Scenario                                          | Result                | Follow-up                                                                                                    |
| ------------------------------ | ------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Windows — versions unspecified | Use Frameway and send exported HTML to recipients | Owner reports success | Editable recovery also confirmed; ZIP delivery and specific enterprise policy constraints remain unconfirmed |
