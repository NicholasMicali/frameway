# Try Frameway and report feedback

Use [the README](../README.md) to build and install the Chrome extension. The goal is to create a walkthrough you would actually send to a colleague or customer. Start with approved dummy data: the repository and its GitHub issues are public.

## A short test session

1. Record a short workflow with several clicks, scrolling, and a pause. Stop and confirm the editor opens with screenshot/video steps.
2. Edit the title, a callout, and an area highlight. Change the walkthrough theme, reorder a step, and trim or split a video.
3. Preview from the beginning and follow it as a new viewer. Check that every step can be reached and the ending makes sense.
4. Reload the editor and check that your work remains saved.
5. Export a project backup and import it again. Download standalone HTML and open it offline. If relevant, try the embed ZIP on a test site.
6. Note the most confusing moment, anything that failed, and the one improvement that would make this useful in your daily work.

Windows enterprise testers should also work through the [Windows checklist](../TODO.md#windows-enterprise-validation--owner-feedback-received). A policy restriction is a useful finding; there is no need to bypass it.

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

1. Open your project, then select **Export / Download → Export project ↗**. Save the `.frameway.zip` file somewhere outside browser storage. Keep it zipped.
2. Select **Import** in the Frameway header and choose that ZIP. This creates a separate editable project; it does not overwrite the original.
3. Preview the imported copy and check its video, screenshots, title, callouts, branding, and step order. Make an edit and reload to confirm it saves.
4. To test recovery across an extension update or another computer, export before updating, then import the same ZIP into the destination installation. You can also use a separate Chrome profile for a clean recovery test.

**Download HTML** and **Export embed** create viewer-facing playback exports. Use **Export project** for an editable backup. The extension and localhost editor have separate libraries; project ZIPs transfer work between them.

## Reported findings

The owner reports successful Windows use, delivery of standalone HTML to other people, and editable project recovery through export → reinstall → import. Exact Windows/Chrome versions, managed-policy configuration, and sharing channel were not supplied. This does not establish the remaining detailed Windows checklist items.

| Environment / version          | Scenario                                          | Result                | Follow-up                                                                                                    |
| ------------------------------ | ------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Windows — versions unspecified | Use Frameway and send exported HTML to recipients | Owner reports success | Editable recovery also confirmed; ZIP delivery and specific enterprise policy constraints remain unconfirmed |
