import { exec } from "node:child_process";
import { platform } from "node:os";
import wp from "wait-port";
import ezSpawn from "@jsdevtools/ez-spawn";
// import pushWorkflowRunInProgressFixture from "./fixtures/workflow_run.in_progress.json" with { type: "json" };
import prWorkflowRunRequestedFixture from "./fixtures/pr.workflow_run.requested.json" with { type: "json" };
import prPullRequestSynchronizeFixture from "./fixtures/pr.pull_request.json" with { type: "json" };
import { server } from "./msw.js";

describe("publish", () => {
  beforeAll(async () => {
    await run();

    server.listen({
      onUnhandledRequest(request) {
        console.log(
          "Unhandled %s %s",
          request.method,
          request.url,
          request.body,
        );
      },
    });

    server.events.on("request:start", ({ request }) => {
      console.log("MSW intercepted:", request.method, request.url);
    });

    return async () => {
      server.close();
      await killPort();
    };
  });

  it("should be green", async () => {
    const { event, payload } = prWorkflowRunRequestedFixture;
    const pr = prPullRequestSynchronizeFixture;
    const webhookUrl = new URL("/webhook", serverUrl);

    if (pr) {
      const prWebhookData = await fetch(webhookUrl, {
        method: "POST",
        headers: [
          ["x-github-delivery", "d81876a0-e8c4-11ee-8fca-9d3a2baa9707"],
          ["x-github-event", "pull_request"],
        ],
        body: JSON.stringify(pr.payload),
      }).then((response) => response.json());
      expect(prWebhookData.ok).toBe(true);
    }

    const webhookData = await fetch(webhookUrl, {
      method: "POST",
      headers: [
        ["x-github-delivery", "d81876a0-e8c4-11ee-8fca-9d3a2baa9707"],
        ["x-github-event", event],
      ],
      body: JSON.stringify(payload),
    }).then((response) => response.json());

    expect(webhookData.ok).toBe(true);

    // what is created?
    const env = Object.entries({
      TEST: true,
      GITHUB_SERVER_URL: new URL(payload.workflow_run.html_url).origin,
      GITHUB_REPOSITORY: payload.repository.full_name,
      GITHUB_RUN_ID: payload.workflow_run.id,
      GITHUB_RUN_ATTEMPT: payload.workflow_run.run_attempt,
      GITHUB_ACTOR_ID: payload.sender.id,
      GITHUB_SHA: payload.workflow_run.head_sha,
      GITHUB_ACTION: payload.workflow_run.id,
      GITHUB_JOB: payload.workflow_run.name,
      GITHUB_REF_NAME: pr
        ? `${pr.payload.number}/merge`
        : payload.workflow_run.head_branch,
    })
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
    await ezSpawn.async(
      `pnpm cross-env ${env} pnpm run publish:playgrounds`,
      [],
      {
        stdio: "inherit",
        shell: true,
      },
    );

    const [owner, repo] = payload.repository.full_name.split("/");
    const ref = pr?.payload.number ?? payload.workflow_run.head_branch;
    // install
    const playgroundShaUrl = new URL(
      `/${owner}/${repo}/playground-a@${payload.workflow_run.head_sha.slice(0, 7)}`,
      serverUrl,
    );

    const playgroundShaData = await fetch(playgroundShaUrl, {
      method: "GET",
    });

    const playgroundShaBlob = await playgroundShaData.blob();
    assert.ok(playgroundShaBlob.size > 0, "playground size should not be zero");
    assert.equal(
      playgroundShaData.status,
      200,
      "playground response should be 200",
    );

    const playgroundWithoutShaUrl = new URL(
      `/${owner}/${repo}/playground-a@${ref}`,
      serverUrl,
    );
    const playgroundWithoutShaData = await fetch(playgroundWithoutShaUrl, {
      method: "GET",
    });
    const playgroundWithoutShaBlob = await playgroundWithoutShaData.blob();
    assert.deepEqual(
      await playgroundShaBlob.arrayBuffer(),
      await playgroundWithoutShaBlob.arrayBuffer(),
      "sha urls and non-sha urls should not give different results",
    );
  });
});

const PORT = 8788; // wrangler default

const serverUrl = new URL(`http://localhost:${PORT}`);

const abortController = new AbortController();
async function run() {
  // await ezSpawn.async(
  //   `pnpm cross-env TEST=true API_URL=${serverUrl.href} pnpm -w run build`,
  //   [],
  //   {
  //     stdio: "inherit",
  //     shell: true,
  //   },
  // );

  ezSpawn.async("pnpm --filter=backend run preview", [], {
    stdio: "inherit",
    shell: true,
    signal: abortController.signal,
    killSignal: "SIGINT",
  });

  await wp({ port: PORT });
}

async function killPort() {
  const os = platform();
  try {
    // checks the operating system
    if (os === "win32") {
      exec(
        "powershell.exe -Command \"Get-Process -Name 'workerd' | Stop-Process -Force\"",
        (error, stdout, stderr) => {
          if (error) {
            console.error(
              `Error stopping process on Windows: ${error.message}`,
            );
            throw error;
          }
          if (stderr) {
            throw stderr;
          }
        },
      );
    } else {
      await ezSpawn.async("kill -9 $(pgrep -f workerd)", [], {
        stdio: "inherit",
        shell: true,
        signal: abortController.signal,
        killSignal: "SIGINT",
      });
    }
  } catch (error) {
    console.error(error);
    abortController.abort();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  } finally {
    // abortController.abort();
    // eslint-disable-next-line unicorn/no-process-exit
    // process.exit(0);
  }
}
