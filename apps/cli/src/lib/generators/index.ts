/**
 * Generator barrel export
 *
 * All generators accept ProjectConfig and return string content
 * for the files they produce. The scaffold orchestrator calls them
 * and writes the output to the destination directory.
 */

export { renderDockerCompose, renderDockerComposeProd } from './docker'
export { renderNginxConfig } from './nginx'
export { buildServerEnv, buildWebEnv } from './env'
export { renderGithubActionsWorkflow } from './ci'
export { renderDeploymentGuide } from './deployment'
export { applyBackendTransform, applyRustFamilyTransform } from './backend'
export { renderGitignore } from './gitignore'
export {
  applyRustScaffoldTransform,
  applyRustServiceApiScaffold,
  renderRustCi,
  renderRustDockerCompose,
  renderRustDockerfile,
  renderRustEnvExample,
  renderRustWorkspaceCargoToml,
} from './rust'
export { renderServiceApiWebLayout, renderServiceApiWebPage } from './scaffold-home'
export { applySolanaScaffoldTransform } from './solana'
export { applyDatabaseTransform } from './database'
export { applyOrmTransform } from './orm'
export { buildRootAgentsMd, buildGeneratedArchitectureMd } from './agent-docs'
export { buildReadme } from './readme'
export { buildShowcaseMdx } from './showcase'
export { writeSkillConfigs, buildSkillRecommendations } from './skills'
export { applyBundleTransforms } from './bundles'
