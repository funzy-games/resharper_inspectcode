import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {Installer} from './installer'
import {Report} from './report'

async function run(): Promise<void> {
  try {
    // const installer = new Installer()
    // const version: string = core.getInput('version') ?? ''
    // await installer.install(version)

    const solutionPath: string = core.getInput('solutionPath')
    const outputPath = 'result.xml'

    let command = `dotnet jb inspectcode --build --output=${outputPath} --severity=HINT --absolute-paths ${solutionPath}`

    const include: string = core.getInput('include')
    if (include) {
      command += ` --include=${include.trim().replace(/[\r\n]+/g, ';')}`
    }

    const exclude = core.getInput('exclude') ?? ''
    if (exclude !== '') {
      command += ` --exclude=${exclude}`
    }

    const solutionWideAnalysis: string =
      core.getInput('solutionWideAnalysis') ?? ''
    if (solutionWideAnalysis !== '') {
      command += ` --${
        solutionWideAnalysis.toLowerCase() !== 'true' ? 'no-' : ''
      }swea`
    }

    const workingDir: string = core.getInput('workingDirectory')
    if (workingDir) {
      core.debug(`Changing to working directory: ${workingDir}`)
      process.chdir(workingDir)
    }

    await exec.exec(command)

    const ignoreIssueType = core.getInput('ignoreIssueType') ?? ''

    const report = new Report(outputPath, ignoreIssueType)
    report.output()

    const failOnIssue = core.getInput('failOnIssue')
    const minimumSeverity = core.getInput('minimumSeverity') ?? 'notice'

    if (failOnIssue !== '1') {
      return
    }

    if (report.issueOverThresholdIsExists(minimumSeverity)) {
      core.setFailed('Issues found.')
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
