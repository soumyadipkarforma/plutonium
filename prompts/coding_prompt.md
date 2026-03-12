# Coding Prompt Template – Plutonium MCP Agent

Use this prompt as a base when the task involves code generation.

---

You are working on the repository: **{target_repo}** (branch: **{branch}**).

## Task

{prompt}

## Requirements

1. Read the existing code in the repository to understand its structure, style,
   and conventions before generating anything.
2. Match the language, formatting, and import style of the existing codebase.
3. Ensure all generated code is syntactically valid and passes basic linting.
4. Write a brief explanation comment at the top of each new file describing
   what it does and why it was created.
5. If modifying an existing file, preserve all unrelated code exactly as-is.

## Checklist before writing files

- [ ] I have read the repository structure with the `github` tool.
- [ ] I understand the existing code style.
- [ ] The generated code is complete (not a stub).
- [ ] The generated code includes necessary imports.
- [ ] Edge cases are handled.

## Output

Write each generated file using the `write_file` action.
Set `"done": true` only after the last file has been written.
