# Zenso Documentation

The public developer documentation platform for the Zenso e-paper device and hardware ecosystem.

## Language

**Locale**:
An ISO language code identifying an officially supported translation of the documentation (`en`, `pl`, `ja`).
_Avoid_: Language, dialect, culture

**Localized Route**:
A URL pathname prefixed with the target locale identifying a documentation page (e.g. `/{locale}/docs/...`).
_Avoid_: URL, link, endpoint, path string

**Route Navigator**:
The in-process module responsible for resolving, normalising, and translating localized documentation routes across server and client execution contexts.
_Avoid_: Router, URL helper, path utility, router service

**Documentation Path**:
The canonical content route segment under `/docs` independent of any locale prefix.
_Avoid_: Slug, doc URL, document page
