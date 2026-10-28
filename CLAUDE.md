# every-other-skill

Skill storage for OtherSkill. `otherskill.config.json` holds the categories; `.otherskill/bank/<category>/<skill>--<id>/` holds full skill copies with license and `.otherskill.json` provenance.

- Add skills with `otherskill add github:owner/repo --path <dir> --category <id> --scope project --cwd .`; never hand-edit files inside a bank skill.
- Keep the README skill table in sync with the bank when adding or removing skills.
- Check a source's license before adding it; skip non-commercial licenses.
- Test skills with skill-up (`skill-upper` skill), not custom scripts.
