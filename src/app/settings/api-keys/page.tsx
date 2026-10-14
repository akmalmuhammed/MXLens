import { listApiKeys } from "@/actions/api-keys";
import { ApiKeysClient } from "./ApiKeysClient";

export default async function ApiKeysPage() {
    const keys = await listApiKeys();

    return <ApiKeysClient initialKeys={keys} />;
}
