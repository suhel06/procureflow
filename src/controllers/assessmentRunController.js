
const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execFileAsync = promisify(execFile);

const projectRoot = path.resolve(__dirname, "../..");

const scriptPath = path.join(
    projectRoot,
    "src",
    "scripts",
    "testAllClubbing.js"
);

const reportPath = path.join(
    projectRoot,
    "output",
    "assessment_report.json"
);

let assessmentRunning = false;

exports.runAssessment = async (req, res) => {
    if (assessmentRunning) {
        return res.status(409).json({
            success: false,
            message: "An assessment is already running."
        });
    }

    if (!fs.existsSync(scriptPath)) {
        return res.status(500).json({
            success: false,
            message: "Assessment runner script not found."
        });
    }

    assessmentRunning = true;

    try {
        console.log("Starting procurement assessment...");

        const { stdout } = await execFileAsync(
            process.execPath,
            [scriptPath],
            {
                cwd: projectRoot,
                windowsHide: true,
                timeout: 600000,
                maxBuffer: 20 * 1024 * 1024
            }
        );

        if (!fs.existsSync(reportPath)) {
            throw new Error(
                "Assessment finished but report was not generated."
            );
        }

        const report = JSON.parse(
            fs.readFileSync(reportPath, "utf8")
        );

        console.log("Procurement assessment completed.");

        return res.status(200).json({
            success: true,
            message: "Assessment completed successfully.",
            generated_at: report.generated_at,
            policy: report.policy,
            summary: report.summary,
            output: stdout.slice(-3000)
        });

    } catch (error) {
        console.error("Assessment execution failed:", error);

        return res.status(500).json({
            success: false,
            message: "Assessment execution failed.",
            details: (
                error.stderr ||
                error.stdout ||
                error.message ||
                "Unknown error"
            ).slice(-4000)
        });

    } finally {
        assessmentRunning = false;
    }
};
