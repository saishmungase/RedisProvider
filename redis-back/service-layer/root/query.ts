import pool from "@redis/business/src/db/index.js";
import { manager } from "./manager.js";

type QueryResponse = {
    status: "failed" | "passed";
    reason: "fetch" | "existence" | "command" | "success" | "unknown";
    response?: any;
};

const query = async (userPass: string, port: number, queryStr: string): Promise<QueryResponse> => {
    try {
        const data = await pool.query("SELECT * FROM Instances WHERE port = $1 AND status = 'RUNNING'", [port]);
        
        if (!data.rows[0]) {
            return {
                status: "failed",
                reason: "existence",
                response: "Can't Find the Mentioned Instance!"
            };
        }
        
        try {
            const response = await execQuery(queryStr, userPass, data.rows[0].containerid);
            return response;
        } catch (error) {
            console.error("Error While Running Query:- ", error);
            return {
                status: "failed",
                reason: "command",
                response: "Error While Executing Users Command!"
            };
        }
    } catch (error) {
        console.error("Error While Fetching Container For Query:- ", error);
        return {
            status: "failed",
            reason: "fetch",
            response: "Server Error"
        };
    }
};

const execQuery = async (queryStr: string, userPass: string, containerId: string): Promise<QueryResponse> => {
    try {
        const container = manager.getContainer(containerId);
        // This regex splits by space but respects single/double quotes (e.g., SET key "my value")
        const queryArgs = queryStr.match(/(?:[^\s"']+|['"][^'"]*["'])+/g) || [];
        const cleanArgs = queryArgs.map(arg => arg.replace(/^['"]|['"]$/g, '')); // Strip quotes
        
        const cmd = [
            "redis-cli",
            "--user",
            "redisuser",
            "-a",
            userPass,
            ...cleanArgs
        ];

        const exec = await container.exec({
            Cmd: cmd,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true
        });

        const stream = await exec.start({});
        
        const output = await new Promise<string>((resolve, reject) => {
            let data = "";
            stream.on("data", (chunk) => { data += chunk.toString(); });
            stream.on("end", () => resolve(data.trim()));
            stream.on("error", reject);
        });
        
        return {
            status: "passed",
            reason: "success",
            response: output
        };
        
    } catch (error) {
        console.error(`Error While Getting Container With Id :- ${containerId},`, error);
        return {
            status: "failed",
            reason: "existence",
            response: "Server Error"
        };
    }
};

export default query;