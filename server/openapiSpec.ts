export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "IKSHOVIA AI Learning Platform API",
    version: "1.0.0",
    description: "Interactive Swagger API documentation and test explorer for the IKSHOVIA Civil Services (UPSC CSE & BPSC) platform. Test endpoints for Current Affairs, Syllabus, Knowledge Graph, PYQ Question Bank, Mock Tests, AI Tutor, and Data Pipeline.",
    contact: {
      name: "IKSHOVIA Engineering Team",
      email: "ibeingakash@gmail.com"
    }
  },
  servers: [
    {
      url: "/",
      description: "Current Host Environment"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT / Token"
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["System & Health"],
        summary: "Platform Health Check",
        description: "Returns application health status and current UTC timestamp.",
        responses: {
          "200": {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    app: { type: "string", example: "IKSHOVIA" },
                    timestamp: { type: "string", example: "2026-08-19T03:30:00.000Z" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      get: {
        tags: ["System & Health"],
        summary: "API Health Check",
        description: "Returns API health status.",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    app: { type: "string", example: "IKSHOVIA" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/data/health": {
      get: {
        tags: ["Data Pipeline & Ingestion"],
        summary: "FastAPI Bridge Health Check",
        description: "Returns health status of the internal high-performance data ingestion service.",
        responses: {
          "200": {
            description: "FastAPI data service is operational"
          }
        }
      }
    },
    "/api/current-affairs/day": {
      get: {
        tags: ["Current Affairs"],
        summary: "Get Day-Wise Current Affairs Feed",
        description: "Retrieves top stories, important developments, editorials, and multi-source topic clusters for a single selected date.",
        parameters: [
          {
            name: "date",
            in: "query",
            description: "Date formatted as YYYY-MM-DD (e.g. 2026-08-18)",
            required: false,
            schema: { type: "string", example: "2026-08-18" }
          },
          {
            name: "exam",
            in: "query",
            description: "Filter by exam target: UPSC_CSE, BPSC, or ALL",
            required: false,
            schema: { type: "string", default: "ALL", example: "ALL" }
          },
          {
            name: "biharOnly",
            in: "query",
            description: "Show only Bihar state special records",
            required: false,
            schema: { type: "boolean", default: false }
          },
          {
            name: "page",
            in: "query",
            description: "Page number for Important Developments",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "pageSize",
            in: "query",
            description: "Items per page for Important Developments",
            required: false,
            schema: { type: "integer", default: 8 }
          }
        ],
        responses: {
          "200": {
            description: "Successfully retrieved day-wise feed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    formattedDate: { type: "string" },
                    topStories: { type: "array", items: { type: "object" } },
                    importantDevelopments: { type: "array", items: { type: "object" } },
                    editorials: { type: "array", items: { type: "object" } },
                    topicClusters: { type: "array", items: { type: "object" } },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        pageSize: { type: "integer" },
                        totalPages: { type: "integer" },
                        totalImportant: { type: "integer" }
                      }
                    },
                    digest: {
                      type: "object",
                      properties: {
                        totalEligible: { type: "integer" },
                        sourcesCount: { type: "integer" },
                        topStoriesCount: { type: "integer" },
                        editorialsCount: { type: "integer" },
                        topicClustersCount: { type: "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/current-affairs/articles": {
      get: {
        tags: ["Current Affairs"],
        summary: "List Current Affairs Articles",
        description: "List and search through curated current affairs and official releases with comprehensive filters.",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "examRelevance", in: "query", schema: { type: "string", enum: ["UPSC", "BPSC", "BOTH"] } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } }
        ],
        responses: {
          "200": {
            description: "List of articles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    articles: { type: "array", items: { type: "object" } },
                    total: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/current-affairs/editorials": {
      get: {
        tags: ["Current Affairs"],
        summary: "List Lead Editorials & Op-Eds",
        description: "Fetch high-yield editorial syntheses from The Hindu, Indian Express, and supplementary analyses.",
        parameters: [
          { name: "source", in: "query", schema: { type: "string" } },
          { name: "gsPaper", in: "query", schema: { type: "string", enum: ["GS-1", "GS-2", "GS-3", "GS-4", "ESSAY"] } },
          { name: "limit", in: "query", schema: { type: "integer", default: 30 } }
        ],
        responses: {
          "200": {
            description: "List of editorial records"
          }
        }
      }
    },
    "/api/current-affairs/clusters": {
      get: {
        tags: ["Current Affairs"],
        summary: "List Multi-Source Topic Clusters",
        description: "Fetch clustered events aggregated across PIB, The Hindu, Indian Express, Supreme Court, and ministries.",
        responses: {
          "200": {
            description: "List of active topic clusters"
          }
        }
      }
    },
    "/api/current-affairs/freshness": {
      get: {
        tags: ["Current Affairs"],
        summary: "Check Source Ingestion Freshness",
        description: "Returns real-time sync status for official portals (PIB, RBI, ISRO, Supreme Court, Bihar Govt).",
        responses: {
          "200": {
            description: "Source freshness telemetry"
          }
        }
      }
    },
    "/api/current-affairs/ingest": {
      post: {
        tags: ["Current Affairs"],
        summary: "Trigger Multi-Source Current Affairs Ingestion",
        description: "Triggers on-demand synchronization across all 7 official and news source providers.",
        responses: {
          "200": {
            description: "Ingestion pipeline run summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    fetchedCount: { type: "integer" },
                    createdCount: { type: "integer" },
                    duplicateCount: { type: "integer" },
                    editorialsCount: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User / Admin Login",
        description: "Authenticates student, admin, or superadmin users and issues an access token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "student@ikshovia.com" },
                  password: { type: "string", example: "student123" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    token: { type: "string" },
                    user: { type: "object" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Invalid credentials"
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Student Registration",
        description: "Registers a new learner account.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Akash" },
                  email: { type: "string", example: "akash@example.com" },
                  password: { type: "string", example: "SecurePass123" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User registered successfully"
          }
        }
      }
    },
    "/api/questions": {
      get: {
        tags: ["Question Bank & PYQ"],
        summary: "List Questions / PYQs",
        description: "Fetches verified UPSC and BPSC questions filtered by subject, difficulty, exam tag, or concept.",
        parameters: [
          { name: "subjectId", in: "query", schema: { type: "string" } },
          { name: "conceptId", in: "query", schema: { type: "string" } },
          { name: "difficulty", in: "query", schema: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] } },
          { name: "isPyq", in: "query", schema: { type: "boolean" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } }
        ],
        responses: {
          "200": {
            description: "List of questions with verification status"
          }
        }
      }
    },
    "/api/subjects": {
      get: {
        tags: ["Syllabus & Knowledge Graph"],
        summary: "Get All Syllabus Subjects",
        description: "Retrieves authoritative UPSC & BPSC syllabus subjects (Polity, Economy, History, Geography, Environment, Science & Tech, Bihar Special).",
        responses: {
          "200": {
            description: "List of subjects"
          }
        }
      }
    },
    "/api/concepts": {
      get: {
        tags: ["Syllabus & Knowledge Graph"],
        summary: "List Concepts",
        description: "Retrieves interconnected learning concepts linked to syllabus topics and PYQ bank.",
        parameters: [
          { name: "subjectId", in: "query", schema: { type: "string" } },
          { name: "topicId", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "List of concepts"
          }
        }
      }
    },
    "/api/mock-tests": {
      get: {
        tags: ["Mock Tests & Assessment"],
        summary: "List Available Mock Tests",
        description: "Fetches Prelims adaptive sprint, full-length, and sectional mock tests.",
        responses: {
          "200": {
            description: "List of published mock tests"
          }
        }
      }
    },
    "/api/revision/items": {
      get: {
        tags: ["Spaced Repetition & Revision"],
        summary: "Get Overdue Revision Items",
        description: "Fetches personalized retention items due for review based on the student's mastery decay curve.",
        parameters: [
          { name: "userId", in: "query", required: true, schema: { type: "string", example: "usr_student" } }
        ],
        responses: {
          "200": {
            description: "List of revision items"
          }
        }
      }
    },
    "/api/v1/data/sources": {
      get: {
        tags: ["Data Pipeline & Ingestion"],
        summary: "List Official Data Sources",
        description: "Retrieves registered source adapters from the high-throughput data engine.",
        responses: {
          "200": {
            description: "List of sources"
          }
        }
      }
    },
    "/api/v1/data/resources": {
      get: {
        tags: ["Data Pipeline & Ingestion"],
        summary: "List Ingested Resources",
        description: "Retrieves raw, normalized, and categorized documents ingested from official feeds.",
        responses: {
          "200": {
            description: "List of ingested resources"
          }
        }
      }
    },
    "/api/v1/data/search": {
      get: {
        tags: ["Data Pipeline & Ingestion"],
        summary: "Full-Text Knowledge Search",
        description: "Vector & full-text keyword retrieval across official reports, judgments, and current affairs.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", example: "Article 226" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          "200": {
            description: "Search results with relevance scores"
          }
        }
      }
    },
    "/api/v1/data/ai/tutor": {
      post: {
        tags: ["AI Mentor & Tutor"],
        summary: "Grounded AI Tutor Query",
        description: "Sends a question to the AI tutor with retrieved syllabus and current affairs grounding.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userPrompt"],
                properties: {
                  userPrompt: { type: "string", example: "Explain the difference between Article 32 and Article 226 for UPSC Prelims." },
                  conceptId: { type: "string", example: "c_art32" },
                  targetExam: { type: "string", example: "UPSC CSE" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "AI response with grounding citations"
          }
        }
      }
    }
  }
};
