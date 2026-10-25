# DealAtlas — Phase 2 Status (2026-10-25)

## Public site
- URL: https://sky-net-x.github.io/dealatlas/
- Repository: https://github.com/sky-net-x/dealatlas
- GitHub Pages live and smoke tested at HTTP 200.
- Five international outbound marketplace searches generated for arbitrary user queries; eBay sold-search references for US/DE/GB/AU; JP points to Mercari's real search.
- Median benchmark from a user's own 3–40 sold comparables, each entered with explicit currency; uses real daily FX.
- Current site keeps sample comparison data clearly labeled synthetic.
- Seven Node tests pass; live published site verified 390px mobile, zero JS errors.

## Windows workspace connection: one user action required
- Project folder physically exists at `Documents\Docker\MCP Environment\DealAtlas` alongside Education, Online Converters, Prefabricated Houses.
- Installed local launcher: `START-HERE-Connect-DealAtlas.cmd`.
- Supporting scripts: `Connect-And-Update-DealAtlas.ps1` and `Enable-DealAtlas-Workspace.ps1`.
- Double-click launcher **on Windows** with Docker Desktop running.
- Launcher backups up existing compose and workspace config, inserts `../MCP Environment/DealAtlas:/dealatlas` into Docker Compose override and `"dealatlas": "/dealatlas"` into starter `workspace-mcp.config.json`, validates compose, recreates only dev-mcp service and verifies mount.
- It also promotes tested revision files from `revisions/2026-10-25-global-search/` to local root (backups in `research/site-backups`) and runs tests in the mounted container.
- **Do not claim the mount is active until** the user runs launcher and `mcp__Teaching_MCP__workspace_list` returns `dealatlas`.
- Browser file transfer is available as fallback but not direct filesystem access.
- These local Windows setup scripts are intentionally **not** published to the public repo.
- If failure occurs, preserve user logs and inspect backups. Do not overwrite existing mount mappings or remove project folders.

## Data limits
- eBay developer credentials still pending; automatic actual listings are not live.
- No claim of verified profits, sold comps, or user-uploaded sales authenticity.
- No spending; everything has remained on free tiers.

## Next build iteration
- After mount active, verify direct read/write of `/dealatlas`.
- Develop permissioned listing source ingestion after eBay authorization and separate sold-comps validation before any bargain score.
