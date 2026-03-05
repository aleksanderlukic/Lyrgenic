// __tests__/api/register.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

// Helper: create a mock Request
function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({ password: "secret123" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 400 when password is too short", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({ email: "test@test.com", password: "abc" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "existing-user" });
    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({ email: "taken@test.com", password: "secret123" });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already/i);
  });

  it("returns 201 on success", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({
      id: "new-user-id",
      email: "new@test.com",
    });
    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({ email: "new@test.com", password: "secret123" });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty("id", "new-user-id");
  });
});
