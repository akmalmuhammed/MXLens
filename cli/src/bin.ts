import { run } from "./main";

async function readStdin(): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString("utf8");
}

run(process.argv.slice(2), {
    stdout: text => process.stdout.write(text),
    stderr: text => process.stderr.write(text),
    readStdin,
    color: Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
}).then(
    code => {
        process.exitCode = code;
    },
    error => {
        process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
        process.exitCode = 1;
    }
);
