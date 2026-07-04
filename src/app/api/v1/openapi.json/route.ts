import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    return NextResponse.json({
        openapi: "3.1.0",
        info: {
            title: "MXLens Agent & Automation API",
            version: "1.0.0",
            description: "Programmatic email analysis for AI agents, automation platforms, and security workflows."
        },
        servers: [
            {
                url: "/api/v1"
            }
        ],
        security: [{ bearerAuth: [] }],
        paths: {
            "/analyze": {
                post: {
                    summary: "Analyze one email",
                    description: "Accepts multipart upload, rawEmail, contentBase64, or safe HTTPS fetchUrl.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AnalyzeRequest" },
                                examples: {
                                    rawEmail: {
                                        value: {
                                            rawEmail: "From: security@example.com\\r\\nSubject: Test\\r\\n\\r\\nHello",
                                            filename: "message.eml",
                                            options: { analyzeBody: true, analyzeAttachments: false }
                                        }
                                    },
                                    signedUrl: {
                                        value: {
                                            fetchUrl: "https://storage.example.com/message.eml?signature=...",
                                            filename: "message.eml"
                                        }
                                    }
                                }
                            },
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        file: { type: "string", format: "binary" },
                                        analyzeBody: { type: "boolean" },
                                        analyzeAttachments: { type: "boolean" },
                                        externalId: { type: "string" },
                                        clientReferenceId: { type: "string" }
                                    },
                                    required: ["file"]
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Analysis result",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/AnalysisResult" }
                                }
                            }
                        }
                    }
                }
            },
            "/batches": {
                post: {
                    summary: "Create a bulk analysis batch",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BatchRequest" }
                            },
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        files: {
                                            type: "array",
                                            items: { type: "string", format: "binary" },
                                            maxItems: 50
                                        },
                                        analyzeBody: { type: "boolean" },
                                        analyzeAttachments: { type: "boolean" },
                                        clientReferenceId: { type: "string" }
                                    },
                                    required: ["files"]
                                }
                            }
                        }
                    },
                    responses: {
                        "202": {
                            description: "Batch accepted",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/BatchAccepted" }
                                }
                            }
                        }
                    }
                }
            },
            "/batches/{batchId}": {
                get: {
                    summary: "Get batch status and item results",
                    parameters: [
                        {
                            name: "batchId",
                            in: "path",
                            required: true,
                            schema: { type: "string" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Batch status",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/BatchStatus" }
                                }
                            }
                        }
                    }
                }
            },
            "/analyses/{analysisId}": {
                get: {
                    summary: "Get a persisted analysis result",
                    parameters: [
                        {
                            name: "analysisId",
                            in: "path",
                            required: true,
                            schema: { type: "string" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Analysis result",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/AnalysisResult" }
                                }
                            }
                        }
                    }
                }
            }
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "mxl_live API key"
                }
            },
            schemas: {
                AnalyzeRequest: {
                    type: "object",
                    properties: {
                        rawEmail: { type: "string" },
                        contentBase64: { type: "string" },
                        fetchUrl: { type: "string", format: "uri" },
                        filename: { type: "string" },
                        externalId: { type: "string" },
                        clientReferenceId: { type: "string" },
                        options: { $ref: "#/components/schemas/AnalysisOptions" }
                    }
                },
                BatchRequest: {
                    type: "object",
                    properties: {
                        items: {
                            type: "array",
                            maxItems: 50,
                            items: { $ref: "#/components/schemas/AnalyzeRequest" }
                        },
                        clientReferenceId: { type: "string" },
                        options: { $ref: "#/components/schemas/AnalysisOptions" }
                    },
                    required: ["items"]
                },
                AnalysisOptions: {
                    type: "object",
                    properties: {
                        analyzeBody: { type: "boolean", default: false },
                        analyzeAttachments: { type: "boolean", default: false }
                    }
                },
                AnalysisResult: {
                    type: "object",
                    properties: {
                        analysisId: { type: "string" },
                        verdict: { enum: ["clean", "suspicious", "malicious", "unknown"] },
                        riskScore: { type: "integer", minimum: 0, maximum: 100 },
                        trustScore: { type: "integer", minimum: 0, maximum: 100 },
                        confidence: { type: "object" },
                        findings: { type: "array", items: { type: "object" } },
                        signals: { type: "object" },
                        processingMs: { type: "integer" },
                        usage: { type: "object" }
                    }
                },
                BatchAccepted: {
                    type: "object",
                    properties: {
                        batchId: { type: "string" },
                        status: { type: "string" },
                        totalItems: { type: "integer" },
                        statusUrl: { type: "string" }
                    }
                },
                BatchStatus: {
                    type: "object",
                    properties: {
                        batchId: { type: "string" },
                        status: { enum: ["QUEUED", "PROCESSING", "COMPLETED", "PARTIAL_FAILED", "FAILED"] },
                        totalItems: { type: "integer" },
                        completedItems: { type: "integer" },
                        failedItems: { type: "integer" },
                        items: { type: "array", items: { type: "object" } }
                    }
                }
            }
        }
    });
}
