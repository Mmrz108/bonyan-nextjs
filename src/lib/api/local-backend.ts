import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady } from "@/lib/db/ensure";
import { toAuthUser } from "@/lib/auth/jwt";
import type { User } from "@prisma/client";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function paginate<T>(items: T[], page: number, pageSize = 20) {
  const start = (page - 1) * pageSize;
  const results = items.slice(start, start + pageSize);
  return {
    count: items.length,
    next: start + pageSize < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results,
  };
}

function pageFromSearch(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return Math.max(1, Number(params.get("page") || "1") || 1);
}

function serializeProject(project: unknown) {
  if (!project || typeof project !== "object") return null;
  const p = project as {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    description: string;
    clientId: string | null;
    client?: { name: string } | null;
    contractId: string | null;
    contract?: { referenceCode: string } | null;
    status: string;
    projectType: string;
    supervisionType: string;
    assignedRegion: string;
    location: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
    startDate: string | null;
    expectedCompletionDate: string | null;
    clientUserId: string | null;
    clientUser?: { email: string } | null;
    members?: Array<{
      id: string;
      userId: string;
      user?: { email: string };
      memberRole: string;
      isActive: boolean;
      joinedAt: Date;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };

  return {
    id: p.id,
    code: p.code,
    name: p.name,
    name_ar: p.nameAr,
    description: p.description,
    client: p.clientId,
    client_name: p.client?.name ?? null,
    contract: p.contractId,
    contract_reference: p.contract?.referenceCode ?? null,
    status: p.status,
    project_type: p.projectType,
    supervision_type: p.supervisionType,
    assigned_region: p.assignedRegion,
    location: p.location,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    start_date: p.startDate,
    expected_completion_date: p.expectedCompletionDate,
    client_user: p.clientUserId,
    client_user_email: p.clientUser?.email ?? null,
    locations: [],
    members: (p.members ?? []).map((m) => ({
      id: m.id,
      user: m.userId,
      user_email: m.user?.email ?? "",
      member_role: m.memberRole,
      is_active: m.isActive,
      joined_at: m.joinedAt.toISOString(),
      left_at: null,
      created_by: null,
      created_at: m.createdAt.toISOString(),
      updated_at: m.updatedAt.toISOString(),
    })),
    created_by: null,
    updated_by: null,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

const projectInclude = {
  client: true,
  contract: true,
  clientUser: true,
  members: { include: { user: true } },
} as const;

function serializeUser(user: User) {
  const auth = toAuthUser(user);
  return {
    ...auth,
    is_verified: user.isVerified,
    is_staff: user.isStaff,
  };
}

/**
 * Local Next.js replacement for Django `/api/v1/*` endpoints used by the web console.
 */
export async function handleLocalApi(
  method: string,
  pathname: string,
  search: string,
  body: unknown,
  userId: string,
): Promise<Response> {
  await ensureDatabaseReady();
  const path = pathname.replace(/\/$/, "") || "/";
  const page = pageFromSearch(search);
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  // -------- health --------
  if (method === "GET" && path === "/health") {
    return json({ status: "ok", backend: "nextjs" });
  }

  // -------- dashboard summary (single round-trip for Vercel) --------
  if (method === "GET" && path === "/dashboard/summary") {
    const today = params.get("today") || new Date().toISOString().slice(0, 10);
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      upcomingVisits,
      submittedReports,
      underReviewReports,
      openIssues,
      overdueOpen,
      overdueInProgress,
      recentVisits,
      upcomingList,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "active" } }),
      prisma.project.count({ where: { status: "completed" } }),
      prisma.siteVisit.count({
        where: { status: "scheduled", scheduledDate: { gte: today } },
      }),
      prisma.report.count({ where: { status: "submitted" } }),
      prisma.report.count({ where: { status: "under_review" } }),
      prisma.issue.count({ where: { status: "open" } }),
      prisma.issue.count({
        where: { status: "open", dueDate: { lt: today } },
      }),
      prisma.issue.count({
        where: { status: "in_progress", dueDate: { lt: today } },
      }),
      prisma.siteVisit.findMany({
        where: { status: "completed" },
        orderBy: { scheduledDate: "desc" },
        take: 8,
        include: { project: true },
      }),
      prisma.siteVisit.findMany({
        where: { status: "scheduled", scheduledDate: { gte: today } },
        orderBy: { scheduledDate: "asc" },
        take: 8,
        include: { project: true },
      }),
    ]);

    const mapVisit = (v: (typeof recentVisits)[number]) => ({
      id: v.id,
      project: v.projectId,
      project_name: v.project.name,
      status: v.status,
      scheduled_date: v.scheduledDate,
      title: v.title,
      notes: v.notes,
      created_at: v.createdAt.toISOString(),
      updated_at: v.updatedAt.toISOString(),
    });

    return json({
      metrics: {
        totalProjects,
        activeProjects,
        completedProjects,
        upcomingSiteVisits: upcomingVisits,
        pendingReports: submittedReports + underReviewReports,
        openIssues,
        overdueIssues: overdueOpen + overdueInProgress,
      },
      recentSiteVisits: recentVisits.map(mapVisit),
      upcomingSiteVisits: upcomingList.map(mapVisit),
    });
  }

  // -------- stage-templates --------
  if (path === "/stage-templates") {
    if (method === "GET") {
      const rows = await prisma.stageTemplate.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
      return json(
        paginate(
          rows.map((s) => ({
            id: s.id,
            name: s.name,
            name_ar: s.nameAr,
            description: s.description,
            order: s.order,
            is_active: s.isActive,
            created_at: s.createdAt.toISOString(),
            updated_at: s.updatedAt.toISOString(),
          })),
          page,
        ),
      );
    }
    if (method === "POST") {
      const b = (body ?? {}) as Record<string, unknown>;
      const created = await prisma.stageTemplate.create({
        data: {
          name: String(b.name || ""),
          nameAr: String(b.name_ar || ""),
          description: String(b.description || ""),
          order: Number(b.order || 1),
          isActive: b.is_active !== false,
        },
      });
      return json(
        {
          id: created.id,
          name: created.name,
          name_ar: created.nameAr,
          description: created.description,
          order: created.order,
          is_active: created.isActive,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
        201,
      );
    }
  }

  const stageMatch = path.match(/^\/stage-templates\/([^/]+)$/);
  if (stageMatch) {
    const id = stageMatch[1]!;
    if (method === "PATCH") {
      const b = (body ?? {}) as Record<string, unknown>;
      const updated = await prisma.stageTemplate.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.name_ar !== undefined ? { nameAr: String(b.name_ar) } : {}),
          ...(b.description !== undefined
            ? { description: String(b.description) }
            : {}),
          ...(b.order !== undefined ? { order: Number(b.order) } : {}),
          ...(b.is_active !== undefined ? { isActive: Boolean(b.is_active) } : {}),
        },
      });
      return json({
        id: updated.id,
        name: updated.name,
        name_ar: updated.nameAr,
        description: updated.description,
        order: updated.order,
        is_active: updated.isActive,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      });
    }
    if (method === "DELETE") {
      await prisma.stageTemplate.delete({ where: { id } });
      return new Response(null, { status: 204 });
    }
  }

  // -------- admin users --------
  if (path === "/admin/users") {
    if (method === "GET") {
      const searchQ = (params.get("search") || "").toLowerCase();
      const isActive = params.get("is_active");
      const isVerified = params.get("is_verified");
      let rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      if (isActive === "true") rows = rows.filter((u) => u.isActive);
      if (isActive === "false") rows = rows.filter((u) => !u.isActive);
      if (isVerified === "true") rows = rows.filter((u) => u.isVerified);
      if (isVerified === "false") rows = rows.filter((u) => !u.isVerified);
      if (searchQ) {
        rows = rows.filter(
          (u) =>
            u.email.toLowerCase().includes(searchQ) ||
            u.firstName.toLowerCase().includes(searchQ) ||
            u.lastName.toLowerCase().includes(searchQ),
        );
      }
      return json(paginate(rows.map(serializeUser), page));
    }
    if (method === "POST") {
      const b = (body ?? {}) as Record<string, unknown>;
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      if (!email || !password) {
        return json({ detail: "Email and password are required." }, 400);
      }
      const roleCodes = Array.isArray(b.role_codes)
        ? (b.role_codes as string[])
        : ["CLIENT"];
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          firstName: String(b.first_name || ""),
          lastName: String(b.last_name || ""),
          phoneNumber: String(b.phone_number || ""),
          isActive: b.is_active !== false,
          isVerified: b.is_verified !== false,
          rolesJson: JSON.stringify(roleCodes),
        },
      });
      return json(serializeUser(created), 201);
    }
  }

  const adminUserMatch = path.match(/^\/admin\/users\/([^/]+)$/);
  if (adminUserMatch) {
    const id = adminUserMatch[1]!;
    if (method === "PATCH") {
      const b = (body ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (b.first_name !== undefined) data.firstName = String(b.first_name);
      if (b.last_name !== undefined) data.lastName = String(b.last_name);
      if (b.phone_number !== undefined) data.phoneNumber = String(b.phone_number);
      if (b.is_active !== undefined) data.isActive = Boolean(b.is_active);
      if (b.is_verified !== undefined) data.isVerified = Boolean(b.is_verified);
      if (Array.isArray(b.role_codes)) {
        data.rolesJson = JSON.stringify(b.role_codes);
      }
      if (b.password) {
        data.passwordHash = await bcrypt.hash(String(b.password), 10);
      }
      const updated = await prisma.user.update({ where: { id }, data });
      return json(serializeUser(updated));
    }
    if (method === "DELETE") {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return new Response(null, { status: 204 });
    }
  }

  // -------- clients --------
  if (path === "/clients") {
    if (method === "GET") {
      const searchQ = (params.get("search") || "").toLowerCase();
      let rows = await prisma.client.findMany({ orderBy: { name: "asc" } });
      if (searchQ) {
        rows = rows.filter(
          (c) =>
            c.name.toLowerCase().includes(searchQ) ||
            c.code.toLowerCase().includes(searchQ),
        );
      }
      return json(
        paginate(
          rows.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            name_ar: c.nameAr,
            status: c.status,
            tax_id: c.taxId,
            address_line1: "",
            address_line2: "",
            city: c.city,
            region: c.region,
            country_code: c.countryCode,
            postal_code: "",
            notes: c.notes,
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString(),
          })),
          page,
        ),
      );
    }
    if (method === "POST") {
      const b = (body ?? {}) as Record<string, unknown>;
      const created = await prisma.client.create({
        data: {
          code: String(b.code || ""),
          name: String(b.name || ""),
          nameAr: String(b.name_ar || ""),
          status: String(b.status || "active"),
          city: String(b.city || ""),
          region: String(b.region || ""),
          countryCode: String(b.country_code || "OM"),
          notes: String(b.notes || ""),
        },
      });
      return json(
        {
          id: created.id,
          code: created.code,
          name: created.name,
          name_ar: created.nameAr,
          status: created.status,
          tax_id: created.taxId,
          city: created.city,
          region: created.region,
          country_code: created.countryCode,
          notes: created.notes,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
        201,
      );
    }
  }

  const clientMatch = path.match(/^\/clients\/([^/]+)$/);
  if (clientMatch && method === "DELETE") {
    await prisma.client.delete({ where: { id: clientMatch[1]! } });
    return new Response(null, { status: 204 });
  }

  // -------- contracts --------
  if (path === "/contracts") {
    if (method === "GET") {
      const searchQ = (params.get("search") || "").toLowerCase();
      let rows = await prisma.contract.findMany({
        include: { client: true },
        orderBy: { createdAt: "desc" },
      });
      if (searchQ) {
        rows = rows.filter(
          (c) =>
            c.title.toLowerCase().includes(searchQ) ||
            c.referenceCode.toLowerCase().includes(searchQ) ||
            c.client.name.toLowerCase().includes(searchQ),
        );
      }
      return json(
        paginate(
          rows.map((c) => ({
            id: c.id,
            client: c.clientId,
            client_name: c.client.name,
            reference_code: c.referenceCode,
            title: c.title,
            title_ar: c.titleAr,
            status: c.status,
            start_date: null,
            end_date: null,
            planned_visits_per_month: c.plannedVisitsPerMonth,
            scope_summary: c.scopeSummary,
            notes: c.notes,
            commercial_notes: "",
            signed_at: null,
            visit_plans: [],
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString(),
          })),
          page,
        ),
      );
    }
    if (method === "POST") {
      const b = (body ?? {}) as Record<string, unknown>;
      const created = await prisma.contract.create({
        data: {
          clientId: String(b.client || ""),
          referenceCode: String(b.reference_code || ""),
          title: String(b.title || ""),
          titleAr: String(b.title_ar || ""),
          status: String(b.status || "active"),
          plannedVisitsPerMonth:
            b.planned_visits_per_month != null
              ? Number(b.planned_visits_per_month)
              : null,
          scopeSummary: String(b.scope_summary || ""),
          notes: String(b.notes || ""),
        },
        include: { client: true },
      });
      return json(
        {
          id: created.id,
          client: created.clientId,
          client_name: created.client.name,
          reference_code: created.referenceCode,
          title: created.title,
          title_ar: created.titleAr,
          status: created.status,
          planned_visits_per_month: created.plannedVisitsPerMonth,
          scope_summary: created.scopeSummary,
          notes: created.notes,
          visit_plans: [],
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
        201,
      );
    }
  }

  const contractMatch = path.match(/^\/contracts\/([^/]+)$/);
  if (contractMatch) {
    const id = contractMatch[1]!;
    if (method === "GET") {
      const row = await prisma.contract.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!row) return json({ detail: "Not found." }, 404);
      return json({
        id: row.id,
        client: row.clientId,
        client_name: row.client.name,
        reference_code: row.referenceCode,
        title: row.title,
        title_ar: row.titleAr,
        status: row.status,
        planned_visits_per_month: row.plannedVisitsPerMonth,
        scope_summary: row.scopeSummary,
        notes: row.notes,
        visit_plans: [],
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      });
    }
    if (method === "DELETE") {
      await prisma.contract.delete({ where: { id } });
      return new Response(null, { status: 204 });
    }
  }

  // -------- projects --------
  if (path === "/projects") {
    if (method === "GET") {
      const searchQ = (params.get("search") || "").toLowerCase();
      const projectType = params.get("project_type");
      const supervision = params.get("supervision_type");
      const status = params.get("status");
      let rows = await prisma.project.findMany({
        include: projectInclude,
        orderBy: { createdAt: "desc" },
      });
      if (searchQ) {
        rows = rows.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQ) ||
            p.code.toLowerCase().includes(searchQ) ||
            (p.client?.name || "").toLowerCase().includes(searchQ),
        );
      }
      if (projectType) rows = rows.filter((p) => p.projectType === projectType);
      if (supervision)
        rows = rows.filter((p) => p.supervisionType === supervision);
      if (status) rows = rows.filter((p) => p.status === status);
      return json(paginate(rows.map((p) => serializeProject(p)!), page));
    }
    if (method === "POST") {
      const b = (body ?? {}) as Record<string, unknown>;
      const created = await prisma.project.create({
        data: {
          code: String(b.code || ""),
          name: String(b.name || ""),
          nameAr: String(b.name_ar || ""),
          description: String(b.description || ""),
          contractId: String(b.contract || "") || null,
          status: String(b.status || "planning"),
          projectType: String(b.project_type || "other"),
          supervisionType: String(b.supervision_type || "visit_basis"),
          assignedRegion: String(b.assigned_region || ""),
          location: String(b.location || ""),
          address: String(b.address || ""),
          latitude: b.latitude != null ? String(b.latitude) : null,
          longitude: b.longitude != null ? String(b.longitude) : null,
          startDate: b.start_date ? String(b.start_date) : null,
          expectedCompletionDate: b.expected_completion_date
            ? String(b.expected_completion_date)
            : null,
        },
        include: projectInclude,
      });
      // Link client from contract when possible
      if (created.contractId) {
        const contract = await prisma.contract.findUnique({
          where: { id: created.contractId },
        });
        if (contract) {
          await prisma.project.update({
            where: { id: created.id },
            data: { clientId: contract.clientId },
          });
        }
      }
      const full = await prisma.project.findUnique({
        where: { id: created.id },
        include: projectInclude,
      });
      return json(serializeProject(full), 201);
    }
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = projectMatch[1]!;
    if (method === "GET") {
      const row = await prisma.project.findUnique({
        where: { id },
        include: projectInclude,
      });
      if (!row) return json({ detail: "Not found." }, 404);
      return json(serializeProject(row));
    }
    if (method === "PATCH") {
      const b = (body ?? {}) as Record<string, unknown>;
      await prisma.project.update({
        where: { id },
        data: {
          ...(b.code !== undefined ? { code: String(b.code) } : {}),
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.name_ar !== undefined ? { nameAr: String(b.name_ar) } : {}),
          ...(b.description !== undefined
            ? { description: String(b.description) }
            : {}),
          ...(b.contract !== undefined
            ? { contractId: String(b.contract || "") || null }
            : {}),
          ...(b.status !== undefined ? { status: String(b.status) } : {}),
          ...(b.project_type !== undefined
            ? { projectType: String(b.project_type) }
            : {}),
          ...(b.supervision_type !== undefined
            ? { supervisionType: String(b.supervision_type) }
            : {}),
          ...(b.assigned_region !== undefined
            ? { assignedRegion: String(b.assigned_region) }
            : {}),
          ...(b.location !== undefined ? { location: String(b.location) } : {}),
          ...(b.address !== undefined ? { address: String(b.address) } : {}),
          ...(b.latitude !== undefined
            ? { latitude: b.latitude != null ? String(b.latitude) : null }
            : {}),
          ...(b.longitude !== undefined
            ? { longitude: b.longitude != null ? String(b.longitude) : null }
            : {}),
        },
      });

      if (Array.isArray(b.members)) {
        await prisma.projectMember.deleteMany({ where: { projectId: id } });
        const members = b.members as Array<Record<string, unknown>>;
        for (const m of members) {
          const userRef = String(m.user || "");
          if (!userRef) continue;
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ id: userRef }, { email: userRef.toLowerCase() }],
            },
          });
          if (!user) continue;
          await prisma.projectMember.create({
            data: {
              projectId: id,
              userId: user.id,
              memberRole: String(m.member_role || "viewer"),
              isActive: m.is_active !== false,
            },
          });
        }
      }

      const full = await prisma.project.findUnique({
        where: { id },
        include: projectInclude,
      });
      return json(serializeProject(full));
    }
    if (method === "DELETE") {
      await prisma.project.delete({ where: { id } });
      return new Response(null, { status: 204 });
    }
  }

  const projectStagesMatch = path.match(/^\/projects\/([^/]+)\/stages$/);
  if (projectStagesMatch) {
    const projectId = projectStagesMatch[1]!;
    if (method === "GET") {
      const rows = await prisma.projectStage.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
      });
      return json(
        paginate(
          rows.map((s) => ({
            id: s.id,
            project: s.projectId,
            name: s.name,
            name_ar: s.nameAr,
            description: s.description,
            order: s.order,
            status: s.status,
            start_date: s.startDate,
            completion_date: s.completionDate,
            created_by: null,
            updated_by: null,
            created_at: s.createdAt.toISOString(),
            updated_at: s.updatedAt.toISOString(),
          })),
          page,
        ),
      );
    }
    if (method === "POST") {
      const b = (body ?? {}) as Record<string, unknown>;
      const created = await prisma.projectStage.create({
        data: {
          projectId,
          name: String(b.name || ""),
          nameAr: String(b.name_ar || ""),
          description: String(b.description || ""),
          order: Number(b.order || 1),
          status: String(b.status || "not_started"),
          startDate: b.start_date ? String(b.start_date) : null,
          completionDate: b.completion_date ? String(b.completion_date) : null,
        },
      });
      return json(
        {
          id: created.id,
          project: created.projectId,
          name: created.name,
          name_ar: created.nameAr,
          description: created.description,
          order: created.order,
          status: created.status,
          start_date: created.startDate,
          completion_date: created.completionDate,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
        201,
      );
    }
  }

  const projectStageOneMatch = path.match(
    /^\/projects\/([^/]+)\/stages\/([^/]+)$/,
  );
  if (projectStageOneMatch) {
    const stageId = projectStageOneMatch[2]!;
    if (method === "PATCH") {
      const b = (body ?? {}) as Record<string, unknown>;
      const updated = await prisma.projectStage.update({
        where: { id: stageId },
        data: {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.name_ar !== undefined ? { nameAr: String(b.name_ar) } : {}),
          ...(b.description !== undefined
            ? { description: String(b.description) }
            : {}),
          ...(b.order !== undefined ? { order: Number(b.order) } : {}),
          ...(b.status !== undefined ? { status: String(b.status) } : {}),
          ...(b.start_date !== undefined
            ? { startDate: b.start_date ? String(b.start_date) : null }
            : {}),
          ...(b.completion_date !== undefined
            ? {
                completionDate: b.completion_date
                  ? String(b.completion_date)
                  : null,
              }
            : {}),
        },
      });
      return json({
        id: updated.id,
        project: updated.projectId,
        name: updated.name,
        name_ar: updated.nameAr,
        description: updated.description,
        order: updated.order,
        status: updated.status,
        start_date: updated.startDate,
        completion_date: updated.completionDate,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      });
    }
    if (method === "DELETE") {
      await prisma.projectStage.delete({ where: { id: stageId } });
      return new Response(null, { status: 204 });
    }
  }

  // -------- site-visits / issues / reports (list stubs for dashboard) --------
  if (path === "/site-visits" && method === "GET") {
    const status = params.get("status");
    const project = params.get("project");
    let rows = await prisma.siteVisit.findMany({
      orderBy: { createdAt: "desc" },
      include: { project: true },
    });
    if (status) rows = rows.filter((v) => v.status === status);
    if (project) rows = rows.filter((v) => v.projectId === project);
    return json(
      paginate(
        rows.map((v) => ({
          id: v.id,
          project: v.projectId,
          project_name: v.project.name,
          status: v.status,
          scheduled_date: v.scheduledDate,
          title: v.title,
          notes: v.notes,
          created_at: v.createdAt.toISOString(),
          updated_at: v.updatedAt.toISOString(),
        })),
        page,
      ),
    );
  }

  if (path === "/issues" && method === "GET") {
    const status = params.get("status");
    const project = params.get("project");
    let rows = await prisma.issue.findMany({ orderBy: { createdAt: "desc" } });
    if (status) rows = rows.filter((i) => i.status === status);
    if (project) rows = rows.filter((i) => i.projectId === project);
    return json(
      paginate(
        rows.map((i) => ({
          id: i.id,
          project: i.projectId,
          status: i.status,
          title: i.title,
          due_date: i.dueDate,
          created_at: i.createdAt.toISOString(),
          updated_at: i.updatedAt.toISOString(),
        })),
        page,
      ),
    );
  }

  if (path === "/reports" && method === "GET") {
    const status = params.get("status");
    const project = params.get("project");
    let rows = await prisma.report.findMany({ orderBy: { createdAt: "desc" } });
    if (status) rows = rows.filter((r) => r.status === status);
    if (project) rows = rows.filter((r) => r.projectId === project);
    return json(
      paginate(
        rows.map((r) => ({
          id: r.id,
          project: r.projectId,
          status: r.status,
          title: r.title,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
        })),
        page,
      ),
    );
  }

  void userId;
  return json(
    {
      detail: `Next.js backend: endpoint ${method} ${path} is not implemented yet.`,
    },
    501,
  );
}
